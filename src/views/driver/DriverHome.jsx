import React, { useState } from 'react';
import { useMockData } from '../../context/MockDataContext';
import { Star } from 'lucide-react';
import InteractiveMap from '../../components/InteractiveMap';

// DriverHome component: The core dashboard for drivers/riders to accept requests, verify passengers, and navigate.
const DriverHome = () => {
  // Extract driver-specific actions and variables from central MockDataContext.
  const { rides, activeRide, acceptRide, arriveAtPickup, startRide, endRide, submitDriverRating, currentUser, cancelRide } = useMockData();
  
  // REACT STATE HOOKS:
  // - rating: Star rating value (1-5) selected for the passenger at the end of the trip.
  // - enteredOtp: Stores the 4-digit code typed in by the driver to confirm the passenger.
  // - otpError: Validation error message displayed if the entered OTP is incorrect.
  const [rating, setRating] = useState(5);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [useTestLocation, setUseTestLocation] = useState(import.meta.env.DEV);
  const [driverEta, setDriverEta] = useState(null);
  const [driverDistance, setDriverDistance] = useState(null);
  
  // ACTIVE RIDE CONTEXT VIEW:
  // If this driver is currently conducting an accepted/in-progress ride, show the navigation dashboard.
  if (activeRide && activeRide.status !== 'requested') {
    
    // DYNAMIC MAP ROUTING LOGIC:
    // We adjust the start and end coordinates shown on the map depending on the current ride status.
    let mapPickup = activeRide.pickup;
    let mapDropoff = activeRide.dropoff;
    let routingMessage = "Tracking Passenger...";
    
    let mapPickupCoords = null;
    let mapDropoffCoords = null;
    
    if (activeRide.status === 'accepted') {
      // PHASE A: Driver is traveling to pick up the student.
      // The map route should start at the driver's 'Current Location' and end at the student's pickup point.
      mapPickup = 'Current Location';
      mapDropoff = activeRide.pickup;
      mapDropoffCoords = activeRide.pickupCoords;
      routingMessage = "Routing to Pickup...";
    } else {
      // PHASE B: Student is inside the vehicle. En route to the destination.
      // Route map from original student pickup coordinates to student destination.
      mapPickup = activeRide.pickup;
      mapDropoff = activeRide.dropoff;
      mapPickupCoords = activeRide.pickupCoords;
      mapDropoffCoords = activeRide.dropoffCoords;
      routingMessage = "Routing to Destination...";
    }

    return (
      <div className="split-layout">
        
        {/* Map on Right (Desktop) / Top (Mobile) */}
        <div className="split-main">
          <div className="mock-map" style={{ position: 'relative' }}>
             <InteractiveMap 
               pickupStr={mapPickup} 
               dropoffStr={mapDropoff} 
               pickupCoords={mapPickupCoords} 
               dropoffCoords={mapDropoffCoords} 
               pickupAccuracy={activeRide.pickupAccuracy}
               stops={activeRide.stops || []}
               stopsCoords={activeRide.stopsCoords || []}
               useTestLocation={useTestLocation}
               studentCoords={activeRide.studentLat ? [activeRide.studentLat, activeRide.studentLng] : null}
               studentUpdatedAt={activeRide.studentUpdatedAt}
               setEta={setDriverEta}
               setEstimatedPrice={setDriverDistance} // Borrowing this to trigger the distance calculation internally if needed, or we can just rely on ETA
               bottomPadding={84}
               isActiveTrip={true}
               startMarkerLabel={activeRide.status === 'accepted' ? 'You' : `Pickup: ${activeRide.pickupName || activeRide.pickup}`}
               startMarkerKind={activeRide.status === 'accepted' ? 'self' : 'pickup'}
               endMarkerLabel={activeRide.status === 'accepted' ? `Pickup: ${activeRide.pickupName || activeRide.pickup}` : `Destination: ${activeRide.dropoff}`}
               endMarkerKind={activeRide.status === 'accepted' ? 'pickup' : 'destination'}
             />
             <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '16px', fontSize: '14px', zIndex: 1000, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                {routingMessage}
             </div>
          </div>
        </div>
        
        {/* Sidebar on Left (Desktop) / Bottom (Mobile) */}
        <div className="split-sidebar mobile-pull-up">
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px 16px 0 0',
            padding: 'var(--space-xl)',
            paddingBottom: 'calc(var(--nav-height) + 24px)',
            color: 'var(--ink)',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.16)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
            maxHeight: '60dvh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 'var(--space-sm)' }}>
              <h1 className="text-display-md" style={{ color: 'var(--ink)' }}>
                Active {activeRide.type === 'parcel' ? 'Delivery' : 'Ride'}
              </h1>
              {import.meta.env.DEV && (
                <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" checked={useTestLocation} onChange={e => setUseTestLocation(e.target.checked)} /> Use campus location
                </label>
              )}
            </div>
            
            <div className="card-soft" style={{ marginTop: 'var(--space-sm)', backgroundColor: 'var(--canvas-soft)', padding: '16px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="text-body-md">Passenger: <strong>{activeRide.studentName}</strong></span>
                <span style={{ backgroundColor: 'var(--ink)', color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 'bold' }}>{activeRide.type.toUpperCase()}</span>
              </div>
              
              <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px', marginRight: '12px' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ink)' }}></div>
                   <div style={{ width: '2px', flex: 1, backgroundColor: 'var(--ink)', opacity: 0.2, margin: '4px 0' }}></div>
                   <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--ink)' }}></div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ paddingBottom: '16px' }}>
                    <p className="text-body-md" style={{ margin: 0, fontWeight: 'bold' }}>{activeRide.pickupName || activeRide.pickup}</p>
                  </div>
                  <div>
                    {activeRide.stops && activeRide.stops.map((stop, idx) => (
                      <p key={idx} className="text-body-sm" style={{ color: 'var(--body)', margin: '0 0 8px 0' }}>Stop {idx + 1}: {stop}</p>
                    ))}
                    <p className="text-body-md" style={{ margin: 0, fontWeight: 'bold' }}>{activeRide.dropoff}</p>
                  </div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-body-md">Total Fare</span>
                <span className="text-body-lg" style={{ fontWeight: 'bold', color: 'var(--ink)' }}>GH₵ {activeRide.price}</span>
              </div>
            </div>

            {/* FLOW 1: Driver Accepted. En Route to Pickup. */}
            {activeRide.status === 'accepted' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', backgroundColor: 'var(--status-in-progress)', color: 'white', borderRadius: '12px', marginTop: '8px' }}>
                  <span>Distance to pickup:</span>
                  <strong>{driverEta || 'calculating...'}</strong>
                </div>
                <button 
                  className="btn btn-large w-full" 
                  style={{ backgroundColor: 'var(--primary)', color: 'white', marginTop: 'var(--space-md)', borderRadius: 'var(--radius-pill)' }} 
                  onClick={() => {
                    const lat = activeRide.pickupCoords?.[0] || activeRide.pickupLat;
                    const lng = activeRide.pickupCoords?.[1] || activeRide.pickupLng;
                    if (lat && lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                  }}
                >
                  Navigate to pickup
                </button>
                <button className="btn btn-large w-full" style={{ backgroundColor: 'var(--ink)', color: 'var(--on-dark)', marginTop: '8px', borderRadius: 'var(--radius-pill)' }} onClick={() => arriveAtPickup(activeRide.id)}>
                  Arrived at Pickup
                </button>
              </>
            )}

            {/* FLOW 2: Driver Arrived. Verifying OTP Code. */}
            {activeRide.status === 'arrived' && (
              <div className="flex-col gap-sm" style={{ backgroundColor: 'var(--canvas-soft)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <p className="text-body-md-strong">Confirm Passenger</p>
                <p className="text-body-sm" style={{ color: 'var(--body)' }}>Ask the passenger for their 4-digit OTP code to start.</p>
                <input 
                  className="input-field" 
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px', padding: 'var(--space-sm)', backgroundColor: 'white', color: 'var(--ink)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,0,0,0.1)' }} 
                  placeholder="----" 
                  maxLength={4}
                  value={enteredOtp}
                  onChange={e => {
                    setEnteredOtp(e.target.value);
                    setOtpError('');
                  }}
                />
                {otpError && <p style={{ color: 'var(--status-sos)', fontSize: '12px', textAlign: 'center' }}>{otpError}</p>}
                
                {/* OTP Validation trigger button */}
                <button 
                  className="btn btn-large w-full" 
                  style={{ backgroundColor: 'var(--ink)', color: 'var(--on-dark)', borderRadius: 'var(--radius-pill)' }}
                  onClick={() => {
                    // Check if input matches code generated on request creation
                    if (enteredOtp === (activeRide.otp || '1234')) {
                       startRide(activeRide.id);
                       setEnteredOtp('');
                       
                       // DYNAMIC GOOGLE MAPS ROUTE DEEP LINKING:
                       // Auto-trigger navigation directions immediately after OTP verification.
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
            
            {/* FLOW 3: Trip In Progress. Can be completed when driver reaches dropoff. */}
            {activeRide.status === 'in_progress' && (
              <button className="btn btn-large w-full" style={{ backgroundColor: 'var(--ink)', color: 'var(--on-dark)', marginTop: 'var(--space-md)', borderRadius: 'var(--radius-pill)' }} onClick={() => endRide(activeRide.id)}>
                Complete {activeRide.type === 'parcel' ? 'Delivery' : 'Ride'}
              </button>
            )}

            {/* FLOW 4: Rating passenger */}
            {activeRide.status === 'driver_rating' && (
              <div className="flex-col gap-sm text-center" style={{ backgroundColor: 'var(--canvas-soft)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <p className="text-body-md-strong">Rate Passenger</p>
                <p className="text-body-sm" style={{ color: 'var(--body)' }}>How was {activeRide.studentName}?</p>
                <div className="flex-row justify-center gap-sm" style={{ margin: 'var(--space-sm) 0' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={32} fill={star <= rating ? 'var(--ink)' : 'none'} color={star <= rating ? 'var(--ink)' : 'rgba(0,0,0,0.3)'} onClick={() => setRating(star)} style={{ cursor: 'pointer' }} />
                  ))}
                </div>
                <button className="btn btn-large w-full" style={{ backgroundColor: 'var(--ink)', color: 'var(--on-dark)', borderRadius: 'var(--radius-pill)' }} onClick={() => submitDriverRating(activeRide.id, rating)}>
                  Submit Rating
                </button>
              </div>
            )}

            {/* FLOW 5: Waiting on payment completion from student device */}
            {activeRide.status === 'payment_pending' && (
              <div className="flex-col gap-sm text-center" style={{ backgroundColor: 'var(--canvas-soft)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <p className="text-body-md-strong">Waiting for Payment...</p>
                <p className="text-body-sm" style={{ color: 'var(--body)' }}>The passenger is completing the MoMo payment.</p>
              </div>
            )}
            
            {/* Cancellation Option */}
            {(activeRide.status === 'accepted' || activeRide.status === 'arrived') && (
              <button 
                className="btn btn-large w-full" 
                style={{ backgroundColor: 'transparent', color: 'var(--ink)', border: '1px solid rgba(0,0,0,0.2)', marginTop: 'var(--space-xs)', borderRadius: 'var(--radius-pill)' }} 
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

  // DEFAULT VIEW: LIST PENDING RIDE REQUESTS
  // 1. FILTER RIDES:
  // Only display rides whose status is 'requested'.
  // We also restrict 'parcel' requests to drivers registered as 'motor' (motorcycles),
  // as standard car drivers do not deliver parcels in this campus model.
  const requestedRides = rides.filter(r => {
    if (r.status !== 'requested') return false;
    if (r.type === 'parcel' && currentUser.vehicleType !== 'motor') return false;
    return true;
  }).sort((a, b) => {
    // 2. SOS PRIORITY SORTING:
    // Sort emergency requests to the top of the list so drivers can address them instantly.
    if (a.type === 'emergency' && b.type !== 'emergency') return -1;
    if (a.type !== 'emergency' && b.type === 'emergency') return 1;
    return 0;
  });

  return (
    <div className="split-layout">
      {/* Map on Right */}
      <div className="split-main">
        <div className="mock-map" style={{ position: 'relative' }}>
           <InteractiveMap useTestLocation={useTestLocation} bottomPadding={84} />
           <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--canvas)', color: 'var(--ink)', padding: '6px 12px', borderRadius: '16px', fontSize: '14px', zIndex: 1000, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontWeight: 'bold' }}>
              Waiting for Requests...
           </div>
        </div>
      </div>
      
      {/* Sidebar showing matching pending requests */}
      <div className="split-sidebar mobile-pull-up">
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px 16px 0 0',
          padding: 'var(--space-xl)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.16)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          maxHeight: '60dvh',
          overflowY: 'auto'
        }}>
          <h1 className="text-display-lg" style={{ marginBottom: 'var(--space-sm)' }}>Requests</h1>
          
          <div className="flex-col gap-md">
            {requestedRides.length === 0 ? (
              <p className="text-body-md text-center" style={{ marginTop: 'var(--space-3xl)', color: 'var(--body)' }}>Searching for requests...</p>
            ) : (
              requestedRides.map(ride => (
                <div key={ride.id} className="flex-col gap-sm" style={{ 
                  backgroundColor: 'var(--canvas-soft)', 
                  borderLeft: ride.type === 'emergency' ? '6px solid var(--status-sos)' : ride.type === 'parcel' ? '4px solid var(--ink)' : '4px solid transparent', 
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}>
                  <div className="flex-row justify-between items-center">
                    <p className="text-body-md-strong" style={{ color: ride.type === 'emergency' ? 'var(--status-sos)' : 'var(--ink)' }}>{ride.studentName}</p>
                    <span className="text-body-sm-strong" style={{ backgroundColor: ride.type === 'emergency' ? 'var(--status-sos)' : 'var(--ink)', color: 'var(--on-dark)', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>
                      {ride.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-body-sm" style={{ color: 'var(--body)' }}>From: {ride.pickup}</p>
                  {ride.stops && ride.stops.length > 0 && <p className="text-body-sm" style={{ fontStyle: 'italic', color: 'var(--body)' }}>+ {ride.stops.length} stop(s)</p>}
                  <p className="text-body-sm" style={{ color: 'var(--body)' }}>To: {ride.dropoff}</p>
                  <div className="flex-row justify-between items-center mt-auto" style={{ marginTop: 'var(--space-xs)' }}>
                    <span className="text-body-lg" style={{ color: ride.type === 'emergency' ? 'var(--status-sos)' : 'var(--ink)', fontWeight: 'bold' }}>GH₵ {ride.price}</span>
                    <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 'var(--radius-pill)', backgroundColor: ride.type === 'emergency' ? 'var(--status-sos)' : 'var(--ink)', color: 'var(--on-dark)', minHeight: '44px', fontWeight: 'bold' }} onClick={() => acceptRide(ride.id)}>
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

