// Import the necessary functions from the Firebase SDK packages.
// - initializeApp: Starts and configures our Firebase app using our credentials.
// - getAuth: Gives us access to Firebase Authentication services (sign-in, logout, etc.).
// - getFirestore: Gives us access to the Cloud Firestore database (NoSQL database).
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// The firebaseConfig object holds the unique keys and identifiers for our Firebase project.
// We load these from environment variables (.env file) via Vite's `import.meta.env`
// to keep secrets safe and make it easy to switch environments.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize the Firebase application instance.
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them so other components/contexts can import and use them.
// - auth: Used to handle user accounts, logging in, signing up, and getting active user sessions.
// - db: Used to read and write to Firestore database collections (e.g., rides, users, alerts).
export const auth = getAuth(app);
export const db = getFirestore(app);

// Default export of the main firebase app instance.
export default app;

