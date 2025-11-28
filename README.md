UbuPresent: African Gift Registry with Mobile Money Integration

Version 1.0 (Minimum Viable Product - MVP)

🎁 Project Overview
UbuPresent is a group gifting platform tailored for African markets, enabling users to create event gift registries (like weddings, birthdays, or graduations). It is built on the MERN stack and uses Clerk for robust authentication, featuring a simulated Mobile Money payment flow (like M-PESA or Telebirr) to facilitate small, collaborative contributions towards larger gifts.
Core Architecture
Frontend: React (Vite) with Tailwind CSS for a modern, responsive user experience.
Backend: Node.js, Express, and MongoDB (Mongoose) for scalable API services.
Authentication: Clerk is used for secure user registration, sign-in, and session management.
Payments: A simulated payment flow demonstrating the typical Initiation and Callback (Webhook) logic of Mobile Money operators.

✨ Key Features
User Experience
User Authentication: Secure sign-up and login via Clerk.
Event Creation: Authenticated users can create new gift registries with multiple goal-based gifts.
Public Event View: Shareable, public URLs allow contributors (authenticated or guests) to view the registry.
Progress Tracking: Visual progress bars show how much money has been collected for each gift goal.
Backend & Payments
Gift Tracking: MongoDB stores events, individual gifts, and tracks the collected amount versus the target price.
Protected Routes: API endpoints for creating events are secured using Clerk's authentication tokens.
Simulated Payment Flow:
Initiation: A user submits a contribution amount and phone number. The server records the transaction and simulates sending an external payment request.
Callback: A dedicated callback endpoint (simulating a webhook from a mobile money operator) processes the successful payment, updating the event's collected amount in the MongoDB database.

🛠️ Installation and Setup
Prerequisites
Node.js (v18+)
MongoDB Instance (Local or remote Atlas cluster)
A Clerk account for API keys.
1. Backend Setup (/server)
Navigate to the server directory:

cd server


Install dependencies:

npm install


Configure Environment Variables: Create a file named .env in the /server directory and populate it with the following keys:
# --- MongoDB ---
MONGO_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/ubu-present?retryWrites=true&w=majority"

# --- Clerk Authentication ---
# Obtain these from your Clerk Dashboard
CLERK_SECRET_KEY="sk_test_..." 

# --- Server Settings ---
PORT=3000


Run the Backend Server:
node server.js

The server will start on the configured port (default 3000).

2. Frontend Setup (/client)
Navigate to the client directory:

cd client


Install dependencies:

npm install


Configure Environment Variables: Create a file named .env in the /client directory and populate it with the following keys. Note: The VITE_API_BASE_URL must point to your running backend.
# --- Clerk Frontend Key ---
# This key is public and obtained from your Clerk Dashboard
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."

# --- Backend Connection ---
# Must match the server's port (e.g., http://localhost:3000)
VITE_API_BASE_URL="http://localhost:3000" 


Run the Frontend Application:

npm run dev

The application will typically open at http://localhost:5173 (or similar, depending on Vite configuration).
🚀 Usage Guide
Sign Up/In: Access the application and sign in using Clerk.
Create an Event: Navigate to the / (Dashboard) and click the Create New Gift Registry button. Fill in the event details and at least one gift goal (Name and Target Price are required).
Get the Public Link: Upon creation, you will be redirected to the public event URL (e.g., /events/66a65...).
Simulate Contribution:
Open the public event URL in a different browser or an Incognito window (simulating a guest contributor).
Click Chip In Now on a gift.
Enter a name, a simulated Mobile Money phone number, and an amount.
Upon submission, the client-side code simulates a successful webhook callback after 3 seconds, which instantly updates the MongoDB record via the backend.
Verify Progress: After the simulated payment success message, the progress bar and collected amount on the public page will reflect the new contribution.
This project demonstrates a real-world flow for authenticated event management and collaborative, tracked payment handling.
