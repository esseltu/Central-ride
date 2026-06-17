import React from 'react';
import { useMockData } from '../context/MockDataContext';
import { Car, Package, Clock, ShieldAlert, Activity } from 'lucide-react'; // Icons from Lucide library
// Import React Router hooks:
// - useNavigate: Function to navigate between paths programmatically (e.g. navigate('/profile')).
// - useLocation: Returns details about the current URL location path.
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

// TopNav component represents the desktop-only navigation header bar.
const TopNav = () => {
  const { userData, logout } = useAuth();
  const { currentUser: mockUser } = useMockData();
  
  // Choose whichever user data is available (prefer live database profile over fallback auth).
  const activeUser = userData || mockUser;
  
  const navigate = useNavigate();
  const location = useLocation();

  // If no user is logged in, hide the navbar entirely.
  if (!activeUser) return null;

  return (
    <div className="desktop-only" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '64px',
      backgroundColor: 'var(--canvas)',
      borderBottom: '1px solid var(--canvas-soft)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 var(--space-xl)',
      justifyContent: 'space-between',
      zIndex: 1000
    }}>
      <div className="flex-row items-center gap-xl">
        {/* Left Side: Clickable Logo and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
          <h1 className="text-display-md" style={{ fontSize: '20px', margin: 0 }}>Central Ride</h1>
        </div>

        {/* Middle Section: Dynamic navigation links determined by the user's role */}
        <div className="flex-row gap-lg" style={{ marginLeft: 'var(--space-2xl)' }}>
          
          {/* 1. Student links (Ride and History) */}
          {activeUser.role === 'student' && (
            <>
              <button className="btn" style={{ fontWeight: location.pathname === '/' ? 'bold' : 'normal', backgroundColor: 'transparent' }} onClick={() => navigate('/')}>
                <Car size={18} /> Ride
              </button>
              <button className="btn" style={{ fontWeight: location.pathname === '/history' ? 'bold' : 'normal', backgroundColor: 'transparent' }} onClick={() => navigate('/history')}>
                <Clock size={18} /> History
              </button>
            </>
          )}

          {/* 2. Driver / Rider links (Requests and Earnings) */}
          {(activeUser.role === 'driver' || activeUser.role === 'rider') && (
            <>
              <button className="btn" style={{ fontWeight: location.pathname === '/' ? 'bold' : 'normal', backgroundColor: 'transparent' }} onClick={() => navigate('/')}>
                <Car size={18} /> Requests
              </button>
              <button className="btn" style={{ fontWeight: location.pathname === '/earnings' ? 'bold' : 'normal', backgroundColor: 'transparent' }} onClick={() => navigate('/earnings')}>
                <Activity size={18} /> Earnings
              </button>
            </>
          )}

          {/* 3. Admin links (Dashboard and Records) */}
          {activeUser.role === 'admin' && (
            <>
              <button className="btn" style={{ fontWeight: location.pathname === '/' ? 'bold' : 'normal', backgroundColor: 'transparent' }} onClick={() => navigate('/')}>
                <Activity size={18} /> Dashboard
              </button>
              <button className="btn" style={{ fontWeight: location.pathname === '/records' ? 'bold' : 'normal', backgroundColor: 'transparent' }} onClick={() => navigate('/records')}>
                <Clock size={18} /> Records
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right Side: Logout Button & Clickable User Avatar */}
      <div className="flex-row items-center gap-md">
        <button className="btn btn-white-danger" onClick={() => logout()}>
          Logout
        </button>

        {/* Clicking the avatar navigates to the Profile settings view */}
        <button className="btn-icon" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          {/* DiceBear API dynamically generates SVG avatar initials based on the user's name/email */}
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${activeUser.name || activeUser.email}`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
        </button>
      </div>
    </div>
  );
};

export default TopNav;

