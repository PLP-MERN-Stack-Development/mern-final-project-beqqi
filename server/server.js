import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config'; 
import { ClerkExpressRequireAuth } from '@clerk/express'; 

// --- Configuration ---
const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

// --- Middleware Setup ---
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Fallback for local dev
    credentials: true,
}));
app.use(express.json()); // For parsing application/json

// --- Database Connection ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.error('CRITICAL MONGO ERROR: Please check your MONGO_URI and MongoDB Atlas Network Access settings.');
        // Exit process on failure (critical)
        process.exit(1);
    });

// --- 1. Mongoose Model (Event) ---

// Schema for a single gift item within an event
const GiftSchema = new mongoose.Schema({
    name: { type: String, required: true },
    imageUrl: { type: String, default: 'https://placehold.co/400x200/52525B/FFFFFF?text=Gift+Image' },
    price: { type: Number, required: true, min: 1 },
    collected: { type: Number, default: 0 },
    contributors: [{
        userId: { type: String, default: 'guest' }, // Clerk ID or 'guest'
        name: { type: String, default: 'Anonymous' },
        amount: { type: Number, required: true },
        phone: { type: String } // Mobile Money number used
    }],
});

// Schema for tracking simulated transactions
const TransactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    giftId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    phone: { type: String, required: true },
    contributorName: { type: String, default: 'Anonymous' }, // Added to TransactionSchema for the callback logic
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
    createdAt: { type: Date, default: Date.now, expires: '1h' }, // Pending transactions expire after 1 hour
});

// Main Event Schema
const EventSchema = new mongoose.Schema({
    hostId: { type: String, required: true }, // Clerk User ID
    hostName: { type: String, default: 'Event Host' }, // Display Name from Clerk
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    gifts: [GiftSchema],
    transactions: [TransactionSchema], // Transactions stored as sub-documents
}, { timestamps: true });

const Event = mongoose.model('Event', EventSchema);

// --- 2. Clerk Authentication Middleware ---

// This middleware checks for a valid Clerk JWT in the Authorization header.
const requireAuth = ClerkExpressRequireAuth({
    onError: (err) => {
        console.error("Clerk Auth Error:", err);
        return {
            statusCode: 401,
            json: { error: 'Authentication Failed', details: err.message },
        };
    }
});


// --- 3. Routes ---

// Default status route
app.get('/', (req, res) => {
    res.json({ message: 'UbuPresent API is running.' });
});

// Protected route for testing Clerk auth
app.get('/api/protected', requireAuth, (req, res) => {
    // req.auth now contains the auth state, req.auth.userId is available
    res.json({ message: 'Auth success!', userId: req.auth.userId });
});


// --- Event Management Routes ---

// POST /api/events - Create a new event (PROTECTED)
app.post('/api/events', requireAuth, async (req, res) => {
    try {
        // req.auth.userId is the Clerk user ID
        const { title, date, gifts, hostName } = req.body;

        const newEvent = new Event({
            hostId: req.auth.userId,
            hostName: hostName || 'Event Host',
            title,
            date,
            gifts: gifts.map(g => ({
                name: g.name,
                imageUrl: g.imageUrl,
                price: parseFloat(g.price),
                collected: 0,
            })),
        });

        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating event', error: error.message });
    }
});

// GET /api/events/:id - Get a single event (PUBLIC)
app.get('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id, '-transactions'); // Don't expose transactions
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event', error: error.message });
    }
});


// --- Simulated Mobile Money Payment Routes ---

// POST /api/payments/initiate - Simulates M-PESA/Telebirr initiation
// This route is PUBLIC as guests don't need to be logged in to contribute.
app.post('/api/payments/initiate', async (req, res) => {
    const { eventId, giftId, amount, phone, contributorName } = req.body;

    if (!eventId || !giftId || !amount || !phone || amount <= 0) {
        return res.status(400).json({ message: 'Missing required payment details.' });
    }

    // 1. Check if event and gift exist
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    
    // Find the gift sub-document using .id()
    const gift = event.gifts.id(giftId);
    if (!gift) return res.status(404).json({ message: 'Gift not found.' });

    // 2. Create a unique transaction ID (simulating external provider)
    const transactionId = Math.random().toString(36).substring(2, 15) + Date.now();

    // 3. Create a PENDING transaction sub-document
    const newTransaction = {
        transactionId,
        eventId,
        giftId,
        amount: parseFloat(amount),
        phone,
        status: 'PENDING',
        contributorName: contributorName || 'Anonymous',
    };
    event.transactions.push(newTransaction);
    await event.save();

    // 4. Return the transaction ID for the client to use/poll (in a real app)
    res.json({
        message: 'Payment initiation successful. Check your mobile for the prompt.',
        transactionId: transactionId,
    });
});

// POST /api/payments/callback - SIMULATED WEBHOOK/CONFIRMATION
// This route should be secured with a secret key in a real deployment!
// For MVP, we treat it as an internal simulation endpoint.
app.post('/api/payments/callback', async (req, res) => {
    const { transactionId, status } = req.body;

    if (!transactionId || !['SUCCESS', 'FAILED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid callback data.' });
    }

    // Since transactions are nested, finding them is tricky. We'll search all events.
    const event = await Event.findOne({ 'transactions.transactionId': transactionId });
    if (!event) {
        return res.status(404).json({ message: 'Transaction not found for any event.' });
    }

    const transaction = event.transactions.find(t => t.transactionId === transactionId);
    if (!transaction) {
        return res.status(404).json({ message: 'Transaction record mismatch.' });
    }

    // Prevent double processing
    if (transaction.status !== 'PENDING') {
        return res.status(200).json({ message: `Transaction already processed as ${transaction.status}.` });
    }

    // 1. Update Transaction Status
    transaction.status = status;

    if (status === 'SUCCESS') {
        // 2. Update Gift Funding (CRITICAL LOGIC)
        const gift = event.gifts.id(transaction.giftId);
        if (gift) {
            const amount = transaction.amount;
            
            // Calculate actual contribution amount (clamped at remaining target price)
            const remaining = gift.price - gift.collected;
            let contributionAmount = amount;

            if (remaining <= 0) {
                 contributionAmount = 0; // Gift is already fully funded
            } else if (amount > remaining) {
                contributionAmount = remaining; // Only take what's needed
            }
            
            // Only update if there's a positive amount left to contribute
            if (contributionAmount > 0) {
                // Update collected amount
                gift.collected += contributionAmount;

                // Add contributor record
                gift.contributors.push({
                    userId: transaction.userId || 'guest',
                    name: transaction.contributorName,
                    amount: contributionAmount,
                    phone: transaction.phone,
                });
            } else {
                // If it was overfunded already, just log a warning.
                console.warn(`Transaction ${transactionId} processed, but gift was already fully funded. Funds may be over-contributed in simulation.`);
            }
        }
    }
    
    // 3. Save all changes to the event
    await event.save();
    res.json({ message: `Transaction ${transactionId} processed successfully. Gift updated: ${status}` });
});


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // FIX: Using the same fallback logic for logging as in CORS middleware
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    console.log(`Client URL expected at: ${clientUrl}`);
});