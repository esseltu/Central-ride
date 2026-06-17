import React, { useState } from 'react';
import { useMockData } from '../../context/MockDataContext';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Star } from 'lucide-react';

// AdminRatings component displays user list ratings filtered by active roles (student/driver/rider).
const AdminRatings = () => {
  // Extract all registered users from context data stream.
  const { users } = useMockData();
  
  // useParams extracts route parameters matching `/admin/ratings/:role` inside App.jsx.
  const { role } = useParams(); // 'student', 'driver', or 'rider'
  const navigate = useNavigate();
  
  // Search state to filter list entries by search string.
  const [searchTerm, setSearchTerm] = useState('');

  // FILTER LOGIC:
  // 1. Matches only users belonging to the active role parameter (e.g. role === 'driver').
  // 2. Further narrows matching items if the admin has typed search criteria into the search box.
  const filteredUsers = users.filter(user => {
    if (user.role !== role) return false;
    if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: 'var(--space-xl)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Page Header with Back Arrow Button */}
      <div className="flex-row items-center gap-md" style={{ marginBottom: 'var(--space-xl)' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <ArrowLeft size={24} color="var(--ink)" />
        </button>
        <h1 className="text-display-md" style={{ textTransform: 'capitalize' }}>{role} Ratings</h1>
      </div>

      {/* Real-time Filter Input Search Box */}
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--canvas-soft)', borderRadius: 'var(--radius-pill)', padding: '0 var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <Search size={20} color="var(--ink)" />
        <input 
          className="input-field" 
          style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }} 
          placeholder={`Search ${role}s...`} 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Scrollable Ratings list container */}
      <div className="flex-col gap-md" style={{ overflowY: 'auto' }}>
        {filteredUsers.length === 0 ? (
          <p className="text-body-md text-center" style={{ marginTop: 'var(--space-2xl)' }}>No users found.</p>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="card flex-col gap-sm">
              <div className="flex-row justify-between items-center">
                <p className="text-body-md-strong">{user.name}</p>
                <span className="flex-row items-center gap-xs text-body-sm-strong" style={{ color: 'var(--primary)' }}>
                  <Star size={14} fill="var(--primary)" /> {user.rating.toFixed(1)}
                </span>
              </div>
              
              {/* DYNAMIC PROGRESS BAR:
                  Visualizes user's score out of 5 by setting the width as a percentage: `(user.rating / 5) * 100`.
                  Colors the bar: Primary red/burgundy if >=4, Orange if >=3, Crimson/Red if low.
              */}
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-pressed)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${(user.rating / 5) * 100}%`, 
                  backgroundColor: user.rating >= 4.0 ? 'var(--primary)' : user.rating >= 3.0 ? '#f59e0b' : 'var(--accent-red)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              <div className="flex-row justify-between">
                <p className="text-body-sm" style={{ color: 'var(--body)' }}>{user.id.toUpperCase()}</p>
                <p className="text-body-sm" style={{ color: 'var(--body)' }}>{user.phone}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminRatings;

