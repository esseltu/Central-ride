import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';

const MockDataContext = createContext();

export const useMockData = () => useContext(MockDataContext);

export const MockDataProvider = ({ children }) => {
  const { userData: currentUser } = useAuth();
  
  const [rides, setRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0 });
  const [toastMessage, setToastMessage] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [users, setUsers] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  useEffect(() => {
    setTimeout(() => setIsInitializing(false), 1500);
  }, []);

  // Live Firestore Listeners
  useEffect(() => {
    if (!currentUser) return;

    // Listen to Rides
    const ridesQuery = query(collection(db, 'rides'), orderBy('date', 'desc'));
    const unsubscribeRides = onSnapshot(ridesQuery, (snapshot) => {
      const ridesData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert stopsCoords objects back to arrays for map component compatibility
        if (Array.isArray(data.stopsCoords)) {
           data.stopsCoords = data.stopsCoords.map(c => c && c.lat !== undefined ? [c.lat, c.lng] : null);
        }
        return { id: doc.id, ...data };
      });
      setRides(ridesData);

      // Determine active ride for this user
      let currentActive = null;
      if (currentUser.role === 'student') {
        currentActive = ridesData.find(r => r.studentId === currentUser.uid && r.status !== 'completed' && r.status !== 'cancelled');
      } else if (currentUser.role === 'driver' || currentUser.role === 'rider') {
        currentActive = ridesData.find(r => r.driverId === currentUser.uid && r.status !== 'completed' && r.status !== 'cancelled');
        
        // Calculate dynamic earnings
        const myCompletedRides = ridesData.filter(r => r.driverId === currentUser.uid && r.status === 'completed');
        const total = myCompletedRides.reduce((sum, ride) => sum + (ride.price || 0), 0);
        
        // For MVP, we'll just set Today and This Week to the total earnings
        setEarnings({ today: total, week: total });
      }
      setActiveRide(currentActive || null);
    }, (error) => {
      console.error("Error listening to rides:", error);
    });

    // Listen to Alerts
    const alertsQuery = query(collection(db, 'alerts'), orderBy('time', 'desc'));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to Users (for Admin)
    let unsubscribeUsers = () => {};
    if (currentUser.role === 'admin') {
      const usersQuery = query(collection(db, 'users'));
      unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      unsubscribeRides();
      unsubscribeAlerts();
      unsubscribeUsers();
    };
  }, [currentUser]);

  // Methods mapped to Firestore
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

  const requestRide = async (pickup, dropoff, stops = [], type = 'ride', pickupCoords = null, dropoffCoords = null, stopsCoords = [], calculatedPrice = 10) => {
    const newRide = {
      studentId: currentUser?.uid || 'unknown',
      studentName: currentUser?.name || currentUser?.email || 'Student',
      pickup: pickup || '',
      pickupCoords: pickupCoords || null,
      dropoff: dropoff || '',
      dropoffCoords: dropoffCoords || null,
      stops: stops || [],
      // Convert array of arrays to array of objects because Firestore does not support nested arrays
      stopsCoords: Array.isArray(stopsCoords) ? stopsCoords.map(c => Array.isArray(c) ? { lat: c[0], lng: c[1] } : null) : [],
      type: type || 'ride',
      status: 'requested',
      price: calculatedPrice || 10,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      date: new Date().toISOString()
    };
    
    // Safety check to absolutely strip any rogue undefined values
    Object.keys(newRide).forEach(key => newRide[key] === undefined && delete newRide[key]);
    
    try {
      await addDoc(collection(db, 'rides'), newRide);
    } catch (e) {
      console.error(e);
      showToast("Error requesting ride");
    }
  };

  const acceptRide = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'accepted',
        driverId: currentUser.uid,
        driverName: currentUser.name || currentUser.email,
        driverType: currentUser.role,
        driverMomo: currentUser.momoNumber || currentUser.phone || 'Not Provided',
      });
      showToast(`You have accepted the ride!`);
    } catch (e) { console.error(e); }
  };

  const arriveAtPickup = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'arrived' });
      showToast("Arrived at pickup location!");
    } catch (e) { 
      console.error(e);
      showToast("Failed to update status.");
    }
  };

  const startRide = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'in_progress' });
      showToast("Ride started!");
    } catch (e) { console.error(e); }
  };

  const endRide = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'driver_rating' });
      showToast("Ride completed! Please rate the passenger.");
    } catch (e) { 
      console.error("Error ending ride:", e); 
      showToast("Failed to complete ride.");
    }
  };

  const submitDriverRating = async (rideId, rating) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'payment_pending', studentRating: rating });
      showToast("Rating submitted. Waiting for payment!");
    } catch (e) { 
      console.error(e); 
      showToast("Failed to submit rating.");
    }
  };

  const confirmPayment = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'student_rating' });
      if (currentUser.role === 'driver' || currentUser.role === 'rider') {
        showToast("Payment received. Ride complete!");
        // We'd calculate real earnings here from DB queries
      }
    } catch (e) { 
      console.error(e); 
      showToast("Failed to confirm payment.");
    }
  };

  const submitStudentRating = async (rideId, rating) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), { status: 'completed', driverRating: rating });
      showToast("Thank you for your feedback!");
    } catch (e) { 
      console.error(e); 
      showToast("Failed to submit rating.");
    }
  };

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
  
  // Dummy functions to satisfy components relying on old MockDataContext
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
