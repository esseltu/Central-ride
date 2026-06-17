import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up and create user document in Firestore
  async function register(email, password, role, additionalData = {}) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create the user document in Firestore
    const userDocData = {
      uid: user.uid,
      email: user.email,
      role: role, // 'student', 'driver', 'admin'
      createdAt: new Date().toISOString(),
      ...additionalData
    };
    
    await setDoc(doc(db, 'users', user.uid), userDocData);
    setUserData(userDocData);
    return userCredential;
  }

  // Log in
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google Sign In
  async function loginWithGoogle(role) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user exists in Firestore
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // First time login, create user document
      const userDocData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        role: role || 'student', // Default to student if not provided
        createdAt: new Date().toISOString(),
      };
      await setDoc(docRef, userDocData);
      setUserData(userDocData);
    } else {
      setUserData(docSnap.data());
    }
    
    return result;
  }

  // Log out
  function logout() {
    return signOut(auth);
  }

  // Fetch user data when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch custom user data from Firestore
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.warn("User document not found in Firestore! Creating default profile...");
            const defaultUser = {
              uid: user.uid,
              email: user.email,
              name: user.displayName,
              role: 'student', // Default fallback
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
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData, // Contains role, name, etc.
    login,
    loginWithGoogle,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
