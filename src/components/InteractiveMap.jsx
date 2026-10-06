import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed, Loader2 } from 'lucide-react';
import { CAMPUS_CENTER, CAMPUS_PLACES, calculateDistance } from '../constants/campus';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createPinIcon = (color) => {
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px" stroke="white" stroke-width="2" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    className: '',
    html: svgTemplate,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

const pickupIcon = createPinIcon('#000000');

const createSquareIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width: 16px; height: 16px; background-color: ${color}; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8]
});
const dropoffIcon = createSquareIcon('#000000');
const stopIcon = createSquareIcon('#f5a623');

const createDotRingIcon = (outer, inner) => L.divIcon({
  className: '',
  html: `<div style="width: 20px; height: 20px; background-color: ${inner}; border: 5px solid ${outer}; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});
const driverIcon = createDotRingIcon('#000000', '#ffffff'); // black dot with white ring
const studentIcon = createDotRingIcon('#ffffff', '#000000'); // black ring with white center
const studentOldIcon = createDotRingIcon('#aaaaaa', '#ffffff'); // grayed out

const carIcon = L.divIcon({
  className: '',
  html: `<div style="width: 24px; height: 24px; background-color: #000000; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0m-6 0a2 2 0 1 1-4 0"/></svg></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const getIconForKind = (kind) => {
  if (kind === 'self') return driverIcon;
  if (kind === 'driver') return carIcon;
  if (kind === 'destination') return dropoffIcon;
  return pickupIcon;
};



const resolveLocation = async (str, defaultLoc) => {
  if (!str) return null;
  if (str === 'Current Location' || str === 'Selected on Map') return defaultLoc;

  const normalized = str.trim().toLowerCase().replace(/\s+/g, ' ');
  for (const place of CAMPUS_PLACES) {
    if (place.name.toLowerCase().replace(/\s+/g, ' ') === normalized) return [place.lat, place.lng];
  }

  try {
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(str)}&lat=${CAMPUS_CENTER[0]}&lon=${CAMPUS_CENTER[1]}&limit=1`);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].geometry.coordinates;
      return [lat, lon];
    }
  } catch (err) {
    console.error("Geocoding failed for", str, err);
  }
  return null;
};


function MapEventsHandler({ onMapClick, onMapDragStart, onMapMoveEnd }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    },
    dragstart: () => {
      if (onMapDragStart) onMapDragStart();
    },
    moveend: (e) => {
      const center = e.target.getCenter();
      if (onMapMoveEnd) onMapMoveEnd([center.lat, center.lng]);
    }
  });
  return null;
}

function MapController({ overrideCenter, routeCoords, bottomPadding = 0 }) {
  const map = useMap();
  
  useEffect(() => {
    if (overrideCenter) {
      map.flyTo(overrideCenter, 15, { duration: 0.5 });
    }
  }, [overrideCenter, map]);

  useEffect(() => {
    if (routeCoords && routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { paddingTopLeft: [50, 50], paddingBottomRight: [50, bottomPadding + 50], maxZoom: 17, duration: 0.5 });
    }
  }, [routeCoords, map, bottomPadding]);

  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function RecenterButton({ setGpsError }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRecenter = () => {
    setLoading(true);
    setErrorMsg('');
    if (setGpsError) setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 0.5 });
      },
      (err) => {
        setLoading(false);
        setErrorMsg('Denied');
        if (setGpsError) setGpsError('Denied');
        map.flyTo(CAMPUS_CENTER, 15, { duration: 0.5 });
        setTimeout(() => setErrorMsg(''), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <button 
      aria-label="Recenter on me"
      onClick={handleRecenter}
      style={{ position: 'absolute', top: '16px', left: '16px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 1000, border: 'none', cursor: 'pointer', color: 'var(--ink)', padding: errorMsg ? '8px 12px' : '12px' }}
    >
       {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : (errorMsg ? <span style={{fontSize:'12px', fontWeight:'bold'}}>{errorMsg}</span> : <LocateFixed size={20} />)}
    </button>
  )
}

const EMPTY_ARRAY = [];

const InteractiveMap = ({ pickupStr, dropoffStr, setEta, setEstimatedPrice, onLocationFound, pickupCoords, dropoffCoords, pickupAccuracy, stops = EMPTY_ARRAY, stopsCoords = EMPTY_ARRAY, onMapClick, setIsGeocoding, setGeocodeError, onMapDragStart, onMapMoveEnd, overrideCenter, isActiveTrip, bottomPadding, useTestLocation, studentCoords, studentUpdatedAt, startMarkerLabel, startMarkerKind, endMarkerLabel, endMarkerKind, studentMarkerLabel, driverCoords, driverMarkerLabel }) => {
  const actualStartLabel = startMarkerLabel || (pickupStr === 'Current Location' ? 'You' : pickupStr);
  const actualStartKind = startMarkerKind || (pickupStr === 'Current Location' ? 'self' : 'pickup');
  const actualEndLabel = endMarkerLabel || (dropoffStr === 'Current Location' ? 'You' : dropoffStr);
  const actualEndKind = endMarkerKind || (dropoffStr === 'Current Location' ? 'self' : 'destination');

  const [currentLocation, setCurrentLocation] = useState(CAMPUS_CENTER);
  const [routeCoords, setRouteCoords] = useState([]);
  const [resolvedStart, setResolvedStart] = useState(pickupCoords || CAMPUS_CENTER);
  const [resolvedEnd, setResolvedEnd] = useState(dropoffCoords || null);
  const [resolvedStops, setResolvedStops] = useState([]);
  const [gpsError, setGpsError] = useState(null);
  
  // Run once on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = useTestLocation ? [5.7694, 0.0840] : [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(coords);
          if (pickupStr === 'Current Location' || pickupStr === 'Selected on Map') {
             setResolvedStart(coords);
          }
          if (onLocationFound) onLocationFound(coords, position.coords.accuracy, null);
        },
        (error) => {
          console.warn("Geolocation denied or failed, using default location.");
          if (onLocationFound) onLocationFound(null, null, error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      if (onLocationFound) onLocationFound(null, null, { message: "Not supported" });
    }
  }, []);

  // Watch position only if active trip
  useEffect(() => {
    if (isActiveTrip && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = useTestLocation ? [5.7694, 0.0840] : [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(coords);
          if (onLocationFound) onLocationFound(coords, position.coords.accuracy, null);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isActiveTrip]);

  useEffect(() => {
    let isMounted = true;

    const fetchRoute = async () => {
      if (!pickupStr || !dropoffStr) {
        if (isMounted) {
          setRouteCoords(EMPTY_ARRAY);
          setResolvedStart(pickupCoords || currentLocation);
          setResolvedEnd(null);
          setResolvedStops(EMPTY_ARRAY);
          if (setEta) setEta(null);
          if (setGeocodeError) setGeocodeError('');
        }
        return;
      }

      if (setIsGeocoding) setIsGeocoding(true);
      if (setGeocodeError) setGeocodeError('');

      const start = pickupCoords || await resolveLocation(pickupStr, currentLocation);
      const end = dropoffCoords || await resolveLocation(dropoffStr, currentLocation);
      
      const resolvedStopsArray = [];
      for (let i = 0; i < stops.length; i++) {
        const stopStr = stops[i];
        const customCoord = stopsCoords[i];
        if (customCoord) {
           resolvedStopsArray.push(customCoord);
        } else if (stopStr) {
           const stopCoord = await resolveLocation(stopStr, currentLocation);
           if (stopCoord) resolvedStopsArray.push(stopCoord);
        }
      }

      if (isMounted && setIsGeocoding) setIsGeocoding(false);

      if (!start || !end) {
         if (isMounted && setGeocodeError) setGeocodeError('Location not found. Please try another place.');
      }

      if (isMounted) {
        setResolvedStart(start);
        setResolvedEnd(end);
        setResolvedStops(resolvedStopsArray);
      }

      if (start && end) {
        const campusCenter = [5.7694, 0.0840];
        let maxDist = 0;
        const allPoints = [start, end, ...resolvedStopsArray];
        allPoints.forEach(point => {
           const dist = calculateDistance(campusCenter[0], campusCenter[1], point[0], point[1]);
           if (dist > maxDist) maxDist = dist;
        });
        
        let calculatedPrice = 10;
        if (maxDist > 0.8) calculatedPrice = 15 + Math.ceil(maxDist - 0.8) * 10;
        if (resolvedStopsArray.length > 0) calculatedPrice += (resolvedStopsArray.length * 5);

        // Calculate and log route pricing (will be overridden below if route is found)
        if (isMounted && setEstimatedPrice) setEstimatedPrice(calculatedPrice);

        const waypoints = [start, ...resolvedStopsArray, end]
          .map(coord => `${coord[1]},${coord[0]}`)
          .join(';');

        const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;
        
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            
            // Fare = base + perKm * km, rounded to a whole cedi, with a minimum fare.
            const distanceMeters = route.distance;
            const km = distanceMeters / 1000;
            const baseFare = 10;
            const perKm = 5;
            const minFare = 10;
            let finalPrice = Math.max(minFare, Math.round(baseFare + perKm * km));
            if (resolvedStopsArray.length > 0) finalPrice += (resolvedStopsArray.length * 5);

            if (import.meta.env.DEV) {
              console.log("distanceMeters:", distanceMeters, "km:", km, "finalPrice:", finalPrice);
              if (km > 15) {
                console.warn("Ride is far from campus");
              }
            }

            if (isMounted) {
              setRouteCoords(coords);
              if (setEstimatedPrice) setEstimatedPrice(finalPrice);
              if (setEta) {
                const minutes = Math.ceil(route.duration / 60);
                setEta(`${minutes} min`);
              }
            }
          } else {
             if (isMounted) {
               setRouteCoords(EMPTY_ARRAY);
               if (setEta) setEta(null);
             }
          }
        } catch (err) {
          console.error("Error fetching route:", err);
          if (isMounted) {
             setRouteCoords(EMPTY_ARRAY);
             if (setEta) setEta(null);
          }
        }
      }
    };

    fetchRoute();

    return () => { isMounted = false; };
  }, [pickupStr, dropoffStr, currentLocation, setEta, stops, pickupCoords, dropoffCoords, stopsCoords, setIsGeocoding, setGeocodeError, setEstimatedPrice]);

  return (
    <MapContainer 
      center={CAMPUS_CENTER} 
      zoom={15} 
      style={{ width: '100%', height: '100%', zIndex: 0 }}
      zoomControl={false}
      scrollWheelZoom={true}
      touchZoom={true}
      dragging={true}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
        maxZoom={19}
      />
      
      {resolvedStart && (
        <Marker position={resolvedStart} icon={getIconForKind(actualStartKind)}>
          <Popup closeButton={true}><span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{actualStartLabel}</span></Popup>
        </Marker>
      )}

      {resolvedStart && pickupAccuracy && pickupStr !== 'Current Location' && (
        <Circle center={resolvedStart} radius={Math.min(pickupAccuracy, 100)} pathOptions={{ color: '#cccccc', fillColor: '#cccccc', fillOpacity: 0.3, weight: 1 }} />
      )}

      {resolvedStops.map((stopCoords, index) => {
        if (!stopCoords) return null;
        return (
          <Marker key={index} position={stopCoords} icon={stopIcon}>
            <Popup closeButton={true}><span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{stops[index]}</span></Popup>
          </Marker>
        );
      })}

      {resolvedEnd && dropoffStr && (
        <Marker position={resolvedEnd} icon={getIconForKind(actualEndKind)}>
          <Popup closeButton={true}><span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{actualEndLabel}</span></Popup>
        </Marker>
      )}

      {studentCoords && (
        <Marker position={studentCoords} icon={(studentUpdatedAt && (Date.now() - studentUpdatedAt > 60000)) ? studentOldIcon : studentIcon}>
          <Popup closeButton={true}><span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{studentMarkerLabel || 'Student'} {(studentUpdatedAt && (Date.now() - studentUpdatedAt > 60000)) ? `(Location last updated ${Math.floor((Date.now() - studentUpdatedAt) / 60000)} min ago)` : ''}</span></Popup>
        </Marker>
      )}

      {driverCoords && (
        <Marker position={driverCoords} icon={getIconForKind('driver')}>
          <Popup closeButton={true}><span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{driverMarkerLabel || 'Your driver'}</span></Popup>
        </Marker>
      )}

      {routeCoords.length > 0 && (
        <Polyline 
          positions={routeCoords} 
          pathOptions={{ color: 'var(--primary)', weight: 5, opacity: 0.8 }} 
        />
      )}

      <MapResizer />
      <MapController overrideCenter={overrideCenter} routeCoords={routeCoords} bottomPadding={bottomPadding} />
      <MapEventsHandler onMapClick={onMapClick} onMapDragStart={onMapDragStart} onMapMoveEnd={onMapMoveEnd} />
      <RecenterButton setGpsError={setGpsError} />
    </MapContainer>
  );
};

export default InteractiveMap;

