import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use environment variables for Firebase configuration
const firebaseConfigManual = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfigManual.apiKey) {
  console.error("Firebase API Key is missing! Please configure VITE_FIREBASE_API_KEY in the environment settings.");
}

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfigManual);
const databaseId = (firebaseConfigManual as any).firestoreDatabaseId && (firebaseConfigManual as any).firestoreDatabaseId !== '(default)'
  ? (firebaseConfigManual as any).firestoreDatabaseId
  : undefined;
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

import { doc, getDocFromServer } from 'firebase/firestore';

async function testConnection() {
  try {
    const testDocRef = doc(db, 'system_analytics', 'connection_test');
    await getDocFromServer(testDocRef);
    console.log('Firestore connection OK (permissions may deny read, but connection works)');
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Client is offline, but we can continue.");
    }
  }
}
testConnection();
