import React from 'react';
import { useMockData } from '../../context/MockDataContext';
import { Star } from 'lucide-react';

// AdminRecords component lists all completed, pending, and cancelled ride transactions logged in the system database.
const AdminRecords = () => {
  // Pull all records directly from context.
  const { rides } = useMockData();

  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <h1 className="text-display-lg" style={{ marginBottom: 'var(--space-xl)' }}>All Records</h1>
      
      <div className="flex-col gap-md">
        {rides.length === 0 ? (
          <p className="text-body-md text-center" style={{ marginTop: 'var(--space-2xl)' }}>No records found.</p>
        ) : (
          rides.map(ride => (
            <div key={ride.id} className="card-soft flex-col gap-sm">
              
              <div className="flex-row justify-between items-center">
                <span className="text-body-sm-strong">Ride #{ride.id}</span>
                <span className="text-body-sm-strong" style={{ backgroundColor: ride.status === 'cancelled' ? 'var(--status-sos)' : ride.status === 'completed' ? 'var(--status-completed)' : 'var(--status-in-progress)', color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: '10px' }}>
                  {ride.status.toUpperCase()}
                </span>
              </div>
              
              <p className="text-body-sm-strong" style={{ color: 'var(--ink)' }}>Type: {ride.type ? ride.type.toUpperCase() : 'RIDE'}</p>
              
              <div className="flex-row justify-between items-center">
                <p className="text-body-sm">Student: {ride.studentName}</p>
                {ride.driverRating && <span className="flex-row items-center gap-xs text-body-sm-strong"><Star size={12} fill="var(--ink)" color="var(--ink)" /> {ride.driverRating}</span>}
              </div>
              
              {ride.driverName && (
                <div className="flex-row justify-between items-center">
                  <p className="text-body-sm">Driver: {ride.driverName}</p>
                  {ride.studentRating && <span className="flex-row items-center gap-xs text-body-sm-strong"><Star size={12} fill="var(--ink)" color="var(--ink)" /> {ride.studentRating}</span>}
                </div>
              )}
              
              <p className="text-body-sm">Route: {ride.pickup} → {ride.dropoff}</p>
              
              {ride.stops && ride.stops.length > 0 && <p className="text-body-sm" style={{ fontStyle: 'italic', color: 'var(--body)' }}>Stops: {ride.stops.join(', ')}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminRecords;

