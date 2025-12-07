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
    orderBy 
} from 'firebase/firestore';
import { DecisionRecord } from '../types';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- AUTH SERVICES ---

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// --- DATABASE SERVICES ---

export const saveDecisionToFirestore = async (userId: string, record: DecisionRecord) => {
    try {
        const decisionRef = doc(db, 'users', userId, 'decisions', record.id);
        await setDoc(decisionRef, record);
    } catch (error) {
        console.error("Error saving decision to Firestore", error);
        throw error;
    }
};

export const deleteDecisionFromFirestore = async (userId: string, recordId: string) => {
    try {
        const decisionRef = doc(db, 'users', userId, 'decisions', recordId);
        await deleteDoc(decisionRef);
    } catch (error) {
        console.error("Error deleting decision from Firestore", error);
        throw error;
    }
};

export const getHistoryFromFirestore = async (userId: string): Promise<DecisionRecord[]> => {
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
