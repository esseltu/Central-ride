import React from 'react';
import { useMockData } from '../../context/MockDataContext';
import { Clock } from 'lucide-react';

const StudentHistory = () => {
  const { rides, currentUser } = useMockData();
  const myRides = rides.filter(r => r.studentId === currentUser.uid);

  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <h1 className="text-display-lg" style={{ marginBottom: 'var(--space-xl)' }}>Ride History</h1>
      
      <div className="flex-col gap-md">
        {myRides.length === 0 ? (
          <p className="text-body-md">No previous rides.</p>
        ) : (
          myRides.map(ride => (
            <div key={ride.id} className="glass-card-dark flex-col" style={{ gap: 'var(--space-3xl)' }}>
              <div className="flex-row justify-between items-center">
                <span className="text-body-md-strong text-white">
                  {new Date(ride.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className={`text-body-sm-strong ${ride.status === 'cancelled' ? 'text-danger' : 'text-success'}`}>
                  {ride.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex-col w-full">
                <div className="flex-row justify-between items-center">
                  <span className="text-body-md-strong text-white text-left flex-1" style={{ paddingRight: 'var(--space-sm)' }}>
                    {ride.pickup}
                  </span>
                  <span className="text-body-md-strong text-white text-right flex-1" style={{ paddingLeft: 'var(--space-sm)' }}>
                    {ride.dropoff}
                  </span>
                </div>
                {ride.stops && ride.stops.length > 0 && (
                  <div className="text-center mt-2">
                    <span className="text-body-sm text-white" style={{ opacity: 0.7, fontStyle: 'italic' }}>
                      + {ride.stops.length} stop(s)
                    </span>
                  </div>
                )}
              </div>

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
