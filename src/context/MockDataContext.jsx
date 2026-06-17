import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
// Import Cloud Firestore query/data modules:
// - collection: References a collection in the database.
// - query: Creates an query statement to filter/order data.
// - onSnapshot: Sets up a real-time listener. Fires whenever data in the query changes.
// - addDoc: Adds a new document with an auto-generated ID to a collection.
// - updateDoc: Updates fields on an existing document in a collection.
// - doc: References a specific document by its ID.
// - orderBy: Orders query results by a field.
import { collection, query, onSnapshot, addDoc, updateDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';

// Create the context container for mock/live database transit data.
const MockDataContext = createContext();

// Custom hook to consume the MockDataContext values in our views/components.
export const useMockData = () => useContext(MockDataContext);

export const MockDataProvider = ({ children }) => {
  // Access the current logged-in user profile from AuthContext.
  const { userData: currentUser } = useAuth();
  
  // State variables for shared app data:
  // - rides: Complete list of all rides in the system.
  // - activeRide: The current ongoing ride for the logged-in student or driver.
  // - alerts: List of emergency SOS triggers.
  // - earnings: Total money earned by the driver (today and this week).
  // - toastMessage: Alert notification string shown at the top of the app.
  // - isInitializing: Controls whether we show the initial splash loader.
  // - users: List of all users in the system (for Admin dashboard view).
  const [rides, setRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0 });
  const [toastMessage, setToastMessage] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [users, setUsers] = useState([]);

  // Toast helper to show notification banners that slide down and disappear after 5 seconds.
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Run a simple timer to hide the splash loading page 1.5 seconds after app startup.
  useEffect(() => {
    setTimeout(() => setIsInitializing(false), 1500);
  }, []);

  // FIRESTORE LIVE SYNCHRONIZATION:
  // Whenever the currentUser changes (logs in/out), reset and set up fresh listeners to the database.
  useEffect(() => {
    if (!currentUser) return;

    // 1. LISTEN TO RIDES:
    // Create a live query for the 'rides' collection, sorted by date in descending order.
    const ridesQuery = query(collection(db, 'rides'), orderBy('date', 'desc'));
    const unsubscribeRides = onSnapshot(ridesQuery, (snapshot) => {
      const ridesData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // MAP COMPATIBILITY CONVERSION:
        // Cloud Firestore does not support nested arrays of coordinates like [[5.76, 0.08]].
        // We saved them as objects like [{lat: 5.76, lng: 0.08}]. Here we convert them back
        // to [lat, lng] arrays so that Leaflet maps can display them properly without errors.
        if (Array.isArray(data.stopsCoords)) {
           data.stopsCoords = data.stopsCoords.map(c => c && c.lat !== undefined ? [c.lat, c.lng] : null);
        }
        return { id: doc.id, ...data };
      });
      setRides(ridesData);

      // ACTIVE RIDE COMPUTATION:
      // Search the rides array to find if this user has an ongoing ride (status isn't completed or cancelled).
      let currentActive = null;
      if (currentUser.role === 'student') {
        currentActive = ridesData.find(r => r.studentId === currentUser.uid && r.status !== 'completed' && r.status !== 'cancelled');
      } else if (currentUser.role === 'driver' || currentUser.role === 'rider') {
        currentActive = ridesData.find(r => r.driverId === currentUser.uid && r.status !== 'completed' && r.status !== 'cancelled');
        
        // DYNAMIC EARNINGS COMPUTATION (For Drivers):
        // Filter the driver's completed rides and sum the price values.
        const myCompletedRides = ridesData.filter(r => r.driverId === currentUser.uid && r.status === 'completed');
        const total = myCompletedRides.reduce((sum, ride) => sum + (ride.price || 0), 0);
        
        setEarnings({ today: total, week: total });
      }
      setActiveRide(currentActive || null);
    }, (error) => {
      console.error("Error listening to rides:", error);
    });

    // 2. LISTEN TO SOS ALERTS:
    // Listen to the 'alerts' collection sorted by trigger time.
    const alertsQuery = query(collection(db, 'alerts'), orderBy('time', 'desc'));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. LISTEN TO USERS (ADMINS ONLY):
    // Listen to the entire 'users' collection so the admin can monitor ratings and roles.
    let unsubscribeUsers = () => {};
    if (currentUser.role === 'admin') {
      const usersQuery = query(collection(db, 'users'));
      unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    // CLEANUP FUNCTION:
    // Automatically disconnects database listeners when the user logs out or closes the app.
    return () => {
      unsubscribeRides();
      unsubscribeAlerts();
      unsubscribeUsers();
    };
  }, [currentUser]);

  // UPDATE PROFILE METHOD:
  // Saves user profile updates (like MOMO number, vehicle model) back to Firestore.
  const updateProfile = async (data) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), data);
      showToast("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      showToast("Failed to update profile.");
    }
  };

  // REQUEST RIDE METHOD:
  // Creates a new ride request document in Cloud Firestore.
  const requestRide = async (pickup, dropoff, stops = [], type = 'ride', pickupCoords = null, dropoffCoords = null, stopsCoords = [], calculatedPrice = 10) => {
    const newRide = {
      studentId: currentUser?.uid || 'unknown',
      studentName: currentUser?.name || currentUser?.email || 'Student',
      pickup: pickup || '',
      pickupCoords: pickupCoords || null,
      dropoff: dropoff || '',
      dropoffCoords: dropoffCoords || null,
      stops: stops || [],
      // FIRESTORE COMPATIBILITY CONVERSION:
      // Convert [lat, lng] array coordinates into {lat, lng} objects before uploading to Firestore.
      stopsCoords: Array.isArray(stopsCoords) ? stopsCoords.map(c => Array.isArray(c) ? { lat: c[0], lng: c[1] } : null) : [],
      type: type || 'ride', // 'ride', 'parcel', or 'emergency'
      status: 'requested', // Initial state
      price: calculatedPrice || 10,
      otp: Math.floor(1000 + Math.random() * 9000).toString(), // Generate a 4-digit verification code
      date: new Date().toISOString()
    };
    
    // Safety check to remove any fields that are undefined, since Firestore rejects undefined values.
    Object.keys(newRide).forEach(key => newRide[key] === undefined && delete newRide[key]);
    
    try {
      await addDoc(collection(db, 'rides'), newRide);
    } catch (e) {
      console.error(e);
      showToast("Error requesting ride");
    }
  };

  // ACCEPT RIDE METHOD (For Drivers):
  // Driver accepts a student's ride request. Updates the ride with the driver's metadata.
  const acceptRide = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'accepted',
        driverId: currentUser.uid,
        driverName: currentUser.name || currentUser.email,
        driverType: currentUser.role, // 'driver' (car) or 'rider' (motorcycle)
        driverMomo: currentUser.momoNumber || currentUser.phone || 'Not Provided',
      });
      showToast(`You have accepted the ride!`);
    } catch (e) { console.error(e); }
  };

  // ARRIVE AT PICKUP METHOD (For Drivers):
  // Driver arrives at the pickup point. Sets the status to 'arrived' to notify the student.
  const arriveAtPickup = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'arrived' });
      showToast("Arrived at pickup location!");
    } catch (e) { 
      console.error(e);
      showToast("Failed to update status.");
    }
  };

  // START RIDE METHOD (For Drivers):
  // Driver verifies the student's OTP and starts the trip.
  const startRide = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'in_progress' });
      showToast("Ride started!");
    } catch (e) { console.error(e); }
  };

  // END RIDE METHOD (For Drivers):
  // Driver completes the trip and is prompted to rate the student.
  const endRide = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'driver_rating' });
      showToast("Ride completed! Please rate the passenger.");
    } catch (e) { 
      console.error("Error ending ride:", e); 
      showToast("Failed to complete ride.");
    }
  };

  // SUBMIT PASSENGER RATING METHOD (For Drivers):
  // Saves the passenger's rating and moves status to 'payment_pending'.
  const submitDriverRating = async (rideId, rating) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'payment_pending', studentRating: rating });
      showToast("Rating submitted. Waiting for payment!");
    } catch (e) { 
      console.error(e); 
      showToast("Failed to submit rating.");
    }
  };

  // CONFIRM PAYMENT METHOD (For Students):
  // Student clicks "I have paid via MoMo". Moves status to 'student_rating'.
  const confirmPayment = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'student_rating' });
      if (currentUser.role === 'driver' || currentUser.role === 'rider') {
        showToast("Payment received. Ride complete!");
      }
    } catch (e) { 
      console.error(e); 
      showToast("Failed to confirm payment.");
    }
  };

  // SUBMIT DRIVER RATING METHOD (For Students):
  // Student rates the driver. Sets final status to 'completed'.
  const submitStudentRating = async (rideId, rating) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'completed', driverRating: rating });
      showToast("Thank you for your feedback!");
    } catch (e) { 
      console.error(e); 
      showToast("Failed to submit rating.");
    }
  };

  // CANCEL RIDE METHOD (For both):
  // Students cancel entirely (sets status to 'cancelled').
  // Drivers cancel acceptance (resets status to 'requested' so another driver can accept it).
  const cancelRide = async (rideId) => {
    try {
      if (currentUser.role === 'student') {
        await updateDoc(doc(db, 'rides', rideId), { status: 'cancelled' });
      } else {
        await updateDoc(doc(db, 'rides', rideId), { 
          status: 'requested',
          driverId: null,
          driverName: null,
          driverType: null
        });
      }
      showToast("Ride cancelled successfully.");
    } catch (e) { 
      console.error(e); 
      showToast("Failed to cancel ride.");
    }
  };

  // TRIGGER EMERGENCY SOS METHOD:
  // Adds an emergency alert document to Firestore to alert security and admin.
  const triggerSOS = async () => {
    try {
      await addDoc(collection(db, 'alerts'), {
        userId: currentUser.uid,
        userName: currentUser.name || currentUser.email,
        role: currentUser.role,
        location: 'Live Tracking Location',
        time: new Date().toISOString(),
        status: 'active'
      });
      alert("SOS Alert Triggered! Campus Security has been notified.");
    } catch (e) { console.error(e); }
  };
  
  // Placeholders
  const login = () => {};
  const logout = () => {};

  return (
    <MockDataContext.Provider value={{
      currentUser,
      isInitializing,
      rides,
      activeRide,
      alerts,
      earnings,
      toastMessage,
      users,
      login,
      logout,
      updateProfile,
      requestRide,
      acceptRide,
      arriveAtPickup,
      startRide,
      endRide,
      submitDriverRating,
      confirmPayment,
      submitStudentRating,
      cancelRide,
      triggerSOS
    }}>
      {children}
    </MockDataContext.Provider>
  );
};

