export const CAMPUS_CENTER = [5.7694, 0.0840];
export const SHOW_LOCATION_WARNING = false;

export const CAMPUS_PLACES = [
  { id: 'library', name: 'Library', lat: 0.0, lng: 0.0 },
  { id: 'main-gate', name: 'Main gate', lat: 0.0, lng: 0.0 },
  { id: 'clinic', name: 'Clinic', lat: 0.0, lng: 0.0 },
  { id: 'cafeteria', name: 'Cafeteria', lat: 0.0, lng: 0.0 },
  { id: 'block-a', name: 'Block A', lat: 5.77140, lng: 0.08190 },
  { id: 'block-b', name: 'Block B', lat: 5.77115, lng: 0.08197 },
  { id: 'block-c', name: 'Block C', lat: 5.77085, lng: 0.08204 },
  { id: 'block-e', name: 'Block E', lat: 5.77162, lng: 0.08257 },
  { id: 'block-f', name: 'Block F', lat: 5.77139, lng: 0.08264 },
  { id: 'trinity-hall', name: 'Trinity Hall', lat: 5.76986, lng: 0.08125 },
  { id: 'boys-hostel', name: 'Boys Hostel', lat: 5.76715, lng: 0.08583 },
  { id: 'old-girls-hostel', name: 'Old Girls Hostel', lat: 5.76904, lng: 0.08679 },
  { id: 'pronto', name: 'Pronto', lat: 5.76831, lng: 0.08591 },
  { id: 'school-hospital', name: 'School Hospital', lat: 5.77269, lng: 0.08369 },
  { id: 'school-of-pharmacy', name: 'School Of Pharmacy', lat: 5.77099, lng: 0.08281 },
  { id: 'food-court', name: 'Food Court', lat: 5.76865, lng: 0.08383 },
  { id: 'naa-morkor-hostel', name: 'Naa Morkor Hostel', lat: 5.76265, lng: 0.08579 },
  { id: 'oakview-estates', name: 'Oakview Estates', lat: 5.76269, lng: 0.08416 }
];

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};
