
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut as firebaseSignOut, 
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    deleteDoc, 
    getDocs, 
    query, 
    orderBy,
    addDoc 
} from 'firebase/firestore';
import { DecisionRecord, FeedbackSubmission } from '../types';

// --- CONFIGURATION ---
// IMPORTANT: Replace the values below with your specific Firebase Project config.
// You can find this in the Firebase Console under Project Settings -> General -> Your Apps.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID"
};

// --- VALIDATION CHECK ---
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

if (!isConfigured) {
    console.warn("⚠️ Firebase is not configured. Please update services/firebase.ts with your Firebase keys.");
}

// Initialize Firebase
// We only initialize if configured to avoid crashing the app immediately with invalid config errors
const app = isConfigured ? initializeApp(firebaseConfig) : undefined;
const auth = app ? getAuth(app) : undefined;
const db = app ? getFirestore(app) : undefined;
const googleProvider = new GoogleAuthProvider();

// --- AUTH SERVICES ---

export const signInWithGoogle = async () => {
    if (!auth) {
        alert("Firebase is not configured. Please see the console for details.");
        return;
    }
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const signOut = async () => {
    if (!auth) return;
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    if (!auth) {
        // If not configured, just behave as if logged out
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
};

// --- DATABASE SERVICES ---

export const saveDecisionToFirestore = async (userId: string, record: DecisionRecord) => {
    if (!db) return;
    try {
        const decisionRef = doc(db, 'users', userId, 'decisions', record.id);
        await setDoc(decisionRef, record);
    } catch (error) {
        console.error("Error saving decision to Firestore", error);
        throw error;
    }
};

export const deleteDecisionFromFirestore = async (userId: string, recordId: string) => {
    if (!db) return;
    try {
        const decisionRef = doc(db, 'users', userId, 'decisions', recordId);
        await deleteDoc(decisionRef);
    } catch (error) {
        console.error("Error deleting decision from Firestore", error);
        throw error;
    }
};

export const getHistoryFromFirestore = async (userId: string): Promise<DecisionRecord[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'users', userId, 'decisions'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const history: DecisionRecord[] = [];
        querySnapshot.forEach((doc) => {
            history.push(doc.data() as DecisionRecord);
        });
        return history;
    } catch (error) {
        console.error("Error fetching history from Firestore", error);
        throw error;
    }
};

export const submitFeedback = async (feedback: FeedbackSubmission) => {
    if (!db) {
        console.log("Mocking feedback submission (DB not ready):", feedback);
        return;
    }
    try {
        await addDoc(collection(db, 'feedback'), feedback);
    } catch (error) {
        console.error("Error submitting feedback", error);
        throw error;
    }
};
