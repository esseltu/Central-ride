import React, { useState } from 'react';
import { useMockData } from '../../context/MockDataContext';
import { MapPin, Navigation, ShieldAlert, Plus, X, Car, Package, Star, LocateFixed, Map } from 'lucide-react';
import InteractiveMap, { CAMPUS_LOCATIONS } from '../../components/InteractiveMap';

const StudentHome = () => {
  const { activeRide, requestRide, triggerSOS, confirmPayment, submitStudentRating, cancelRide } = useMockData();
  const [pickup, setPickup] = useState('Current Location');
  const [dropoff, setDropoff] = useState('');
  const [stops, setStops] = useState([]);
  const [rideType, setRideType] = useState('ride'); // 'ride' or 'parcel'
  const [rating, setRating] = useState(5);
  const [eta, setEta] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(10);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [customPickupCoords, setCustomPickupCoords] = useState(null);
  const [customDropoffCoords, setCustomDropoffCoords] = useState(null);
  const [customStopsCoords, setCustomStopsCoords] = useState([]);
  const [selectingMap, setSelectingMap] = useState(null);

  const handleMapClick = (coords) => {
    if (selectingMap === 'pickup') {
      setPickup('Selected on Map');
      setCustomPickupCoords(coords);
      setSelectingMap(null);
    } else if (selectingMap === 'dropoff') {
      setDropoff('Selected on Map');
      setCustomDropoffCoords(coords);
      setSelectingMap(null);
    } else if (typeof selectingMap === 'number') {
      const newStops = [...stops];
      newStops[selectingMap] = 'Selected on Map';
      setStops(newStops);
      
      const newStopsCoords = [...customStopsCoords];
      newStopsCoords[selectingMap] = coords;
      setCustomStopsCoords(newStopsCoords);
      setSelectingMap(null);
    }
  };
  
  const handleAddStop = () => {
    setStops([...stops, '']);
    setCustomStopsCoords([...customStopsCoords, null]);
  };

  const openGoogleMaps = () => {
    if (!activeRide) return;
    
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
  };

  const handleStopChange = (index, value) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
    
    const newStopsCoords = [...customStopsCoords];
    newStopsCoords[index] = null;
    setCustomStopsCoords(newStopsCoords);
  };

  const handleRemoveStop = (index) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
    
    const newStopsCoords = [...customStopsCoords];
    newStopsCoords.splice(index, 1);
    setCustomStopsCoords(newStopsCoords);
  };

  if (activeRide) {
    if (activeRide.status === 'payment_pending' || activeRide.status === 'driver_rating') {
      return (
        <div style={{ padding: 'var(--space-xl)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 className="text-display-lg mb-2 text-center">Payment Required</h2>
          {activeRide.status === 'driver_rating' ? (
             <p className="text-body-md text-center" style={{ marginBottom: 'var(--space-2xl)' }}>Driver is finalizing the ride...</p>
          ) : (
             <p className="text-body-md text-center" style={{ marginBottom: 'var(--space-2xl)' }}>Please pay your driver via Mobile Money.</p>
          )}
          
          <div className="card-soft flex-col gap-sm" style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
             <p className="text-body-md">Amount Due</p>
             <p className="text-display-xl" style={{ color: 'var(--primary)' }}>GH₵ {activeRide.price}</p>
             <hr style={{ width: '100%', borderColor: 'var(--surface-pressed)', margin: 'var(--space-md) 0' }} />
             <p className="text-body-sm">Send MoMo to:</p>
             <p className="text-body-md-strong">{activeRide.driverName}</p>
             <p className="text-body-lg" style={{ letterSpacing: '2px', fontWeight: 'bold' }}>{activeRide.driverMomo || 'Not Provided'}</p>
          </div>

          <button className="btn btn-large" onClick={() => confirmPayment(activeRide.id)} disabled={activeRide.status === 'driver_rating'} style={{ opacity: activeRide.status === 'driver_rating' ? 0.5 : 1 }}>
            {activeRide.status === 'driver_rating' ? 'Waiting...' : 'I have paid via MoMo'}
          </button>
        </div>
      );
    }

    if (activeRide.status === 'student_rating') {
      return (
        <div style={{ padding: 'var(--space-xl)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="card-soft text-center" style={{ backgroundColor: 'var(--canvas)', border: '1px solid var(--surface-pressed)' }}>
            <p className="text-display-md" style={{ marginBottom: 'var(--space-xs)' }}>Rate your trip</p>
            <p className="text-body-sm" style={{ marginBottom: 'var(--space-md)' }}>How was {activeRide.driverName}?</p>
            <div className="flex-row justify-center gap-sm" style={{ marginBottom: 'var(--space-lg)' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={32} fill={star <= rating ? 'var(--primary)' : 'none'} color={star <= rating ? 'var(--primary)' : 'var(--ink)'} onClick={() => setRating(star)} />
              ))}
            </div>
            <button className="btn btn-large" onClick={() => submitStudentRating(activeRide.id, rating)}>
              Submit Rating
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="split-layout">
        {/* Map on Right (Desktop) / Top (Mobile) */}
        <div className="split-main">
          <div className="mock-map" style={{ position: 'relative' }}>
             <InteractiveMap 
               pickupStr={activeRide.pickup} 
               dropoffStr={activeRide.dropoff} 
               pickupCoords={activeRide.pickupCoords} 
               dropoffCoords={activeRide.dropoffCoords} 
               stops={activeRide.stops || []}
             />
             <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '16px', fontSize: '14px', zIndex: 1000, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                Tracking {activeRide.type === 'parcel' ? 'Parcel' : 'Ride'}...
             </div>
          </div>
        </div>
        
        {/* Sidebar on Left (Desktop) / Bottom (Mobile) */}
        <div className="split-sidebar mobile-pull-up">
          <div style={{
            backgroundColor: 'rgba(128, 0, 32, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-xl)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 className="text-display-md mb-2" style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'var(--space-sm)' }}>
              {activeRide.type === 'parcel' ? 'Parcel Delivery ' : 'Ride '} 
              {activeRide.status === 'requested' ? 'Requested' : activeRide.status === 'in_progress' ? 'In Progress' : activeRide.status === 'arrived' ? 'Arrived' : 'Accepted'}
            </h2>
            
            <div className="flex-col gap-md" style={{ marginTop: 'var(--space-md)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Status</span>
                 <strong style={{ letterSpacing: '1px' }}>{activeRide.status.replace('_', ' ').toUpperCase()}</strong>
               </div>

               {activeRide.driverName && (
                 <>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{activeRide.driverType === 'motor' ? 'Rider' : 'Driver'}</span>
                     <strong>{activeRide.driverName}</strong>
                   </div>
                   {(activeRide.driverCar || activeRide.driverPlate) && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xs)' }}>
                       <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Vehicle</span>
                       <div style={{ textAlign: 'right' }}>
                         {activeRide.driverCar && <strong style={{ display: 'block', fontSize: '14px' }}>{activeRide.driverCar}</strong>}
                         {activeRide.driverPlate && <span style={{ display: 'inline-block', backgroundColor: 'var(--canvas)', color: 'var(--ink)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{activeRide.driverPlate}</span>}
                       </div>
                     </div>
                   )}
                 </>
               )}

               {activeRide.status === 'accepted' && (
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>ETA</span>
                   <strong>4 mins</strong>
                 </div>
               )}

               {activeRide.status === 'arrived' && (
                 <div style={{ padding: 'var(--space-sm) 0', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)' }}>
                   <strong>{activeRide.driverType === 'motor' ? 'Rider' : 'Driver'} is outside!</strong>
                 </div>
               )}

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                 <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>OTP Code</span>
                 <strong style={{ fontSize: '24px', letterSpacing: '6px' }}>{activeRide.otp || '1234'}</strong>
               </div>
               
               {activeRide.stops && activeRide.stops.length > 0 && (
                 <div style={{ marginTop: 'var(--space-xs)' }}>
                   <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Stops</span>
                   {activeRide.stops.map((stop, idx) => (
                     <p key={idx} style={{ fontSize: '14px', margin: '4px 0 0 0' }}>• {stop}</p>
                   ))}
                 </div>
               )}
            </div>

            {(activeRide.status === 'in_progress' || activeRide.status === 'accepted' || activeRide.status === 'arrived') && (
              <button 
                className="btn btn-large w-full" 
                style={{ backgroundColor: 'white', color: 'var(--ink)', marginTop: 'var(--space-md)' }} 
                onClick={openGoogleMaps}
              >
                <Map size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }}/>
                Open in Google Maps
              </button>
            )}

            <button className="btn btn-large w-full" style={{ backgroundColor: 'var(--accent-red)', color: 'white', marginTop: 'var(--space-md)', border: '1px solid rgba(255,255,255,0.2)' }} onClick={triggerSOS}>
              <ShieldAlert size={20} />
              SOS Emergency
            </button>
            
            {(activeRide.status === 'requested' || activeRide.status === 'accepted') && (
              <button 
                className="btn btn-large w-full" 
                style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.5)', marginTop: 'var(--space-md)' }} 
                onClick={() => {
                  if (window.confirm("Are you sure you want to cancel this request?")) {
                    cancelRide(activeRide.id);
                  }
                }}
              >
                Cancel Ride
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="split-layout">
      {/* Map on Right (Desktop) / Top (Mobile) */}
      <div className="split-main">
        <div className="mock-map" style={{ position: 'relative' }}>
           <InteractiveMap 
             pickupStr={pickup} 
             dropoffStr={dropoff} 
             pickupCoords={customPickupCoords}
             dropoffCoords={customDropoffCoords}
             setEta={setEta} 
             setEstimatedPrice={setEstimatedPrice}
             onLocationFound={setGpsCoords} 
             stops={stops}
             stopsCoords={customStopsCoords}
             onMapClick={handleMapClick}
           />
           
           {selectingMap !== null && (
             <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--ink)', color: 'white', padding: '12px 24px', borderRadius: '24px', fontSize: '14px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
               <Map size={16} /> Tap on the map to set {typeof selectingMap === 'number' ? `Stop ${selectingMap + 1}` : selectingMap}
             </div>
           )}
           

        </div>
      </div>
      
      {/* Form on Left (Desktop) / Bottom (Mobile) */}
      <div className="split-sidebar mobile-pull-up">
        <div className="card flex-col gap-md">
          
          <div className="flex-row gap-sm" style={{ backgroundColor: 'var(--canvas-soft)', padding: 'var(--space-xxs)', borderRadius: 'var(--radius-pill)' }}>
            <button 
              className="btn flex-row items-center justify-center gap-sm" 
              style={{ flex: 1, backgroundColor: rideType === 'ride' ? 'var(--canvas)' : 'transparent', borderRadius: 'var(--radius-pill)', padding: 'var(--space-xs)' }}
              onClick={() => setRideType('ride')}
            >
              <Car size={16} /> Ride
            </button>
            <button 
              className="btn flex-row items-center justify-center gap-sm" 
              style={{ flex: 1, backgroundColor: rideType === 'parcel' ? 'var(--canvas)' : 'transparent', borderRadius: 'var(--radius-pill)', padding: 'var(--space-xs)' }}
              onClick={() => setRideType('parcel')}
            >
              <Package size={16} /> Parcel
            </button>
            <button 
              className="btn flex-row items-center justify-center gap-sm" 
              style={{ flex: 1, backgroundColor: rideType === 'emergency' ? 'var(--accent-red)' : 'transparent', color: rideType === 'emergency' ? 'var(--on-primary)' : 'var(--accent-red)', borderRadius: 'var(--radius-pill)', padding: 'var(--space-xs)' }}
              onClick={() => {
                setRideType('emergency');
                setDropoff('School Clinic');
              }}
            >
              <ShieldAlert size={16} /> Emergency
            </button>
          </div>

          <h2 className="text-display-md">
            {rideType === 'parcel' ? 'Where to deliver?' : rideType === 'emergency' ? 'Emergency Destination' : 'Where to?'}
          </h2>
          
          <div className="flex-col gap-sm">
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--canvas-softer)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-sm)' }}>
              <div style={{ padding: 'var(--space-sm)' }}><MapPin size={20} color="var(--primary)" /></div>
              <input 
                className="input-field" 
                style={{ backgroundColor: 'transparent', paddingLeft: 0, flex: 1, color: pickup === 'Current Location' || pickup === 'Selected on Map' ? 'var(--primary)' : 'inherit', fontWeight: pickup === 'Current Location' || pickup === 'Selected on Map' ? 'bold' : 'normal' }} 
                placeholder="Enter pickup or select on map"
                value={pickup} 
                onChange={e => {
                  setPickup(e.target.value);
                  setCustomPickupCoords(null);
                }}
              />
              <button 
                onClick={() => setSelectingMap('pickup')}
                style={{ background: 'none', border: 'none', color: selectingMap === 'pickup' ? 'var(--primary)' : 'var(--ink)', cursor: 'pointer', padding: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Choose on Map"
              >
                <Map size={20} />
              </button>
              <button 
                onClick={() => {
                  setPickup('Current Location');
                  setCustomPickupCoords(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Use Current Location"
              >
                <LocateFixed size={20} />
              </button>
            </div>
            
            {stops.map((stop, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--canvas-softer)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-sm)' }}>
                <div style={{ padding: 'var(--space-sm)' }}><MapPin size={16} color="var(--ink)" /></div>
                <input 
                  className="input-field" 
                  style={{ backgroundColor: 'transparent', paddingLeft: 0, flex: 1, color: stop === 'Selected on Map' ? 'var(--primary)' : 'inherit', fontWeight: stop === 'Selected on Map' ? 'bold' : 'normal' }} 
                  placeholder={`Enter Stop ${index + 1}`}
                  value={stop} 
                  onChange={e => handleStopChange(index, e.target.value)}
                />
                <button 
                  onClick={() => setSelectingMap(index)}
                  style={{ background: 'none', border: 'none', color: selectingMap === index ? 'var(--primary)' : 'var(--ink)', cursor: 'pointer', padding: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Choose on Map"
                >
                  <Map size={20} />
                </button>
                <button onClick={() => handleRemoveStop(index)} style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: 'var(--space-sm)' }}>
                  <X size={16} />
                </button>
              </div>
            ))}
            
            <button onClick={handleAddStop} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Plus size={16} /> Add Stop
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--canvas-softer)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-sm)' }}>
              <div style={{ padding: 'var(--space-sm)' }}><Navigation size={20} color="var(--ink)" /></div>
              <input 
                className="input-field" 
                style={{ backgroundColor: 'transparent', paddingLeft: 0, flex: 1, color: dropoff === 'Selected on Map' ? 'var(--primary)' : 'inherit', fontWeight: dropoff === 'Selected on Map' ? 'bold' : 'normal' }} 
                placeholder="Enter destination"
                value={dropoff} 
                onChange={e => {
                  setDropoff(e.target.value);
                  setCustomDropoffCoords(null);
                }}
              />
              <button 
                onClick={() => setSelectingMap('dropoff')}
                style={{ background: 'none', border: 'none', color: selectingMap === 'dropoff' ? 'var(--primary)' : 'var(--ink)', cursor: 'pointer', padding: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Choose on Map"
              >
                <Map size={20} />
              </button>
            </div>
          </div>
          
          <button 
            className="btn btn-large" 
            onClick={() => { if(pickup && dropoff) setShowPriceModal(true) }}
            style={{ opacity: (pickup && dropoff) ? 1 : 0.5, backgroundColor: rideType === 'emergency' ? 'var(--accent-red)' : 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
            disabled={!pickup || !dropoff}
          >
            <span>{rideType === 'parcel' ? 'See Delivery Price' : rideType === 'emergency' ? 'REQUEST EMERGENCY RIDE' : 'See Price'}</span>
            {eta && pickup && dropoff && <span style={{ position: 'absolute', right: 'var(--space-xl)', fontSize: '14px', opacity: 0.9 }}>{eta}</span>}
          </button>
        </div>
      </div>

      {showPriceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px', padding: 'var(--space-xl)', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 className="text-display-md">Confirm Request</h3>
              <button onClick={() => setShowPriceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--ink)"/></button>
            </div>
            
            <div className="flex-col gap-sm" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', backgroundColor: 'var(--canvas-softer)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Estimated Fare</span>
                <strong style={{ fontSize: '28px', color: 'var(--primary)' }}>GH₵ {estimatedPrice}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink)', fontSize: '14px', marginTop: 'var(--space-xs)' }}>
                <span>ETA</span>
                <span style={{ fontWeight: 'bold' }}>{eta}</span>
              </div>
            </div>

            <button 
              className="btn btn-large w-full" 
              onClick={() => { 
                setShowPriceModal(false);
                requestRide(pickup, dropoff, stops, rideType, customPickupCoords || gpsCoords, customDropoffCoords, customStopsCoords, estimatedPrice);
              }}
              style={{ backgroundColor: rideType === 'emergency' ? 'var(--accent-red)' : 'var(--primary)' }}
            >
              {rideType === 'parcel' ? 'Confirm Delivery' : 'Find Ride'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
