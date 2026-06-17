import React, { useState } from 'react';
import { useMockData } from '../context/MockDataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser, updateProfile } = useMockData();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Local state to hold form inputs
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    indexNumber: currentUser?.indexNumber || '',
    vehicleType: currentUser?.vehicleType || '',
    car: currentUser?.car || '',
    plate: currentUser?.plate || '',
    momoNumber: currentUser?.momoNumber || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    updateProfile(formData);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!currentUser) return null;

  return (
    <div style={{ backgroundColor: 'var(--canvas)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Banner */}
      <div style={{ 
        height: '180px', 
        padding: 'var(--space-2xl) var(--space-xl) var(--space-xl)',
        background: 'linear-gradient(to bottom, #4a0012, #800020)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="text-display-md" style={{ color: 'white', margin: 0 }}>Profile Settings</h1>
          <button className="btn btn-white-danger mobile-only" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Avatar overlapping */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-60px' }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
           <img src="/logo.png" alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} />
        </div>
      </div>
      
      {/* Form */}
      <div className="flex-col" style={{ padding: 'var(--space-2xl) var(--space-xl)', maxWidth: '600px', margin: '0 auto', gap: '32px' }}>
        
        <div className="flex-col gap-xs">
          <label className="text-body-sm" style={{ color: 'var(--mute)' }}>Full name</label>
          <input className="input-minimal" name="name" value={formData.name} onChange={handleChange} placeholder="Full name" />
        </div>
        
        <div className="flex-col gap-xs">
          <label className="text-body-sm" style={{ color: 'var(--mute)' }}>Phone Number</label>
          <input className="input-minimal" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" />
        </div>

        {currentUser.role === 'student' && (
          <div className="flex-col gap-xs">
            <label className="text-body-sm" style={{ color: 'var(--mute)' }}>Student Index Number</label>
            <input className="input-minimal" name="indexNumber" value={formData.indexNumber} onChange={handleChange} placeholder="Student Index Number" />
          </div>
        )}

        {currentUser.role === 'driver' && (
          <>
            <div className="flex-col gap-xs">
              <label className="text-body-sm" style={{ color: 'var(--mute)' }}>Mobile Money Number</label>
              <input className="input-minimal" name="momoNumber" value={formData.momoNumber} onChange={handleChange} placeholder="Mobile Money Number" />
            </div>
            
            <div className="flex-col gap-xs">
              <label className="text-body-sm" style={{ color: 'var(--mute)' }}>Vehicle Model</label>
              <input className="input-minimal" name="car" value={formData.car} onChange={handleChange} placeholder="Vehicle Model" />
            </div>
            
            <div className="flex-col gap-xs">
              <label className="text-body-sm" style={{ color: 'var(--mute)' }}>License Plate</label>
              <input className="input-minimal" name="plate" value={formData.plate} onChange={handleChange} placeholder="License Plate" />
            </div>
            
            <div className="flex-col gap-xs">
              <label className="text-body-sm" style={{ color: 'var(--mute)' }}>Vehicle Type (car/motor)</label>
              <input className="input-minimal" name="vehicleType" value={formData.vehicleType} onChange={handleChange} placeholder="Vehicle Type (car/motor)" />
            </div>
          </>
        )}

        <div style={{ marginTop: 'var(--space-2xl)', display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ width: '100%', maxWidth: '300px', padding: '16px', fontSize: '18px', fontWeight: 'bold' }} onClick={handleSave}>
            Save Profile
          </button>
        </div>

        {/* FORCE CACHE RESET - MOVED FROM APP.JSX FOR DEV PURPOSES */}
        <div style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'center' }}>
          <button 
            className="btn btn-large"
            style={{ width: '100%', maxWidth: '300px', backgroundColor: 'transparent', color: 'var(--accent-red)', border: '2px solid var(--accent-red)', fontWeight: 'bold' }}
            onClick={() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                  window.location.href = window.location.origin + '/?cleared=true';
                });
              } else {
                window.location.reload(true);
              }
            }}
          >
            FIX APP / CLEAR CACHE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
