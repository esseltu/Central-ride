import React from 'react';
import { useMockData } from '../../context/MockDataContext';
import { Clock } from 'lucide-react';

// StudentHistory component displays a list of previous ride requests submitted by the logged-in student.
const StudentHistory = () => {
  // Extract global rides list and user credentials from MockDataContext.
  const { rides, currentUser } = useMockData();
  
  // ARRAY FILTERING:
  // We scan the global rides list and filter out only the ones that match this student's ID.
  const myRides = rides.filter(r => r.studentId === currentUser.uid);

  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <h1 className="text-display-lg" style={{ marginBottom: 'var(--space-xl)' }}>Ride History</h1>
      
      <div className="flex-col gap-md">
        {/* CONDITIONAL RENDERING:
            If the student has no previous rides (myRides array is empty), show a fallback text.
            Otherwise, map over `myRides` and render a history card for each ride.
        */}
        {myRides.length === 0 ? (
          <p className="text-body-md">No previous rides.</p>
        ) : (
          myRides.map(ride => (
            // Every mapped item in React must have a unique `key` prop (here we use the Firestore ride document ID).
            <div key={ride.id} className="glass-card-dark flex-col" style={{ gap: 'var(--space-3xl)' }}>
              
              {/* Card Header: Date & Status */}
              <div className="flex-row justify-between items-center">
                <span className="text-body-md-strong text-white">
                  {/* Convert the ISO date string to a human-readable local date format */}
                  {new Date(ride.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                {/* Dynamically colors status text based on whether the ride was cancelled or completed */}
                <span className={`text-body-sm-strong ${ride.status === 'cancelled' ? 'text-danger' : 'text-success'}`}>
                  {ride.status.toUpperCase()}
                </span>
              </div>
              
              {/* Route Details */}
              <div className="flex-col w-full">
                <div className="flex-row justify-between items-center">
                  <span className="text-body-md-strong text-white text-left flex-1" style={{ paddingRight: 'var(--space-sm)' }}>
                    {ride.pickup}
                  </span>
                  <span className="text-body-md-strong text-white text-right flex-1" style={{ paddingLeft: 'var(--space-sm)' }}>
                    {ride.dropoff}
                  </span>
                </div>
                {/* If the ride has intermediate stops, display the stop count */}
                {ride.stops && ride.stops.length > 0 && (
                  <div className="text-center mt-2">
                    <span className="text-body-sm text-white" style={{ opacity: 0.7, fontStyle: 'italic' }}>
                      + {ride.stops.length} stop(s)
                    </span>
                  </div>
                )}
              </div>

              {/* Price Details */}
              <div className="flex-row items-center">
                <span className="text-body-md-strong text-white">GH₵ {ride.price}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentHistory;

