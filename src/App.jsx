import React from 'react';
// Import routing components from 'react-router-dom':
// - Routes: Container for all our Route definitions.
// - Route: Defines a path (e.g. '/profile') and the React component to show when that path is active.
// - Navigate: Used to redirect the user to a different path (e.g. from an invalid URL back to home).
// - useLocation: A React hook that returns the current browser location object (useful for checking URL path).
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import our custom React Context hooks to access global state:
// - useMockData: Holds active rides, loading state, and toast message info.
// - useAuth: Holds the currently logged-in Firebase user and their Firestore role info.
import { useMockData } from './context/MockDataContext';
import { useAuth } from './context/AuthContext';

// Import the reusable structural layout components
import Splash from './components/Splash';
import Login from './components/Login';
import RoleSwitcher from './components/RoleSwitcher';
import BottomNav from './components/BottomNav';
import TopNav from './components/TopNav';

// Import the specific page views (screens) for students, drivers, and administrators
import StudentHome from './views/student/StudentHome';
import StudentHistory from './views/student/StudentHistory';
import DriverHome from './views/driver/DriverHome';
import DriverEarnings from './views/driver/DriverEarnings';
import AdminDashboard from './views/admin/AdminDashboard';
import AdminRecords from './views/admin/AdminRecords';
import AdminRatings from './views/admin/AdminRatings';
import Profile from './components/Profile';

// Import Bell icon from lucide-react for notification styling
import { Bell } from 'lucide-react';

function App() {
  // useLocation lets us know which page the user is currently looking at
  const location = useLocation();
  
  // Extract global states from our Context providers
  const { isInitializing, toastMessage } = useMockData();
  const { currentUser, userData } = useAuth();

  // STEP 1: If the app is checking user login state or initializing database data, show the splash loading screen.
  if (isInitializing) {
    return <Splash />;
  }

  // STEP 2: If the user is NOT logged in, redirect them to the Login screen.
  if (!currentUser) {
    return <Login />;
  }

  // STEP 3: If the user is logged in, but we haven't loaded their profile data/role from Firestore, show loading splash.
  if (!userData) {
    return <Splash />; // Falls back to loading splash while fetching user profile
  }

  // STEP 4: Render the main page if the user is authenticated and their role data is loaded successfully.
  return (
    <div className="page-container">
      
      {/* TOAST SYSTEM:
          If there's a global notification message (toastMessage), display it at the top of the screen.
          This uses CSS backdrop-filter for a blurry glassmorphism effect.
      */}
      {toastMessage && (
        <div style={{
          position: 'fixed', 
          top: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '400px',
          backgroundColor: 'rgba(128, 0, 32, 0.85)', /* Burgundy glass */
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white', 
          padding: '16px 20px',
          borderRadius: '16px', 
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', 
          animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
            <Bell size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p className="text-body-sm-strong" style={{ margin: 0, color: 'rgba(255,255,255,0.9)' }}>Central Ride</p>
            <p className="text-body-md" style={{ margin: 0, marginTop: '2px', lineHeight: '1.4' }}>{toastMessage}</p>
          </div>
        </div>
      )}
      
      {/* TOP NAVIGATION BAR: Renders on desktop screens */}
      <TopNav />
      
      {/* ROLE SWITCHER / LOGOUT BUTTON:
          Only visible on mobile screens (`mobile-only` CSS class) and hidden when viewing the profile page.
      */}
      <div className="mobile-only">
        {location.pathname !== '/profile' && <RoleSwitcher />}
      </div>
      
      {/* ROLE-BASED PAGE ROUTING:
          We conditionally load routes depending on the user's role: 'student', 'driver'/'rider', or 'admin'.
          If they try to go to a URL they aren't authorized to access, `*` redirects them to `/` (home).
      */}
      
      {/* 1. STUDENT ROUTES */}
      {userData.role === 'student' && (
        <Routes>
          <Route path="/" element={<StudentHome />} />
          <Route path="/history" element={<StudentHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      
      {/* 2. DRIVER / MOTOR RIDER ROUTES */}
      {(userData.role === 'driver' || userData.role === 'rider') && (
        <Routes>
          <Route path="/" element={<DriverHome />} />
          <Route path="/earnings" element={<DriverEarnings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      
      {/* 3. ADMIN ROUTES */}
      {userData.role === 'admin' && (
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/records" element={<AdminRecords />} />
          <Route path="/alerts" element={<AdminDashboard />} />
          <Route path="/admin/ratings/:role" element={<AdminRatings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      {/* BOTTOM NAVIGATION BAR: Renders on mobile screens for easy thumb reach */}
      <BottomNav />
    </div>
  );
}

export default App;

