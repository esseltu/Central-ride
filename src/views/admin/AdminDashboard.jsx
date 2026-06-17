import React, { useState } from 'react';
import { useMockData } from '../../context/MockDataContext';
import { Users, Activity, AlertCircle, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// AdminDashboard component: Displays platform stats, active SOS alerts, and user rating categories.
const AdminDashboard = () => {
  // Extract real-time rides and alerts from MockDataContext snapshot streams.
  const { rides, alerts } = useMockData();
  
  // Local state to toggle rating selection modal open/closed.
  const [showRatingModal, setShowRatingModal] = useState(false);
  const navigate = useNavigate();
  
  // AGGREGATED STATS:
  // Filter and count how many rides are in active transit states (requested, accepted, or in progress).
  const activeRidesCount = rides.filter(r => ['requested', 'accepted', 'in_progress'].includes(r.status)).length;
  
  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <h1 className="text-display-lg" style={{ marginBottom: 'var(--space-xl)' }}>Admin Dashboard</h1>
      
      {/* 4 STATS CARDS LAYOUT:
          - Active Rides Count
          - Mock Online Drivers count
          - Ratings Category link (opens modal)
          - Active SOS Alerts Count (turns red if alerts.length > 0)
      */}
      <div className="flex-col gap-md mb-4" style={{ marginBottom: 'var(--space-2xl)' }}>
        
        {/* Card 1: Active Rides */}
        <div className="card flex-row items-center gap-md">
          <div className="btn-icon flex-col justify-center items-center"><Activity size={20} /></div>
          <div>
            <p className="text-body-sm">Active Rides</p>
            <p className="text-display-md">{activeRidesCount}</p>
          </div>
        </div>

        {/* Card 2: Online Drivers */}
        <div className="card flex-row items-center gap-md">
          <div className="btn-icon flex-col justify-center items-center"><Users size={20} /></div>
          <div>
            <p className="text-body-sm">Online Drivers</p>
            <p className="text-display-md">12</p>
          </div>
        </div>

        {/* Card 3: User Ratings Modal Trigger */}
        <div className="card flex-row items-center gap-md" onClick={() => setShowRatingModal(true)} style={{ cursor: 'pointer' }}>
          <div className="btn-icon flex-col justify-center items-center"><Star size={20} /></div>
          <div>
            <p className="text-body-sm">User Ratings</p>
            <p className="text-display-md">View</p>
          </div>
        </div>
        
        {/* Card 4: SOS Alerts */}
        <div className="card flex-row items-center gap-md" style={{ borderLeft: alerts.length > 0 ? '4px solid var(--accent-red)' : 'none' }}>
          <div className="btn-icon flex-col justify-center items-center"><AlertCircle size={20} color={alerts.length > 0 ? 'var(--accent-red)' : 'var(--ink)'} /></div>
          <div>
            <p className="text-body-sm">SOS Alerts</p>
            <p className="text-display-md">{alerts.length}</p>
          </div>
        </div>
      </div>
      
      {/* DYNAMIC ALERT BANNER LIST:
          Only renders if there is at least one active SOS alert.
      */}
      {alerts.length > 0 && (
        <div>
          <h2 className="text-display-md" style={{ marginBottom: 'var(--space-md)' }}>Active Alerts</h2>
          {alerts.map(alert => (
            <div key={alert.id} className="card-soft mb-2" style={{ border: '1px solid var(--accent-red)', backgroundColor: '#fef2f2' }}>
              <p className="text-body-md-strong" style={{ color: 'var(--accent-red)' }}>SOS: {alert.userName} ({alert.role})</p>
              <p className="text-body-sm">Location: {alert.location}</p>
              <p className="text-body-sm">Time: {new Date(alert.time).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* MODAL WINDOW OVERLAY:
          Triggered when showRatingModal is true. Lets administrators jump to rating tables filtered by roles.
      */}
      {showRatingModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '24px', boxSizing: 'border-box'
        }}>
          <div className="card flex-col gap-md" style={{ width: '100%', maxWidth: '360px', backgroundColor: 'var(--canvas)', position: 'relative', padding: 'var(--space-2xl) var(--space-xl)' }}>
            <button onClick={() => setShowRatingModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <X size={24} color="var(--ink)" />
            </button>
            <h2 className="text-display-md text-center" style={{ marginBottom: 'var(--space-md)' }}>View Ratings</h2>
            
            {/* Navigates to subroutes corresponding to different roles */}
            <button className="btn btn-secondary" onClick={() => { setShowRatingModal(false); navigate('/admin/ratings/student'); }}>Students</button>
            <button className="btn btn-secondary" onClick={() => { setShowRatingModal(false); navigate('/admin/ratings/driver'); }}>Drivers (Car)</button>
            <button className="btn btn-secondary" onClick={() => { setShowRatingModal(false); navigate('/admin/ratings/rider'); }}>Riders (Motor)</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

