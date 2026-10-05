import React, { useState } from 'react';
import { useMockData } from '../../context/MockDataContext';
import { MapPin, Navigation as NavigationIcon, ShieldAlert, Plus, X, Car, Package, Star, LocateFixed, Map as MapIcon } from 'lucide-react';
import InteractiveMap from '../../components/InteractiveMap';
import { CAMPUS_CENTER, CAMPUS_PLACES, calculateDistance } from '../../constants/campus';

const StudentHome = () => {
  const { activeRide, requestRide, triggerSOS, confirmPayment, submitStudentRating, cancelRide } = useMockData();
  
  const [pickup, setPickup] = useState('Current Location');
  const [dropoff, setDropoff] = useState('');
  const [stops, setStops] = useState([]);
  const [rideType, setRideType] = useState('ride');
  const [rating, setRating] = useState(5);
  const [eta, setEta] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(10);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [customPickupCoords, setCustomPickupCoords] = useState(null);
  const [customDropoffCoords, setCustomDropoffCoords] = useState(null);
  const [customStopsCoords, setCustomStopsCoords] = useState([]);
  const [selectingMap, setSelectingMap] = useState(null);
  
  // New states for loading skeleton and inline errors during geocoding
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [gpsWarning, setGpsWarning] = useState(false);
  
  React.useEffect(() => {
    if (import.meta.env.DEV && CAMPUS_CENTER[0] === 0 && CAMPUS_CENTER[1] === 0) {
      console.warn("DEV WARNING: CAMPUS_CENTER is [0, 0]. Please set it in src/constants/campus.js.");
    }
  }, []);
  
  // Search Autocomplete states
  const [activeSearch, setActiveSearch] = useState(null); // 'pickup' | 'dropoff' | number
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = React.useRef(null);

  // Pick Mode states
  const [pickMode, setPickMode] = useState(null); // 'pickup' | 'dropoff'
  const [isMapDragging, setIsMapDragging] = useState(false);
  const pickModeCenterRef = React.useRef(null);
  const [finalPickCoords, setFinalPickCoords] = useState(null);
  const [pickModeLocationName, setPickModeLocationName] = useState('');
  const [pickModeGeocoding, setPickModeGeocoding] = useState(false);
  const [forceCenter, setForceCenter] = useState(null);
  const geocodeTimeoutRef = React.useRef(null);

  const sheetRef = React.useRef(null);
  const [sheetHeight, setSheetHeight] = useState(0);

  React.useEffect(() => {
    if (!sheetRef.current) return;
    const observer = new ResizeObserver(() => {
      if (sheetRef.current) {
        setSheetHeight(sheetRef.current.offsetHeight);
      }
    });
    observer.observe(sheetRef.current);
    return () => observer.disconnect();
  });

  const handleMapClick = (coords) => {
    if (typeof selectingMap === 'number') {
      const newStops = [...stops];
      newStops[selectingMap] = 'Selected on Map';
      setStops(newStops);
      
      const newStopsCoords = [...customStopsCoords];
      newStopsCoords[selectingMap] = coords;
      setCustomStopsCoords(newStopsCoords);
      setSelectingMap(null);
    }
  };

  const enterPickMode = (mode) => {
    setPickMode(mode);
    if (mode === 'pickup') {
      setForceCenter(gpsCoords || [5.7694, 0.0840]); // CAMPUS_CENTER
    } else {
      setForceCenter(customPickupCoords || gpsCoords || [5.7694, 0.0840]);
    }
    setTimeout(() => setForceCenter(null), 100);
  };

  const handleMapMoveEnd = (coords) => {
    setIsMapDragging(false);
    if (!pickMode) return;
    
    pickModeCenterRef.current = coords;
    setPickModeGeocoding(true);
    setPickModeLocationName('');
    
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    
    geocodeTimeoutRef.current = setTimeout(async () => {
      setFinalPickCoords(coords);
      let nearestPlace = null;
      let minDistance = Infinity;
      for (const place of CAMPUS_PLACES) {
        const dist = calculateDistance(coords[0], coords[1], place.lat, place.lng); // in km
        if (dist < minDistance) {
          minDistance = dist;
          nearestPlace = place;
        }
      }

      if (nearestPlace && minDistance <= 0.08) {
         setPickModeLocationName(nearestPlace.name);
         setPickModeGeocoding(false);
      } else {
        try {
          const response = await fetch(`https://photon.komoot.io/reverse?lon=${coords[1]}&lat=${coords[0]}`);
          const data = await response.json();
          if (import.meta.env.DEV) console.log("Photon Reverse:", data);
          if (data.features && data.features.length > 0) {
            setPickModeLocationName(data.features[0].properties.name || data.features[0].properties.street || "Unnamed road");
          } else {
            setPickModeLocationName(nearestPlace ? `Near ${nearestPlace.name}` : "Pinned location");
          }
        } catch (err) {
          setPickModeLocationName(nearestPlace ? `Near ${nearestPlace.name}` : "Pinned location");
        } finally {
          setPickModeGeocoding(false);
        }
      }
    }, 400);
  };

  const handleSearch = (query, type) => {
    if (type === 'pickup') setPickup(query);
    else if (type === 'dropoff') setDropoff(query);
    else {
      const newStops = [...stops];
      newStops[type] = query;
      setStops(newStops);
    }
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(async () => {
      let results = [];
      const normalized = query.trim().toLowerCase();
      
      CAMPUS_PLACES.forEach(place => {
        if (place.name.toLowerCase().includes(normalized)) {
          results.push({ name: place.name, coords: [place.lat, place.lng], isCampus: true });
        }
      });
      
      try {
        const bbox = `${CAMPUS_CENTER[1]-0.05},${CAMPUS_CENTER[0]-0.05},${CAMPUS_CENTER[1]+0.05},${CAMPUS_CENTER[0]+0.05}`;
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${CAMPUS_CENTER[0]}&lon=${CAMPUS_CENTER[1]}&bbox=${bbox}&lang=en&limit=5`);
        const data = await response.json();
        if (import.meta.env.DEV) console.log("Photon Search:", data);
        
        if (data.features) {
          data.features.forEach(f => {
            const name = f.properties.name || f.properties.street;
            if (name && !results.some(r => r.name === name)) {
               results.push({ name, coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]], isCampus: false });
            }
          });
        }
      } catch(err) {
        console.error(err);
      }
      
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
  };

  const handleSelectResult = (result, type) => {
    if (type === 'pickup') {
      setPickup(result.name);
      setCustomPickupCoords(result.coords);
    } else if (type === 'dropoff') {
      setDropoff(result.name);
      setCustomDropoffCoords(result.coords);
    } else {
      const newStops = [...stops];
      newStops[type] = result.name;
      setStops(newStops);
      
      const newStopsCoords = [...customStopsCoords];
      newStopsCoords[type] = result.coords;
      setCustomStopsCoords(newStopsCoords);
    }
    setActiveSearch(null);
    setSearchResults([]);
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

  // FLOW 1 & 2: PAYMENT & RATING MODALS (Full screen)
  if (activeRide && (activeRide.status === 'payment_pending' || activeRide.status === 'driver_rating' || activeRide.status === 'student_rating')) {
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

  // FLOW 3: ACTIVE MAP TRACKING (Full screen map + Bottom Sheet)
  if (activeRide) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `${sheetHeight}px`, zIndex: 0 }}>
           <InteractiveMap 
             pickupStr={activeRide.pickup} 
             dropoffStr={activeRide.dropoff} 
             pickupCoords={activeRide.pickupCoords} 
             dropoffCoords={activeRide.dropoffCoords} 
             stops={activeRide.stops || []}
           />
        </div>
        
        <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius-pill)', fontSize: '14px', zIndex: 10, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          Tracking {activeRide.type === 'parcel' ? 'Parcel' : 'Ride'}...
        </div>

        <div ref={sheetRef} style={{ 
          position: 'absolute', 
          bottom: 'var(--nav-height)', left: 0, right: 0, 
          backgroundColor: 'white', 
          borderRadius: '16px 16px 0 0', 
          boxShadow: '0 -4px 16px rgba(0,0,0,0.16)', 
          padding: '16px', 
          maxHeight: '60dvh', 
          overflowY: 'auto', 
          zIndex: 10 
        }}>
          <h2 className="text-display-md mb-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 'var(--space-sm)' }}>
            {activeRide.type === 'parcel' ? 'Parcel Delivery ' : 'Ride '} 
            {activeRide.status === 'requested' ? 'Requested' : activeRide.status === 'in_progress' ? 'In Progress' : activeRide.status === 'arrived' ? 'Arrived' : 'Accepted'}
          </h2>
          
          <div className="flex-col gap-md" style={{ marginTop: 'var(--space-md)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ color: 'var(--body)', fontSize: '14px' }}>Status</span>
               <strong style={{ letterSpacing: '1px' }}>{activeRide.status.replace('_', ' ').toUpperCase()}</strong>
             </div>

             {activeRide.driverName && (
               <>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--body)', fontSize: '14px' }}>{activeRide.driverType === 'motor' ? 'Rider' : 'Driver'}</span>
                   <strong>{activeRide.driverName}</strong>
                 </div>
                 {(activeRide.driverCar || activeRide.driverPlate) && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xs)' }}>
                     <span style={{ color: 'var(--body)', fontSize: '14px' }}>Vehicle</span>
                     <div style={{ textAlign: 'right' }}>
                       {activeRide.driverCar && <strong style={{ display: 'block', fontSize: '14px' }}>{activeRide.driverCar}</strong>}
                       {activeRide.driverPlate && <span style={{ display: 'inline-block', backgroundColor: 'var(--canvas-soft)', color: 'var(--ink)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{activeRide.driverPlate}</span>}
                     </div>
                   </div>
                 )}
               </>
             )}

             {activeRide.status === 'accepted' && (
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--body)', fontSize: '14px' }}>ETA</span>
                 <strong>4 mins</strong>
               </div>
             )}

             {activeRide.status === 'arrived' && (
               <div style={{ padding: 'var(--space-sm) 0', textAlign: 'center', backgroundColor: 'var(--status-in-progress)', color: 'white', borderRadius: 'var(--radius-md)' }}>
                 <strong>{activeRide.driverType === 'motor' ? 'Rider' : 'Driver'} is outside!</strong>
               </div>
             )}

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--canvas-soft)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
               <span style={{ color: 'var(--body)', fontSize: '14px' }}>OTP Code</span>
               <strong style={{ fontSize: '24px', letterSpacing: '6px' }}>{activeRide.otp || '1234'}</strong>
             </div>
             
             {activeRide.stops && activeRide.stops.length > 0 && (
               <div style={{ marginTop: 'var(--space-xs)' }}>
                 <span style={{ color: 'var(--body)', fontSize: '14px' }}>Stops</span>
                 {activeRide.stops.map((stop, idx) => (
                   <p key={idx} style={{ fontSize: '14px', margin: '4px 0 0 0' }}>• {stop}</p>
                 ))}
               </div>
             )}
          </div>

          {(activeRide.status === 'in_progress' || activeRide.status === 'accepted' || activeRide.status === 'arrived') && (
            <button 
              className="btn btn-large w-full" 
              style={{ backgroundColor: 'var(--ink)', color: 'white', marginTop: 'var(--space-md)', borderRadius: 'var(--radius-pill)' }} 
              onClick={openGoogleMaps}
            >
              <Map size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }}/>
              Open in Google Maps
            </button>
          )}

          <button className="btn btn-large w-full" style={{ backgroundColor: 'var(--status-sos)', color: 'white', marginTop: 'var(--space-md)', borderRadius: 'var(--radius-pill)' }} onClick={triggerSOS}>
            <ShieldAlert size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            SOS Emergency
          </button>
          
          {(activeRide.status === 'requested' || activeRide.status === 'accepted') && (
            <button 
              className="btn btn-large w-full" 
              style={{ backgroundColor: 'transparent', color: 'var(--ink)', border: '1px solid var(--surface-pressed)', marginTop: 'var(--space-md)', borderRadius: 'var(--radius-pill)' }} 
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
    );
  }

  // FLOW 4: INITIAL SEARCH & REQUEST FORM
  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      {pickMode && <style>{`.bottom-nav { display: none !important; }`}</style>}
      
      {/* Map fills the screen behind everything */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `${sheetHeight}px`, zIndex: 0 }}>
         <InteractiveMap 
           pickupStr={pickup} 
           dropoffStr={dropoff} 
           pickupCoords={customPickupCoords}
           dropoffCoords={customDropoffCoords}
           setEta={setEta} 
           setEstimatedPrice={setEstimatedPrice}
           onLocationFound={(coords, accuracy, err) => {
              if (err) {
                 setGpsCoords(CAMPUS_CENTER);
              } else if (coords) {
                 setGpsCoords(coords);
                 if (CAMPUS_CENTER && CAMPUS_CENTER[0] !== 0 && (accuracy > 100 || calculateDistance(coords[0], coords[1], CAMPUS_CENTER[0], CAMPUS_CENTER[1]) > 5)) {
                    setGpsWarning(true);
                 } else {
                    setGpsWarning(false);
                 }
              }
           }}
           stops={stops}
           stopsCoords={customStopsCoords}
           onMapClick={handleMapClick}
           onMapDragStart={() => setIsMapDragging(true)}
           onMapMoveEnd={handleMapMoveEnd}
           overrideCenter={forceCenter}
           setIsGeocoding={setIsGeocoding}
           setGeocodeError={setGeocodeError}
         />
         
         {pickMode && (
           <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, calc(-50% - ${isMapDragging ? '8px' : '0px'}))`, zIndex: 10, transition: 'transform 0.2s', pointerEvents: 'none' }}>
              <MapPin size={48} fill="var(--ink)" color="white" />
              <div style={{ width: '8px', height: '4px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '50%', position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', opacity: isMapDragging ? 0.3 : 0.8 }} />
           </div>
         )}
         
         {selectingMap !== null && typeof selectingMap === 'number' && (
           <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--ink)', color: 'white', padding: '12px 24px', borderRadius: '24px', fontSize: '14px', fontWeight: 'bold', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
             <MapIcon size={16} /> Tap on the map to set Stop {selectingMap + 1}
           </div>
         )}
      </div>
      
      {pickMode ? (
        <div ref={sheetRef} style={{ 
          position: 'absolute', bottom: 'var(--nav-height)', left: 0, right: 0, 
          backgroundColor: 'white', borderRadius: '16px 16px 0 0', 
          boxShadow: '0 -4px 16px rgba(0,0,0,0.16)', padding: '20px 20px 40px 20px', zIndex: 10,
          pointerEvents: 'none'
        }}>
          <div style={{ marginBottom: '16px', minHeight: '24px', pointerEvents: 'auto' }}>
            {pickModeGeocoding ? (
               <div style={{ width: '60%', height: '24px', backgroundColor: 'var(--surface-pressed)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            ) : (
               <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{pickModeLocationName || 'Pinned location'}</h3>
            )}
          </div>
          <button 
            onClick={() => {
              if (pickMode === 'pickup') {
                setPickup(pickModeLocationName || 'Pinned location');
                setCustomPickupCoords(finalPickCoords || pickModeCenterRef.current);
              } else {
                setDropoff(pickModeLocationName || 'Pinned location');
                setCustomDropoffCoords(finalPickCoords || pickModeCenterRef.current);
              }
              setPickMode(null);
            }}
            style={{ width: '100%', height: '52px', backgroundColor: 'var(--ink)', color: 'white', borderRadius: '999px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', pointerEvents: 'auto' }}
          >
            Confirm {pickMode}
          </button>
          <button 
            onClick={() => setPickMode(null)}
            style={{ width: '100%', height: '44px', backgroundColor: 'transparent', color: 'var(--ink)', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px', pointerEvents: 'auto' }}
          >
            Cancel
          </button>
        </div>
      ) : (
      <>
      {/* Bottom Sheet Request Card */}
      <div ref={sheetRef} style={{ 
        position: 'absolute', 
        bottom: 'var(--nav-height)', left: 0, right: 0, 
        backgroundColor: 'white', 
        borderRadius: '16px 16px 0 0', 
        boxShadow: '0 -4px 16px rgba(0,0,0,0.16)', 
        padding: '16px 16px 80px 16px', // nav height + 16px
        maxHeight: '60dvh', 
        overflowY: 'auto', 
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        {/* Mode Tabs (Ride / Parcel / Emergency) */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', pointerEvents: 'auto' }}>
          <button 
            onClick={() => setRideType('ride')}
            style={{ 
              flex: 1, minHeight: '44px', borderRadius: 'var(--radius-pill)', 
              backgroundColor: rideType === 'ride' ? 'var(--ink)' : 'transparent', 
              color: rideType === 'ride' ? 'var(--on-dark)' : 'var(--ink)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
              border: 'none', cursor: 'pointer' 
            }}
          >
            <Car size={16} /> Ride
          </button>
          <button 
            onClick={() => setRideType('parcel')}
            style={{ 
              flex: 1, minHeight: '44px', borderRadius: 'var(--radius-pill)', 
              backgroundColor: rideType === 'parcel' ? 'var(--ink)' : 'transparent', 
              color: rideType === 'parcel' ? 'var(--on-dark)' : 'var(--ink)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
              border: 'none', cursor: 'pointer' 
            }}
          >
            <Package size={16} /> Parcel
          </button>
          <button 
            onClick={() => { setRideType('emergency'); setDropoff('School Clinic'); }}
            style={{ 
              flex: 1, minHeight: '44px', borderRadius: 'var(--radius-pill)', 
              backgroundColor: rideType === 'emergency' ? 'var(--status-sos)' : 'transparent', 
              color: rideType === 'emergency' ? 'var(--on-dark)' : 'var(--ink)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
              border: 'none', cursor: 'pointer' 
            }}
          >
            <ShieldAlert size={16} /> Emergency
          </button>
        </div>

        <h2 className="text-display-md" style={{ marginBottom: '16px', pointerEvents: 'auto' }}>
          {rideType === 'parcel' ? 'Where to deliver?' : rideType === 'emergency' ? 'Emergency Destination' : 'Where to?'}
        </h2>
        
        {!pickMode && gpsWarning && (
          <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: 'var(--status-sos)', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
            <ShieldAlert size={20} />
            <span style={{flex: 1}}>Your location looks off. Pick your pickup on the map.</span>
            <button onClick={() => { setPickup('Campus Center'); setCustomPickupCoords(CAMPUS_CENTER); setGpsWarning(false); }} style={{ background: 'transparent', border: '1px solid var(--status-sos)', color: 'var(--status-sos)', borderRadius: 'var(--radius-pill)', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Use campus center</button>
            <button onClick={() => setGpsWarning(false)} style={{ background: 'none', border: 'none', color: 'var(--status-sos)', cursor: 'pointer', padding: 0 }}><X size={16} /></button>
          </div>
        )}
        
        {/* Request Form Grouped Card */}
        <div style={{ backgroundColor: 'var(--canvas-soft)', borderRadius: '8px', padding: '12px', pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px', marginRight: '8px' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ink)' }}></div>
               <div style={{ width: '2px', height: '36px', backgroundColor: 'var(--ink)', opacity: 0.2, margin: '4px 0' }}></div>
               <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--ink)' }}></div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
               <div style={{ display: 'flex', alignItems: 'center', minHeight: '44px' }}>
                 <div style={{ flex: 1, position: 'relative' }}>
                   <input className="input-field" style={{ width: '100%', backgroundColor: 'transparent', border: 'none', padding: '0', outline: 'none' }} placeholder="Enter pickup" value={pickup} onFocus={() => { setActiveSearch('pickup'); handleSearch(pickup, 'pickup'); }} onBlur={() => setTimeout(() => setActiveSearch(null), 200)} onChange={e => { setCustomPickupCoords(null); setActiveSearch('pickup'); handleSearch(e.target.value, 'pickup'); }} />
                   {activeSearch === 'pickup' && searchResults.length > 0 && (
                     <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                       {searchResults.map((res, i) => (
                         <div key={i} onMouseDown={() => handleSelectResult(res, 'pickup')} style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '14px' }}>
                           <div style={{ fontWeight: 'bold' }}>{res.name}</div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
                 {isGeocoding && <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--surface-pressed)', borderTopColor: 'var(--ink)', animation: 'spin 1s linear infinite', marginRight: '8px' }}></div>}
                 <button onClick={() => enterPickMode('pickup')} aria-label="Choose on map" style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}><MapPin size={20} color="var(--ink)" /></button>
               </div>
               <div style={{ height: '1px', backgroundColor: 'var(--ink)', opacity: 0.1, margin: '4px 0' }} />
               <div style={{ display: 'flex', alignItems: 'center', minHeight: '44px' }}>
                 <div style={{ flex: 1, position: 'relative' }}>
                   <input className="input-field" style={{ width: '100%', backgroundColor: 'transparent', border: 'none', padding: '0', outline: 'none' }} placeholder="Enter destination" value={dropoff} onFocus={() => { setActiveSearch('dropoff'); handleSearch(dropoff, 'dropoff'); }} onBlur={() => setTimeout(() => setActiveSearch(null), 200)} onChange={e => { setCustomDropoffCoords(null); setActiveSearch('dropoff'); handleSearch(e.target.value, 'dropoff'); }} />
                   {activeSearch === 'dropoff' && searchResults.length > 0 && (
                     <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                       {searchResults.map((res, i) => (
                         <div key={i} onMouseDown={() => handleSelectResult(res, 'dropoff')} style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '14px' }}>
                           <div style={{ fontWeight: 'bold' }}>{res.name}</div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
                 {isGeocoding && <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--surface-pressed)', borderTopColor: 'var(--ink)', animation: 'spin 1s linear infinite', marginRight: '8px' }}></div>}
                 <button onClick={() => enterPickMode('dropoff')} aria-label="Choose on map" style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}><MapPin size={20} color="var(--ink)" /></button>
               </div>
            </div>
          </div>
          
          {stops.map((stop, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
               <div style={{ width: '24px', marginRight: '8px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--ink)', opacity: 0.5 }}></div>
               </div>
               <input className="input-field" style={{ flex: 1, backgroundColor: 'transparent', border: 'none', padding: '0', outline: 'none', minHeight: '44px' }} placeholder={`Enter Stop ${index + 1}`} value={stop} onChange={e => handleStopChange(index, e.target.value)} />
               <button onClick={() => handleRemoveStop(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }} aria-label="Remove stop"><X size={16} /></button>
            </div>
          ))}
        </div>
        
        {/* Add Stop Link */}
        <button onClick={handleAddStop} style={{ background: 'none', border: 'none', color: 'var(--ink)', fontSize: '14px', textDecoration: 'underline', cursor: 'pointer', marginTop: '12px', padding: 0, pointerEvents: 'auto' }}>
           Add stop
        </button>

        {/* Quick Destination Chips */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginTop: '16px', WebkitOverflowScrolling: 'touch', pointerEvents: 'auto' }}>
          <button 
            onClick={() => enterPickMode('dropoff')} 
            style={{ 
              whiteSpace: 'nowrap', backgroundColor: 'var(--canvas-soft)', border: 'none', 
              borderRadius: 'var(--radius-pill)', padding: '8px 16px', fontSize: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <MapPin size={14} /> Choose on map
          </button>
          {CAMPUS_PLACES.slice(0, 4).map(place => (
            <button 
              key={place.id} 
              onClick={() => { setDropoff(place.name); setCustomDropoffCoords([place.lat, place.lng]); }} 
              style={{ 
                whiteSpace: 'nowrap', backgroundColor: 'var(--canvas-soft)', border: 'none', 
                borderRadius: 'var(--radius-pill)', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' 
              }}
            >
              {place.name}
            </button>
          ))}
        </div>
        
        {/* Inline Error */}
        {geocodeError && (
          <p style={{ color: 'var(--status-sos)', fontSize: '14px', marginTop: '8px' }}>{geocodeError}</p>
        )}

        {/* See Price Button */}
        <div style={{ marginTop: '16px', pointerEvents: 'auto' }}>
          <button 
            disabled={!pickup || !dropoff}
            onClick={() => setShowPriceModal(true)}
            style={{ 
              width: '100%', 
              minHeight: '52px', 
              borderRadius: 'var(--radius-pill)', 
              backgroundColor: (pickup && dropoff) ? 'var(--ink)' : '#afafaf',
              color: (pickup && dropoff) ? 'var(--on-dark)' : '#000000',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: (pickup && dropoff) ? 'pointer' : 'not-allowed'
            }}
          >
            {(pickup && dropoff) ? 'See price' : 'Enter a destination to continue'}
          </button>
        </div>
      </div>
      </>
      )}

      {/* CONFIRMATION FARE MODAL POPUP */}
      {showPriceModal && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPriceModal(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowPriceModal(false);
            } else if (e.key === 'Tab') {
              const focusableElements = e.currentTarget.querySelectorAll('button');
              const firstElement = focusableElements[0];
              const lastElement = focusableElements[focusableElements.length - 1];
              
              if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                  lastElement.focus();
                  e.preventDefault();
                }
              } else {
                if (document.activeElement === lastElement) {
                  firstElement.focus();
                  e.preventDefault();
                }
              }
            }
          }}
        >
          <div 
            style={{ 
              backgroundColor: 'white',
              width: 'calc(100% - 48px)', 
              maxWidth: '340px', 
              margin: '0 auto', 
              borderRadius: '16px', 
              padding: '20px', 
              animation: 'slideUp 0.3s ease-out',
              outline: 'none'
            }}
            tabIndex="-1"
            autoFocus
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, textTransform: 'none' }}>Confirm request</h3>
              <button 
                onClick={() => setShowPriceModal(false)} 
                aria-label="Close"
                style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={24} color="var(--ink)"/>
              </button>
            </div>
            
            <div style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--ink)' }}>
              {pickup} &rarr; {dropoff} <span style={{ opacity: 0.6 }}>(~2.4 km)</span>
            </div>
            
            <div className="flex-col gap-sm" style={{ marginBottom: '20px', padding: '14px', backgroundColor: 'var(--canvas-soft)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Fare amount</span>
                <strong style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ink)' }}>GH₵ {estimatedPrice}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink)', fontSize: '14px', marginTop: '8px' }}>
                <span>ETA</span>
                <span style={{ fontWeight: 'bold' }}>{eta || '4 mins'}</span>
              </div>
            </div>

            <button 
              className="btn w-full" 
              onClick={() => { 
                setShowPriceModal(false);
                requestRide(pickup, dropoff, stops, rideType, customPickupCoords || gpsCoords, customDropoffCoords, customStopsCoords, estimatedPrice);
              }}
              style={{ backgroundColor: 'var(--ink)', borderRadius: '999px', color: 'white', height: '52px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              Find ride
            </button>
            <button 
              onClick={() => setShowPriceModal(false)}
              style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: 'var(--ink)', marginTop: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', height: '44px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
