import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons not loading in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createPinIcon = (color) => {
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px" stroke="white" stroke-width="2" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    className: '', // Clear default leaflet styles
    html: svgTemplate,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

const pickupIcon = createPinIcon('#000000'); // Ink for pickup
const dropoffIcon = createPinIcon('#800020'); // Burgundy (primary) for dropoff
const stopIcon = createPinIcon('#f5a623'); // Gold for stops

// Mock Coordinates for Campus Locations (Central University Miotso roughly)
// Centered around the actual campus GPS coordinates (5.7694, 0.0840)
export const CAMPUS_LOCATIONS = {
  "Block A": [5.77140, 0.08190],
  "Block B": [5.77115, 0.08197],
  "Block C": [5.77085, 0.08204],
  "Block E": [5.77162, 0.08257],
  "Block F": [5.77139, 0.08264],
  "Trinity Hall": [5.76986, 0.08125],
  "Boys Hostel": [5.76715, 0.08583],
  "Old Girls Hostel": [5.76904, 0.08679],
  "Pronto": [5.76831, 0.08591],
  "School Clinic": [5.76848, 0.08083],
  "School Hospital": [5.77269, 0.08369],
  "School Of Pharmacy": [5.77099, 0.08281],
  "Food Court": [5.76865, 0.08383],
  "Naa Morkor Hostel": [5.76265, 0.08579],
  "Oakview Estates": [5.76269, 0.08416],
  "Main Gate": [5.76500, 0.08000] // Mock
};

// Helper to resolve locations asynchronously (local campus dictionary or external API)
const resolveLocation = async (str, defaultLoc) => {
  if (!str) return null;
  if (str === 'Current Location' || str === 'Selected on Map') return defaultLoc;

  const normalized = str.trim().toLowerCase().replace(/\s+/g, ' ');
  for (const [key, coords] of Object.entries(CAMPUS_LOCATIONS)) {
    if (key.toLowerCase().replace(/\s+/g, ' ') === normalized) {
      return coords;
    }
  }

  // If not found in campus locations, use Photon Geocoding API
  try {
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(str + " Ghana")}&limit=1`);
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

// Haversine formula to calculate distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Component to listen for map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

// Component to dynamically recenter the map
function MapUpdater({ center, routeCoords, endCoords }) {
  const map = useMap();
  useEffect(() => {
    if (routeCoords && routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center && endCoords) {
      const bounds = L.latLngBounds([center, endCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, routeCoords, endCoords, map]);
  return null;
}

const EMPTY_ARRAY = [];

const InteractiveMap = ({ pickupStr, dropoffStr, setEta, setEstimatedPrice, onLocationFound, pickupCoords, dropoffCoords, stops = EMPTY_ARRAY, stopsCoords = EMPTY_ARRAY, onMapClick }) => {
  const [currentLocation, setCurrentLocation] = useState([5.7694, 0.0840]); // Default to CU Miotso
  const [routeCoords, setRouteCoords] = useState([]);
  const [resolvedStart, setResolvedStart] = useState(pickupCoords || [5.7694, 0.0840]);
  const [resolvedEnd, setResolvedEnd] = useState(dropoffCoords || null);
  const [resolvedStops, setResolvedStops] = useState([]);
  
  // Get real GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(coords);
          if (pickupStr === 'Current Location' || pickupStr === 'Selected on Map') {
             setResolvedStart(coords);
          }
          if (onLocationFound) onLocationFound(coords);
        },
        (error) => {
          console.warn("Geolocation denied or failed, using default location.");
        }
      );
    }
  }, [pickupStr]);

  // Calculate Route using OSRM when pickup or dropoff changes
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
        }
        return;
      }

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

      if (isMounted) {
        setResolvedStart(start);
        setResolvedEnd(end);
        setResolvedStops(resolvedStopsArray);
      }

      if (start && end) {
        // Calculate dynamic price based on distance from campus
        const campusCenter = [5.7694, 0.0840];
        let maxDist = 0;
        const allPoints = [start, end, ...resolvedStopsArray];
        allPoints.forEach(point => {
           const dist = calculateDistance(campusCenter[0], campusCenter[1], point[0], point[1]);
           if (dist > maxDist) maxDist = dist;
        });
        
        let calculatedPrice = 10;
        if (maxDist > 0.8) {
           calculatedPrice = 15 + Math.ceil(maxDist - 0.8) * 10;
        }
        if (resolvedStopsArray.length > 0) {
           calculatedPrice += (resolvedStopsArray.length * 5); // 5 cedis per stop
        }

        if (isMounted && setEstimatedPrice) {
           setEstimatedPrice(calculatedPrice);
        }

        // Build waypoint string for OSRM: lon,lat;lon,lat;...
        const waypoints = [start, ...resolvedStopsArray, end]
          .map(coord => `${coord[1]},${coord[0]}`)
          .join(';');

        // Free OSRM Routing API
        const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;
        
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            // OSRM returns [lon, lat], Leaflet wants [lat, lon]
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
  }, [pickupStr, dropoffStr, currentLocation, setEta, stops, pickupCoords, dropoffCoords, stopsCoords]);

  return (
    <MapContainer 
      center={resolvedStart || currentLocation} 
      zoom={15} 
      style={{ width: '100%', height: '100%', zIndex: 0 }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {/* Pickup Marker */}
      {resolvedStart && (
        <Marker position={resolvedStart} icon={pickupIcon}>
          <Popup>Pickup: {pickupStr}</Popup>
        </Marker>
      )}

      {/* Intermediate Stops Markers */}
      {resolvedStops.map((stopCoords, index) => {
        if (!stopCoords) return null;
        return (
          <Marker key={index} position={stopCoords} icon={stopIcon}>
            <Popup>Stop {index + 1}: {stops[index]}</Popup>
          </Marker>
        );
      })}

      {/* Dropoff Marker */}
      {resolvedEnd && dropoffStr && (
        <Marker position={resolvedEnd} icon={dropoffIcon}>
          <Popup>Destination: {dropoffStr}</Popup>
        </Marker>
      )}

      {/* Route Line */}
      {routeCoords.length > 0 && (
        <Polyline 
          positions={routeCoords} 
          pathOptions={{ color: 'var(--primary)', weight: 5, opacity: 0.8 }} 
        />
      )}

      <MapUpdater center={resolvedStart} routeCoords={routeCoords} endCoords={resolvedEnd} />
      <MapClickHandler onMapClick={onMapClick} />
    </MapContainer>
  );
};

export default InteractiveMap;
