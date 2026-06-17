import React from 'react';
import { useMockData } from '../context/MockDataContext';
import { Car, Package, Clock, ShieldAlert, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const TopNav = () => {
  const { userData, logout } = useAuth();
  const { currentUser: mockUser } = useMockData();
  const activeUser = userData || mockUser;
  const navigate = useNavigate();
  const location = useLocation();

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
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
          <h1 className="text-display-md" style={{ fontSize: '20px', margin: 0 }}>Central Ride</h1>
        </div>

        {/* Links */}
        <div className="flex-row gap-lg" style={{ marginLeft: 'var(--space-2xl)' }}>
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

      {/* Right Side: Logout & Profile */}
      <div className="flex-row items-center gap-md">
        <button className="btn btn-white-danger" onClick={() => logout()}>
          Logout
        </button>

        <button className="btn-icon" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${activeUser.name || activeUser.email}`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
        </button>
      </div>
    </div>
  );
};

export default TopNav;
