import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
// Import Firebase Authentication functions:
// - createUserWithEmailAndPassword: Registers a new user with an email and password.
// - signInWithEmailAndPassword: Logs in an existing user with email and password.
// - signOut: Signs out the current user.
// - onAuthStateChanged: A listener that fires whenever a user signs in or out.
// - GoogleAuthProvider: Configures login via Google accounts.
// - signInWithPopup: Triggers a Google login popup window.
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
// Import Firestore functions:
// - doc: References a specific document inside a collection (e.g. document with ID user.uid in collection 'users').
// - getDoc: Fetches data for a specific document reference.
// - setDoc: Overwrites or creates a document with a specific key-value dataset.
import { doc, getDoc, setDoc } from 'firebase/firestore';

// 1. Create a React Context object. Think of context as a global container
// that holds data we want to share across multiple components without manually passing props.
const AuthContext = createContext();

// 2. Custom hook `useAuth` so components can easily access the authentication values.
// Instead of writing `useContext(AuthContext)` on every page, we can just call `useAuth()`.
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Provider Component: Wraps our app and supplies the authentication state and methods to children.
export const AuthProvider = ({ children }) => {
  // State variables:
  // - currentUser: Stores the Firebase Auth user object (holds email, uid, etc.).
  // - userData: Stores the custom user data from Firestore (holds role, name, phone, etc.).
  // - loading: Tracks if we are still checking if a user is logged in when the app first boots up.
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // REGISTER FUNCTION:
  // Registers a new user with Firebase Auth, then creates a matching user profile document in Firestore.
  async function register(email, password, role, additionalData = {}) {
    // A: Create credentials in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // B: Define the user metadata to save in Firestore
    const userDocData = {
      uid: user.uid,
      email: user.email,
      role: role, // 'student', 'driver', or 'admin'
      createdAt: new Date().toISOString(),
      ...additionalData
    };
    
    // C: Save userDocData to Firestore in the 'users' collection under the document key of user's UID.
    await setDoc(doc(db, 'users', user.uid), userDocData);
    setUserData(userDocData); // Cache in React state
    return userCredential;
  }

  // LOGIN FUNCTION:
  // Authenticates an existing user using email and password.
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // GOOGLE SIGN IN FUNCTION:
  // Uses a Google popup window to sign in the user. Creates a Firestore document if they are logging in for the first time.
  async function loginWithGoogle(role) {
    const provider = new GoogleAuthProvider();
    // Forces Google account selection window to appear every time (helpful for testing multiple accounts)
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if the user already has a profile document in Firestore
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // First-time login: Create their user document in Firestore with their selected role.
      const userDocData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        role: role || 'student', // Fallback default to 'student'
        createdAt: new Date().toISOString(),
      };
      await setDoc(docRef, userDocData);
      setUserData(userDocData);
    } else {
      // Returning user: Load their existing profile data from Firestore.
      setUserData(docSnap.data());
    }
    
    return result;
  }

  // LOGOUT FUNCTION:
  // Signs the user out of Firebase Authentication.
  function logout() {
    return signOut(auth);
  }

  // AUTH STATE LISTENER:
  // Runs once when the component mounts. Listens for user log-in or log-out.
  useEffect(() => {
    // onAuthStateChanged returns an 'unsubscribe' function which we return at the end to clean up.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // If a user is logged in, fetch their custom profile document from Cloud Firestore.
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // Document missing (safety fallback): Create a default profile.
            console.warn("User document not found in Firestore! Creating default profile...");
            const defaultUser = {
              uid: user.uid,
              email: user.email,
              name: user.displayName,
              role: 'student', // Default fallback role
              createdAt: new Date().toISOString(),
            };
            await setDoc(docRef, defaultUser);
            setUserData(defaultUser);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        // If logged out, reset user data.
        setUserData(null);
      }
      
      // Stop showing the global loading screen once the auth state is checked.
      setLoading(false);
    });

    // Clean up the auth observer listener when the provider component is destroyed.
    return unsubscribe;
  }, []);

  // Shared variables and functions that child components can access.
  const value = {
    currentUser,
    userData, // Contains the user's role ('student', 'driver', 'admin') and profile details
    login,
    loginWithGoogle,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Do not render child components until we have finished checking the initial Auth state. */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

