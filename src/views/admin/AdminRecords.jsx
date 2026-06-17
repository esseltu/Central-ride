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
        {/* Iterate over all system rides and render a card for each */}
        {rides.map(ride => (
          <div key={ride.id} className="card-soft flex-col gap-sm">
            
            {/* Card Header: Ride ID & Status */}
            <div className="flex-row justify-between items-center">
              <span className="text-body-sm-strong">Ride #{ride.id}</span>
              <span className="text-body-sm" style={{ color: 'var(--primary)' }}>{ride.status}</span>
            </div>
            
            <p className="text-body-sm-strong" style={{ color: 'var(--primary)' }}>Type: {ride.type ? ride.type.toUpperCase() : 'RIDE'}</p>
            
            {/* Student metadata and rating given to the student by the driver */}
            <div className="flex-row justify-between items-center">
              <p className="text-body-sm">Student: {ride.studentName}</p>
              {ride.driverRating && <span className="flex-row items-center gap-xs text-body-sm-strong"><Star size={12} fill="var(--primary)" color="var(--primary)" /> {ride.driverRating}</span>}
            </div>
            
            {/* Driver metadata (if accepted) and rating given to the driver by the student */}
            {ride.driverName && (
              <div className="flex-row justify-between items-center">
                <p className="text-body-sm">Driver: {ride.driverName}</p>
                {ride.studentRating && <span className="flex-row items-center gap-xs text-body-sm-strong"><Star size={12} fill="var(--primary)" color="var(--primary)" /> {ride.studentRating}</span>}
              </div>
            )}
            
            {/* Route description */}
            <p className="text-body-sm">Route: {ride.pickup} → {ride.dropoff}</p>
            
            {/* Render any intermediate stops formatted as a comma-separated list string */}
            {ride.stops && ride.stops.length > 0 && <p className="text-body-sm" style={{ fontStyle: 'italic', color: 'var(--body)' }}>Stops: {ride.stops.join(', ')}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRecords;

