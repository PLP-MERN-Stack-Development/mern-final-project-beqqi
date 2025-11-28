import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';

// --- Configuration ---
// The base URL is assumed to be running locally on port 3001.

import axios from 'axios';
import { List, PlusCircle, Save, Trash2, XCircle, Loader, Calendar, Share2 } from 'lucide-react';

// Define global Clerk hooks/components for easy access and typing consistency
const ClerkProvider = window.Clerk ? window.Clerk.ClerkProvider : ({ children }) => <div>{children}</div>;
const SignedIn = window.Clerk ? window.Clerk.SignedIn : ({ children }) => <div>{children}</div>;
const SignedOut = window.Clerk ? window.Clerk.SignedOut : ({ children }) => <div>{children}</div>;
const UserButton = window.Clerk ? window.Clerk.UserButton : () => <div className="p-2 bg-gray-300 rounded-full">User</div>;
const useAuth = window.Clerk ? window.Clerk.useAuth : () => ({ isLoaded: true, getToken: async() => null });
const useUser = window.Clerk ? window.Clerk.useUser : () => ({ user: null });

// --- Configuration ---
// The base URL is assumed to be running locally on port 3001.
const API_BASE_URL = 'http://localhost:3001'; 
const CLERK_PUBLISHABLE_KEY = typeof pk_test_YmVsb3ZlZC1sb2JzdGVyLTMzLmNsZXJrLmFjY291bnRzLmRldiQ !== 'undefined' ? pk_test_YmVsb3ZlZC1sb2JzdGVyLTMzLmNsZXJrLmFjY291bnRzLmRldiQ : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;


// --- Axios Setup ---
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Axios Interceptor to add Clerk token for protected routes
api.interceptors.request.use(async (config) => {
    try {
        // Now using window.Clerk.session.getToken() directly as a dependency workaround
        if (window.Clerk && window.Clerk.session) {
            const token = await window.Clerk.session.getToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.warn("No Clerk token available for request.");
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});


// --- State Management and Handlers (Simplified for Starter) ---

const initialGiftState = [{ name: '', price: '' }];

// --- UI Components ---

function Navbar() {
    return (
        <nav className="bg-purple-800 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <a href="/" className="flex-shrink-0 text-white font-extrabold text-2xl tracking-tight rounded-lg p-1 transition-transform hover:scale-105">
                        UbuPresent
                    </a>
                    <div className="flex items-center">
                        <SignedIn>
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    <a href="/dashboard" className="text-white hover:bg-purple-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                                        <List className="w-5 h-5 mr-1" /> My Events
                                    </a>
                                    <a href="/create" className="text-white bg-teal-500 hover:bg-teal-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors shadow-md">
                                        <PlusCircle className="w-5 h-5 mr-1" /> Create Event
                                    </a>
                                </div>
                            </div>
                            <div className="ml-4 flex items-center">
                                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 ring-2 ring-white ring-offset-2 ring-offset-purple-800" }}} />
                            </div>
                        </SignedIn>
                        <SignedOut>
                            <a 
                                href="/sign-in" 
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-500 hover:bg-teal-600 transition-colors shadow-md"
                            >
                                Sign In / Sign Up
                            </a>
                        </SignedOut>
                    </div>
                </div>
            </div>
        </nav>
    );
}

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-gray-50">
            <div className="text-center max-w-3xl">
                <h1 className="text-6xl font-extrabold text-gray-900 mb-4 tracking-tighter">
                    Fund Dreams, Not Duplicates.
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    UbuPresent revolutionizes gifting by letting you collaboratively chip in towards the perfect, pre-selected gift via mobile money.
                </p>
                
                <a 
                    href="/sign-in" 
                    className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-xl shadow-2xl text-white bg-purple-800 hover:bg-purple-700 transition-all duration-300 transform hover:scale-[1.02]"
                >
                    Get Started - Host an Event
                </a>

                <p className="mt-8 text-sm text-gray-500">
                    Already contributing? View an event link to chip in!
                </p>
            </div>
        </div>
    );
}

function EventCard({ event, navigate }) {
    const totalTarget = event.gifts.reduce((sum, gift) => sum + gift.price, 0);
    const totalCollected = event.gifts.reduce((sum, gift) => sum + gift.collected, 0);
    const progress = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;
    
    // Format date nicely
    const eventDate = new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-6 flex-grow">
                <h3 className="text-xl font-bold text-purple-800 mb-2">{event.title}</h3>
                <p className="text-sm text-gray-500 mb-4 flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-teal-500" /> 
                    Event Date: <span className="font-semibold text-gray-700 ml-1">{eventDate}</span>
                </p>
                
                {/* Progress Bar */}
                <div className="space-y-1 mb-4 pt-2 border-t border-gray-100">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span className="font-bold text-teal-600">{progress}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className="bg-teal-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-right">
                        KES {totalCollected.toLocaleString()} / KES {totalTarget.toLocaleString()} raised
                    </p>
                </div>
                
                <p className="text-gray-700 text-sm italic mt-4">{event.gifts.length} Gifts registered</p>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-between">
                <button
                    onClick={() => navigate(`/event/${event._id}`)}
                    className="flex-1 mr-2 px-4 py-2 text-sm font-medium rounded-lg text-purple-800 border border-purple-300 hover:bg-purple-50 transition-colors flex items-center justify-center"
                >
                    <Share2 className="w-4 h-4 mr-1" /> View & Share Link
                </button>
                <button
                    onClick={() => navigate(`/event/${event._id}/edit`)} // Placeholder for future edit route
                    className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md"
                >
                    Manage
                </button>
            </div>
        </div>
    );
}


function Dashboard() {
    const { user } = useUser();
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [apiTestResult, setApiTestResult] = useState('Testing protected route...');
    const [statusClass, setStatusClass] = useState('bg-gray-50');
    const navigate = useNavigate();

    // 1. API Status Test (existing)
    useEffect(() => {
        const testProtectedApi = async () => {
            try {
                const res = await api.get('/api/protected');
                setApiTestResult(`API Test Success: ${res.data.message} (Auth verified by backend)`);
                setStatusClass('bg-green-100');
            } catch (err) {
                // Expect 401 if backend is running but auth token isn't provided or invalid
                setApiTestResult(`API Test Failed (401 expected if signed out): ${err.response?.data?.error || err.message}`);
                setStatusClass('bg-red-100');
                console.error("Protected API Test Error:", err);
            }
        };
        testProtectedApi();
    }, []);

    // 2. Fetch User Events
    const fetchEvents = async () => {
        setLoadingEvents(true);
        try {
            // GET /api/events should return events created by the current Clerk user
            const res = await api.get('/api/events');
            setEvents(res.data);
        } catch (err) {
            console.error("Failed to fetch user events:", err);
            // Optional: set an error state here
        } finally {
            setLoadingEvents(false);
        }
    };
    
    useEffect(() => {
        // Only run if the Clerk user object is loaded (which happens quickly after sign-in)
        if (user) {
            fetchEvents();
        }
    }, [user]);

    // Display user's full name if available, otherwise default to a general greeting
    const hostName = user?.fullName || user?.username || 'Host';

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome, {hostName}!</h1>
            <p className="text-xl text-gray-600 mb-8">This is your event dashboard. Manage your crowdfunding events below.</p>
            
            {/* API Status Test Box (Keep for debugging) */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-800/20 mb-8">
                <p className="font-semibold text-lg text-purple-800 mb-2">Current System Status:</p>
                <p id="api-test-result" className={`text-gray-700 mb-4 font-mono text-sm p-2 rounded ${statusClass}`}>
                    {apiTestResult}
                </p>
                <p className="text-gray-700 text-sm">This checks the connection to your running backend and confirms authenticated access via Clerk token.</p>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2">My Crowdfunding Events ({events.length})</h2>

            {loadingEvents ? (
                <div className="flex items-center justify-center p-10 bg-white rounded-xl shadow-lg">
                    <Loader className="w-6 h-6 animate-spin text-purple-800" />
                    <p className="ml-3 text-lg text-purple-800">Loading your events...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="bg-white p-10 rounded-xl shadow-lg border-2 border-dashed border-gray-300 text-center">
                    <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-gray-700 mb-2">No events created yet!</p>
                    <p className="text-gray-500 mb-6">It looks like you haven't set up any UbuPresent events.</p>
                    <button 
                        onClick={() => navigate('/create')}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-teal-500 hover:bg-teal-600 transition-colors"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" /> Create Your First Event
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => <EventCard key={event._id} event={event} navigate={navigate} />)}
                </div>
            )}
        </div>
    );
}

function EventCreation() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [eventDetails, setEventDetails] = useState({ title: '', date: new Date().toISOString().substring(0, 10) });
    const [gifts, setGifts] = useState(initialGiftState);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: null, text: null });

    const handleEventChange = (e) => {
        setEventDetails({ ...eventDetails, [e.target.name]: e.target.value });
        setMessage({ type: null, text: null });
    };

    const handleGiftChange = (e, index) => {
        const { name, value } = e.target;
        const newGifts = gifts.map((gift, i) => {
            if (i === index) {
                return { 
                    ...gift, 
                    [name]: name === 'price' ? (value === '' ? '' : Number(value)) : value 
                };
            }
            return gift;
        });
        setGifts(newGifts);
        setMessage({ type: null, text: null });
    };

    const addGift = () => {
        setGifts([...gifts, { name: '', price: '' }]);
        setMessage({ type: null, text: null });
    };

    const removeGift = (index) => {
        if (gifts.length > 1) {
            setGifts(gifts.filter((_, i) => i !== index));
            setMessage({ type: null, text: null });
        }
    };
    
    const validateForm = () => {
        if (!eventDetails.title.trim() || !eventDetails.date) {
            setMessage({ type: 'error', text: "Please fill in the event title and date." });
            return false;
        }
        
        const validGifts = gifts.filter(g => g.name.trim() && g.price > 0);
        if (validGifts.length === 0) {
            setMessage({ type: 'error', text: "Please add at least one gift with a name and a price greater than 0." });
            return false;
        }
        
        const hasInvalidEntries = gifts.some(g => 
            (g.name.trim() && (g.price === '' || g.price <= 0)) || (!g.name.trim() && g.price !== '')
        );

        if (hasInvalidEntries) {
             setMessage({ type: 'error', text: "All gifts must have both a name and a price greater than 0. Please correct invalid entries or remove them." });
             return false;
        }
        
        return true;
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: null, text: null });
        
        if (!validateForm()) {
            setLoading(false);
            return;
        }

        const validGifts = gifts.filter(g => g.name.trim() && g.price > 0);
        
        if (!user) {
            setLoading(false);
            setMessage({ type: 'error', text: "Authentication failed. Please sign in again." });
            return;
        }

        const newEvent = {
            ...eventDetails,
            gifts: validGifts.map(g => ({
                name: g.name.trim(),
                price: g.price,
                collected: 0, // Initialize collected to 0
                contributors: [] // Initialize contributors array
            })),
            hostName: user.fullName || user.username || 'Host',
        };

        try {
            // POST to the protected endpoint /api/events
            await api.post('/api/events', newEvent);
            setMessage({ type: 'success', text: "Event created successfully! Redirecting..." });
            
            // Redirect to the dashboard
            setTimeout(() => {
                navigate('/dashboard'); 
                setEventDetails({ title: '', date: new Date().toISOString().substring(0, 10) });
                setGifts(initialGiftState);
            }, 1500);

        } catch (err) {
            console.error("Event creation failed:", err.response ? err.response.data : err.message);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || "Failed to create event. Check console/network for details." 
            });
        } finally {
            setLoading(false);
        }
    }


    // --- Render Logic ---

    const MessageBanner = () => {
        if (!message.text) return null;
        const isError = message.type === 'error';
        const Icon = isError ? XCircle : Save;

        return (
            <div className={`p-4 rounded-lg flex items-center mb-4 ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                <Icon className="w-5 h-5 mr-3" />
                <p className="font-medium">{message.text}</p>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-purple-800 mb-6">Create New UbuPresent Event</h1>
            <p className="text-gray-600 mb-8">Define the occasion and the gifts you wish to crowdfund.</p>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                <MessageBanner />

                {/* Event Details Section */}
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-100">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Event Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={eventDetails.title}
                                onChange={handleEventChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-800 focus:border-purple-800 transition"
                                placeholder="E.g., My 30th Birthday Celebration"
                            />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={eventDetails.date}
                                onChange={handleEventChange}
                                required
                                min={new Date().toISOString().substring(0, 10)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-800 focus:border-purple-800 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Gifts Section */}
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-2xl font-semibold text-gray-800">Gift Registry</h2>
                            <button
                            type="button"
                            onClick={addGift}
                            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-teal-500 hover:bg-teal-600 transition-colors"
                        >
                            <PlusCircle className="w-5 h-5 mr-1" /> Add Gift
                        </button>
                    </div>

                    <div className="space-y-4">
                        {gifts.map((gift, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 border border-dashed border-gray-200 rounded-lg bg-gray-50 items-center">
                                <div className="flex-1 w-full">
                                    <label htmlFor={`gift-name-${index}`} className="block text-xs font-medium text-gray-500 mb-1">Gift Name</label>
                                    <input
                                        type="text"
                                        id={`gift-name-${index}`}
                                        name="name"
                                        value={gift.name}
                                        onChange={(e) => handleGiftChange(e, index)}
                                        placeholder="E.g., High-End Espresso Machine"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        required
                                    />
                                </div>
                                
                                <div className="w-full sm:w-32">
                                    <label htmlFor={`gift-price-${index}`} className="block text-xs font-medium text-gray-500 mb-1">Target Price (KES)</label>
                                    <input
                                        type="number"
                                        id={`gift-price-${index}`}
                                        name="price"
                                        value={gift.price}
                                        onChange={(e) => handleGiftChange(e, index)}
                                        placeholder="50000"
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        required
                                    />
                                </div>

                                {gifts.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeGift(index)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors self-end sm:self-center"
                                        title="Remove Gift"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                {/* Placeholder to maintain alignment if only one gift is present */}
                                {gifts.length <= 1 && <div className="w-10"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                
                <button
                    type="submit"
                    id="submit-button"
                    disabled={loading}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-purple-800 hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                    {loading ? <><Loader className="w-5 h-5 mr-3 animate-spin" /> Creating Event...</> : <><Save className="w-5 h-5 mr-3" /> Finalize Event</>}
                </button>
            </form>
        </div>
    );
}

function EventView() {
     const { id } = useParams(); 
     return (
         <div className="p-8 max-w-4xl mx-auto">
             <h1 className="text-3xl font-bold text-gray-900 mb-4">Viewing Event Details for ID: {id || '...'}</h1>
             <div className="bg-white p-6 rounded-xl shadow-lg border">
                 <p className="text-gray-600">This is the public gift registry page where guests chip in. We will fetch and display event details here.</p>
             </div>
         </div>
     );
}

function MainContent() {
    const { isLoaded } = useAuth();

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader className="w-8 h-8 animate-spin text-purple-800" />
                <p className="ml-3 text-lg text-purple-800">Loading Application...</p>
            </div>
        );
    }
    
    // Clerk handles redirection to /sign-in route via routing element setup
    return (
        <main className="min-h-screen pt-4 pb-10 bg-gray-50">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<SignedIn><Dashboard /></SignedIn>} />
                <Route path="/create" element={<SignedIn><EventCreation /></SignedIn>} />
                {/* Note: The Clerk Sign-in component is automatically handled by the ClerkProvider */}
                <Route path="/sign-in/*" element={<div className="p-8 max-w-md mx-auto">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full text-center border border-purple-200">
                        <h2 className="text-3xl font-bold text-purple-800 mb-4">Sign In / Sign Up</h2>
                        <p className="text-gray-600 mb-6">Clerk will mount the authentication forms here.</p>
                        {/* Clerk's routing will handle rendering the Sign-in/up components */}
                    </div>
                </div>} /> 
                <Route path="/event/:id" element={<EventView />} />
                <Route path="*" element={<h1 className="p-8 text-center text-3xl font-bold">404 - Not Found</h1>} />
            </Routes>
        </main>
    );
}

export default function App() {
    // Check key and display error if missing
    if (!CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY === 'YOUR_CLERK_PUBLISHABLE_KEY_FALLBACK') {
        return (
             <div className="flex items-center justify-center min-h-screen bg-red-100 p-4">
                 <div className="text-center bg-white p-8 rounded-lg shadow-xl">
                     <h1 className="text-3xl font-bold text-red-600 mb-4">Clerk Key Missing</h1>
                     <p className="text-gray-700">
                         Please set the <code className="font-mono bg-gray-200 p-1 rounded">CLERK_PUBLISHABLE_KEY</code> by replacing the fallback value in the code.
                     </p>
                     <p className="text-sm mt-4 text-gray-500">
                        The key should be available from your Clerk dashboard.
                     </p>
                 </div>
             </div>
         );
    }
    
    return (
        <Router>
            <ClerkProvider 
                publishableKey={CLERK_PUBLISHABLE_KEY} 
                afterSignInUrl="/dashboard"
                afterSignUpUrl="/dashboard"
                signInUrl="/sign-in"
                signUpUrl="/sign-in"
            >
                <Navbar />
                <MainContent />
            </ClerkProvider>
        </Router>
    );
}