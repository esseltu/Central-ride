import React, { useState } from 'react';
import { useMockData } from '../../context/MockDataContext';
import { Star } from 'lucide-react';
import InteractiveMap from '../../components/InteractiveMap';

const DriverHome = () => {
  const { rides, activeRide, acceptRide, arriveAtPickup, startRide, endRide, submitDriverRating, currentUser, cancelRide } = useMockData();
  const [rating, setRating] = useState(5);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  
  if (activeRide && activeRide.status !== 'requested') {
    // Determine Map Routing based on Ride Status
    let mapPickup = activeRide.pickup;
    let mapDropoff = activeRide.dropoff;
    let routingMessage = "Tracking Passenger...";
    
    let mapPickupCoords = null;
    let mapDropoffCoords = null;
    
    if (activeRide.status === 'accepted') {
      // Driver is routing TO the student pickup point
      mapPickup = 'Current Location';
      mapDropoff = activeRide.pickup;
      mapDropoffCoords = activeRide.pickupCoords;
      routingMessage = "Routing to Pickup...";
    } else {
      // Driver is en route TO the dropoff point
      mapPickup = activeRide.pickup;
      mapDropoff = activeRide.dropoff;
      mapPickupCoords = activeRide.pickupCoords;
      mapDropoffCoords = activeRide.dropoffCoords;
      routingMessage = "Routing to Destination...";
    }

    return (
      <div className="split-layout">
        <div className="split-main">
          <div className="mock-map" style={{ position: 'relative' }}>
             <InteractiveMap 
               pickupStr={mapPickup} 
               dropoffStr={mapDropoff} 
               pickupCoords={mapPickupCoords} 
               dropoffCoords={mapDropoffCoords} 
               stops={activeRide.stops || []}
               stopsCoords={activeRide.stopsCoords || []}
             />
             <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '16px', fontSize: '14px', zIndex: 1000, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                {routingMessage}
             </div>
          </div>
        </div>
        
      <div className="split-sidebar mobile-pull-up">
        <div style={{
            backgroundColor: 'rgba(128, 0, 32, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-xl)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)'
          }}>
            <h1 className="text-display-md mb-2" style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'var(--space-sm)' }}>
              Active {activeRide.type === 'parcel' ? 'Delivery' : 'Ride'}
            </h1>
            
            <div className="flex-col gap-sm" style={{ marginTop: 'var(--space-sm)' }}>
              <p className="text-body-md">Passenger: <strong>{activeRide.studentName}</strong></p>
              <p className="text-body-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>From: {activeRide.pickup}</p>
              
              {activeRide.stops && activeRide.stops.map((stop, idx) => (
                 <p key={idx} className="text-body-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Stop {idx + 1}: {stop}</p>
              ))}
              
              <p className="text-body-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>To: {activeRide.dropoff}</p>
              <p className="text-body-sm" style={{ color: 'white' }}>Type: <strong style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px' }}>{activeRide.type.toUpperCase()}</strong></p>
              <p className="text-body-lg" style={{ fontWeight: 'bold', color: 'white' }}>Price: GH₵ {activeRide.price}</p>
            </div>

            {activeRide.status === 'accepted' && (
              <button className="btn btn-large" style={{ backgroundColor: 'white', color: 'var(--primary)', marginTop: 'var(--space-md)' }} onClick={() => arriveAtPickup(activeRide.id)}>
                Arrived at Pickup
              </button>
            )}

            {activeRide.status === 'arrived' && (
              <div className="flex-col gap-sm" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <p className="text-body-md-strong">Confirm Passenger</p>
                <p className="text-body-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Ask the passenger for their 4-digit OTP code to start.</p>
                <input 
                  className="input-field" 
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px', padding: 'var(--space-sm)', backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--ink)' }} 
                  placeholder="----" 
                  maxLength={4}
                  value={enteredOtp}
                  onChange={e => {
                    setEnteredOtp(e.target.value);
                    setOtpError('');
                  }}
                />
                {otpError && <p style={{ color: '#ffb3b3', fontSize: '12px', textAlign: 'center' }}>{otpError}</p>}
                <button 
                  className="btn btn-large" 
                  style={{ backgroundColor: 'white', color: 'var(--primary)' }}
                  onClick={() => {
                    if (enteredOtp === (activeRide.otp || '1234')) {
                       startRide(activeRide.id);
                       setEnteredOtp('');
                       
                       // Open Google Maps
                       const getCoordString = (coord, fallbackStr) => {
                         if (coord && Array.isArray(coord) && coord[0] !== undefined) return `${coord[0]},${coord[1]}`;
                         if (coord && coord.lat !== undefined) return `${coord.lat},${coord.lng}`;
                         if (fallbackStr && fallbackStr !== 'Selected on Map') return encodeURIComponent(fallbackStr);
                         return null;
                       };

                       const origin = getCoordString(activeRide.pickupCoords, activeRide.pickup) || encodeURIComponent(activeRide.pickup);
                       const destination = getCoordString(activeRide.dropoffCoords, activeRide.dropoff) || encodeURIComponent(activeRide.dropoff);
                       let gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
                       
                       if (activeRide.stops && activeRide.stops.length > 0) {
                         const waypoints = activeRide.stops.map((stopStr, i) => {
                           const coord = activeRide.stopsCoords ? activeRide.stopsCoords[i] : null;
                           return getCoordString(coord, stopStr);
                         }).filter(Boolean).join('|');
                         
                         if (waypoints) {
                           gmapsUrl += `&waypoints=${waypoints}`;
                         }
                       }
                       window.open(gmapsUrl, '_blank');
                       
                    } else {
                       setOtpError('Invalid OTP Code');
                    }
                  }}
                  disabled={enteredOtp.length !== 4}
                >
                  Verify & Start {activeRide.type === 'parcel' ? 'Delivery' : 'Ride'}
                </button>
              </div>
            )}
            
            {activeRide.status === 'in_progress' && (
              <button className="btn btn-large" style={{ backgroundColor: 'white', color: 'var(--primary)', marginTop: 'var(--space-md)' }} onClick={() => endRide(activeRide.id)}>
                Complete {activeRide.type === 'parcel' ? 'Delivery' : 'Ride'}
              </button>
            )}

            {activeRide.status === 'driver_rating' && (
              <div className="flex-col gap-sm text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <p className="text-body-md-strong">Rate Passenger</p>
                <p className="text-body-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>How was {activeRide.studentName}?</p>
                <div className="flex-row justify-center gap-sm" style={{ margin: 'var(--space-sm) 0' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={32} fill={star <= rating ? '#ffd700' : 'none'} color={star <= rating ? '#ffd700' : 'rgba(255,255,255,0.3)'} onClick={() => setRating(star)} style={{ cursor: 'pointer' }} />
                  ))}
                </div>
                <button className="btn btn-large" style={{ backgroundColor: 'white', color: 'var(--primary)' }} onClick={() => submitDriverRating(activeRide.id, rating)}>
                  Submit Rating
                </button>
              </div>
            )}

            {activeRide.status === 'payment_pending' && (
              <div className="flex-col gap-sm text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <p className="text-body-md-strong">Waiting for Payment...</p>
                <p className="text-body-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>The passenger is completing the MoMo payment.</p>
              </div>
            )}
            
            {(activeRide.status === 'accepted' || activeRide.status === 'arrived') && (
              <button 
                className="btn btn-large w-full" 
                style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.5)', marginTop: 'var(--space-xs)' }} 
                onClick={() => {
                  if (window.confirm("Are you sure you want to cancel this ride?")) {
                    cancelRide(activeRide.id);
                  }
                }}
              >
                Cancel {activeRide.type === 'parcel' ? 'Delivery' : 'Ride'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filter requests based on vehicle type
  const requestedRides = rides.filter(r => {
    if (r.status !== 'requested') return false;
    // Motor riders have exclusive rights to parcels. Car drivers cannot see them.
    if (r.type === 'parcel' && currentUser.vehicleType !== 'motor') return false;
    return true;
  }).sort((a, b) => {
    if (a.type === 'emergency' && b.type !== 'emergency') return -1;
    if (a.type !== 'emergency' && b.type === 'emergency') return 1;
    return 0; // fallback to original order
  });

  return (
    <div className="split-layout">
      <div className="split-main">
        <div className="mock-map" style={{ position: 'relative' }}>
           <InteractiveMap />
           <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--canvas)', color: 'var(--ink)', padding: '6px 12px', borderRadius: '16px', fontSize: '14px', zIndex: 1000, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontWeight: 'bold' }}>
              Waiting for Requests...
           </div>
        </div>
      </div>
      
      <div className="split-sidebar mobile-pull-up">
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)'
        }}>
          <h1 className="text-display-lg" style={{ marginBottom: 'var(--space-sm)' }}>Requests</h1>
          
          <div className="flex-col gap-md">
            {requestedRides.length === 0 ? (
              <p className="text-body-md text-center" style={{ marginTop: 'var(--space-3xl)', color: 'var(--body)' }}>Searching for requests...</p>
            ) : (
              requestedRides.map(ride => (
                <div key={ride.id} className="flex-col gap-sm" style={{ 
                  backgroundColor: ride.type === 'emergency' ? 'rgba(254, 242, 242, 0.8)' : 'rgba(255, 255, 255, 0.85)', 
                  borderLeft: ride.type === 'emergency' ? '6px solid var(--accent-red)' : ride.type === 'parcel' ? '4px solid var(--primary)' : '4px solid transparent', 
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.8)'
                }}>
                  <div className="flex-row justify-between items-center">
                    <p className="text-body-md-strong" style={{ color: ride.type === 'emergency' ? 'var(--accent-red)' : 'var(--ink)' }}>{ride.studentName}</p>
                    <span className="text-body-sm-strong" style={{ backgroundColor: ride.type === 'emergency' ? 'var(--accent-red)' : 'var(--canvas-soft)', color: ride.type === 'emergency' ? 'white' : 'var(--ink)', padding: '4px 12px', borderRadius: '16px' }}>
                      {ride.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-body-sm" style={{ color: 'var(--body)' }}>From: {ride.pickup}</p>
                  {ride.stops && ride.stops.length > 0 && <p className="text-body-sm" style={{ fontStyle: 'italic', color: 'var(--body)' }}>+ {ride.stops.length} stop(s)</p>}
                  <p className="text-body-sm" style={{ color: 'var(--body)' }}>To: {ride.dropoff}</p>
                  <div className="flex-row justify-between items-center mt-auto" style={{ marginTop: 'var(--space-xs)' }}>
                    <span className="text-body-lg" style={{ color: ride.type === 'emergency' ? 'var(--accent-red)' : 'var(--primary)', fontWeight: 'bold' }}>GH₵ {ride.price}</span>
                    <button className="btn btn-primary" style={{ padding: '8px 24px', borderRadius: '24px', backgroundColor: ride.type === 'emergency' ? 'var(--accent-red)' : 'var(--primary)' }} onClick={() => acceptRide(ride.id)}>
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverHome;
