import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
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
const dropoffIcon = createPinIcon('#800020');
const stopIcon = createPinIcon('#f5a623');



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

function MapController({ overrideCenter, routeCoords }) {
  const map = useMap();
  
  useEffect(() => {
    if (overrideCenter) {
      map.flyTo(overrideCenter, 15, { duration: 0.5 });
    }
  }, [overrideCenter, map]);

  useEffect(() => {
    if (routeCoords && routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50], duration: 0.5 });
    }
  }, [routeCoords, map]);

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

const InteractiveMap = ({ pickupStr, dropoffStr, setEta, setEstimatedPrice, onLocationFound, pickupCoords, dropoffCoords, stops = EMPTY_ARRAY, stopsCoords = EMPTY_ARRAY, onMapClick, setIsGeocoding, setGeocodeError, onMapDragStart, onMapMoveEnd, overrideCenter, isActiveTrip }) => {
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
          const coords = [position.coords.latitude, position.coords.longitude];
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
          const coords = [position.coords.latitude, position.coords.longitude];
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
            if (isMounted) {
              setRouteCoords(coords);
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
        <Marker position={resolvedStart} icon={pickupIcon}>
          <Popup>Pickup: {pickupStr}</Popup>
        </Marker>
      )}

      {resolvedStops.map((stopCoords, index) => {
        if (!stopCoords) return null;
        return (
          <Marker key={index} position={stopCoords} icon={stopIcon}>
            <Popup>Stop {index + 1}: {stops[index]}</Popup>
          </Marker>
        );
      })}

      {resolvedEnd && dropoffStr && (
        <Marker position={resolvedEnd} icon={dropoffIcon}>
          <Popup>Destination: {dropoffStr}</Popup>
        </Marker>
      )}

      {routeCoords.length > 0 && (
        <Polyline 
          positions={routeCoords} 
          pathOptions={{ color: 'var(--primary)', weight: 5, opacity: 0.8 }} 
        />
      )}

      <MapResizer />
      <MapController overrideCenter={overrideCenter} routeCoords={routeCoords} />
      <MapEventsHandler onMapClick={onMapClick} onMapDragStart={onMapDragStart} onMapMoveEnd={onMapMoveEnd} />
      <RecenterButton setGpsError={setGpsError} />
    </MapContainer>
  );
};

export default InteractiveMap;

