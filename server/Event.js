import mongoose from 'mongoose';

const { Schema } = mongoose;

// Defines the sub-document schema for a single contribution/contributor
const ContributorSchema = new Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    phone: { type: String, required: true }, // Mobile money phone number
    date: { type: Date, default: Date.now },
}, { _id: true }); // We want MongoDB to automatically assign an ID to each contribution

// Defines the sub-document schema for a single gift item
const GiftSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 1 }, // Target price
    collected: { type: Number, default: 0 }, // Total amount collected so far
    contributors: [ContributorSchema], // Array of contributions toward this gift
}, { _id: true }); // We want MongoDB to automatically assign an ID to each gift

// Defines the main document schema for an Event
const EventSchema = new Schema({
    hostId: { type: String, required: true, index: true }, // The Clerk User ID
    hostName: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    gifts: [GiftSchema], // Array of gifts for this event
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

const Event = mongoose.model('Event', EventSchema);

export default Event;