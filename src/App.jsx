import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useMockData } from './context/MockDataContext';
import { useAuth } from './context/AuthContext';

import Splash from './components/Splash';
import Login from './components/Login';
import RoleSwitcher from './components/RoleSwitcher';
import BottomNav from './components/BottomNav';
import TopNav from './components/TopNav';

// Placeholders for views
import StudentHome from './views/student/StudentHome';
import StudentHistory from './views/student/StudentHistory';
import DriverHome from './views/driver/DriverHome';
import DriverEarnings from './views/driver/DriverEarnings';
import AdminDashboard from './views/admin/AdminDashboard';
import AdminRecords from './views/admin/AdminRecords';
import AdminRatings from './views/admin/AdminRatings';
import Profile from './components/Profile';
import { Bell } from 'lucide-react';

function App() {
  const location = useLocation();
  const { isInitializing, toastMessage } = useMockData();
  const { currentUser, userData } = useAuth();

  if (isInitializing) {
    return <Splash />;
  }

  // If Firebase auth is loaded but no user is logged in
  if (!currentUser) {
    return <Login />;
  }

  // If user is logged in but their Firestore role document hasn't loaded yet
  if (!userData) {
    return <Splash />; // or a loading spinner
  }

  return (
    <div className="page-container">
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
      

      <TopNav />
      <div className="mobile-only">
        {location.pathname !== '/profile' && <RoleSwitcher />}
      </div>
      
      {userData.role === 'student' && (
        <Routes>
          <Route path="/" element={<StudentHome />} />
          <Route path="/history" element={<StudentHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      
      {(userData.role === 'driver' || userData.role === 'rider') && (
        <Routes>
          <Route path="/" element={<DriverHome />} />
          <Route path="/earnings" element={<DriverEarnings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      
      {userData.role === 'admin' && (
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/records" element={<AdminRecords />} />
          <Route path="/alerts" element={<AdminDashboard />} />
          <Route path="/admin/ratings/:role" element={<AdminRatings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      <BottomNav />
    </div>
  );
}

export default App;
