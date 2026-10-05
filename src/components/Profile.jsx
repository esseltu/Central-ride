import React, { useState, useEffect } from 'react';
import { useMockData } from '../context/MockDataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock, LogOut, Loader2, RefreshCcw } from 'lucide-react';

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: '14px', color: 'var(--body)', fontWeight: '600', marginBottom: '8px', paddingLeft: '4px', textTransform: 'uppercase' }}>
    {children}
  </div>
);

const InputGroup = ({ label, name, type = 'text', inputMode = 'text', placeholder, locked, onEdit, hint, value, onChange, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)' }}>{label}</label>
      {locked && onEdit && (
        <button 
          onClick={onEdit}
          style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--ink)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
        >
          Edit
        </button>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--canvas-soft)', borderRadius: '8px', padding: '0 16px', minHeight: '52px' }}>
      {name === 'phone' && <span style={{ fontSize: '16px', color: 'var(--ink)', marginRight: '8px' }}>+233</span>}
      <input 
        type={type} 
        inputMode={inputMode}
        name={name} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder}
        disabled={locked}
        style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '16px', color: locked ? 'var(--body)' : 'var(--ink)', width: '100%' }} 
      />
      {locked && <Lock size={16} color="var(--body)" />}
    </div>
    {hint && !locked && <div style={{ fontSize: '12px', color: 'var(--body)', marginTop: '-4px' }}>{hint}</div>}
    {error && <div style={{ fontSize: '12px', color: 'var(--status-sos)', marginTop: '-4px' }}>{error}</div>}
  </div>
);

const Profile = () => {
  const { currentUser, updateProfile } = useMockData();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    indexNumber: '',
    vehicleType: '',
    car: '',
    plate: '',
    momoNumber: ''
  });
  
  const [initialData, setInitialData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [isIndexUnlocked, setIsIndexUnlocked] = useState(false);
  
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      const init = {
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        indexNumber: currentUser.indexNumber || '',
        vehicleType: currentUser.vehicleType || '',
        car: currentUser.car || '',
        plate: currentUser.plate || '',
        momoNumber: currentUser.momoNumber || ''
      };
      setFormData(init);
      setInitialData(init);
      setLoading(false);
    }
  }, [currentUser]);

  // Unsaved changes warning
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  if (!currentUser) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.phone && !/^\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 9 digits (after +233)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'phone') {
      val = val.replace(/\D/g, '').slice(0, 9);
    }
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await updateProfile(formData);
    setInitialData(formData);
    setIsIndexUnlocked(false);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearCache = () => {
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
  };

  const executeLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
     return (
       <div style={{ padding: '16px', backgroundColor: 'var(--canvas)', minHeight: '100dvh' }}>
         <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', marginBottom: '24px' }}>Profile</h1>
         <div className="skeleton" style={{ height: '140px', borderRadius: '16px', marginBottom: '32px' }} />
         <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
       </div>
     );
  }

  const initials = (currentUser.name || currentUser.email || 'U').substring(0, 2).toUpperCase();
  const hasSavedIndex = !!initialData.indexNumber;

  return (
    <div style={{ backgroundColor: 'var(--canvas)', minHeight: '100dvh', padding: '16px', paddingBottom: '96px', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', margin: 0 }}>Profile</h1>

      {/* IDENTITY CARD */}
      <div style={{ backgroundColor: 'white', border: '1px solid var(--surface-pressed)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
          {currentUser.photoURL ? <img src={currentUser.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)' }}>{currentUser.name || 'Student'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: 'var(--canvas-soft)', color: 'var(--ink)', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' }}>
              {currentUser.role || 'Student'}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--body)' }}>{currentUser.email}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Personal Details */}
        <div>
          <SectionLabel>PERSONAL DETAILS</SectionLabel>
          <div style={{ backgroundColor: 'white', border: '1px solid var(--surface-pressed)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InputGroup label="Full name" name="name" placeholder="Kwame Mensah" value={formData.name} onChange={handleChange} error={errors.name} />
            <InputGroup label="Phone number" name="phone" type="tel" inputMode="tel" placeholder="24 123 4567" value={formData.phone} onChange={handleChange} error={errors.phone} />
            {currentUser.role === 'student' && (
              <InputGroup 
                label="Student index number" 
                name="indexNumber" 
                placeholder="10293847" 
                locked={hasSavedIndex && !isIndexUnlocked} 
                onEdit={() => setIsIndexUnlocked(true)}
                hint="Make sure this matches your student ID."
                value={formData.indexNumber}
                onChange={handleChange}
                error={errors.indexNumber}
              />
            )}
          </div>
        </div>

        {/* Driver Details */}
        {(currentUser.role === 'driver' || currentUser.role === 'rider') && (
          <div>
            <SectionLabel>DRIVER DETAILS</SectionLabel>
            <div style={{ backgroundColor: 'white', border: '1px solid var(--surface-pressed)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InputGroup label="Mobile Money Number" name="momoNumber" type="tel" inputMode="tel" value={formData.momoNumber} onChange={handleChange} error={errors.momoNumber} />
              <InputGroup label="Vehicle Model" name="car" value={formData.car} onChange={handleChange} error={errors.car} />
              <InputGroup label="License Plate" name="plate" value={formData.plate} onChange={handleChange} error={errors.plate} />
              <InputGroup label="Vehicle Type (car/motor)" name="vehicleType" value={formData.vehicleType} onChange={handleChange} error={errors.vehicleType} />
            </div>
          </div>
        )}

        {/* Account Details */}
        <div>
          <SectionLabel>ACCOUNT</SectionLabel>
          <div style={{ backgroundColor: 'white', border: '1px solid var(--surface-pressed)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 16px 4px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--ink)' }}>Role</span>
              <span style={{ fontSize: '16px', color: 'var(--body)', textTransform: 'capitalize' }}>{currentUser.role || 'Student'}</span>
            </div>
            <div style={{ height: '1px', backgroundColor: 'var(--surface-pressed)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--ink)' }}>Email</span>
              <span style={{ fontSize: '16px', color: 'var(--body)' }}>{currentUser.email}</span>
            </div>
            <div style={{ height: '1px', backgroundColor: 'var(--surface-pressed)' }} />
            <button 
              onClick={() => setShowLogoutDialog(true)}
              style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', minHeight: '44px', padding: '16px 4px 4px 4px', textAlign: 'left' }}
            >
              <LogOut size={24} color="var(--ink)" aria-label="Log out icon" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--ink)' }}>Log out</span>
                <span style={{ fontSize: '14px', color: 'var(--body)' }}>Sign out of Central Ride on this device.</span>
              </div>
              <ChevronRight size={20} color="var(--body)" style={{ flexShrink: 0 }} />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <div style={{ fontSize: '14px', color: 'var(--status-sos)', fontWeight: '500', marginBottom: '8px', paddingLeft: '4px', textTransform: 'uppercase' }}>
            DANGER ZONE
          </div>
          <div style={{ backgroundColor: 'white', border: '1px solid var(--status-sos)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            
            <button 
              onClick={() => setShowClearDialog(true)}
              style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', minHeight: '44px', padding: '0', textAlign: 'left' }}
            >
              <RefreshCcw size={24} color="var(--status-sos)" aria-label="Clear cache icon" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--ink)' }}>Clear cache and fix app</span>
                <span style={{ fontSize: '14px', color: 'var(--body)' }}>Removes saved data on this device. You will stay signed in.</span>
              </div>
              <ChevronRight size={20} color="var(--body)" style={{ flexShrink: 0 }} />
            </button>
            
          </div>
        </div>

      </div>

      {/* STICKY SAVE BAR */}
      <div style={{ position: 'fixed', bottom: 'var(--nav-height)', left: '0', right: '0', padding: '16px', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
        <button 
          disabled={!hasChanges || saving}
          onClick={handleSave}
          style={{ 
            pointerEvents: 'auto',
            width: '100%', 
            maxWidth: '600px', 
            height: '52px', 
            backgroundColor: hasChanges ? 'var(--ink)' : 'var(--canvas-soft)', 
            color: hasChanges ? 'white' : 'var(--body)', 
            borderRadius: '999px', 
            border: 'none', 
            fontSize: '16px', 
            fontWeight: 'bold', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: hasChanges ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: hasChanges ? '0 4px 16px rgba(0,0,0,0.15)' : 'none'
          }}
        >
          {saving ? <Loader2 className="spin" size={20} /> : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>

      {/* DIALOGS */}
      {showClearDialog && (
        <div 
          role="dialog" 
          aria-label="Clear cache"
          aria-modal="true"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowClearDialog(false); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowClearDialog(false); }}
          tabIndex="-1"
        >
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '340px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--ink)' }}>Clear app data?</h2>
            <p style={{ margin: '12px 0 24px', fontSize: '14px', color: 'var(--body)', lineHeight: '1.4' }}>This will fix most loading issues by clearing cached files.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={handleClearCache} style={{ width: '100%', height: '52px', backgroundColor: 'var(--status-sos)', color: 'white', borderRadius: '999px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Clear</button>
              <button onClick={() => setShowClearDialog(false)} style={{ width: '100%', height: '44px', backgroundColor: 'transparent', color: 'var(--ink)', borderRadius: '999px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutDialog && (
        <div 
          role="dialog" 
          aria-label="Logout confirm"
          aria-modal="true"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutDialog(false); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowLogoutDialog(false); }}
          tabIndex="-1"
        >
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '340px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--ink)' }}>Log out?</h2>
            <p style={{ margin: '12px 0 24px', fontSize: '14px', color: 'var(--body)', lineHeight: '1.4' }}>Sign out of Central Ride on this device.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={executeLogout} style={{ width: '100%', height: '52px', backgroundColor: 'var(--ink)', color: 'white', borderRadius: '999px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Log out</button>
              <button onClick={() => setShowLogoutDialog(false)} style={{ width: '100%', height: '44px', backgroundColor: 'transparent', color: 'var(--ink)', borderRadius: '999px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
