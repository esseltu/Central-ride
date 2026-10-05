import React, { useState, useEffect } from 'react';
import { useMockData } from '../../context/MockDataContext';
import { History as HistoryIcon, Car, Package, ChevronDown } from 'lucide-react';
import { CAMPUS_PLACES, calculateDistance } from '../../constants/campus';

const formatLocation = (name, coords) => {
  if (name !== 'Selected on Map' && name !== 'Current Location' && name) return name;
  if (!coords || !Array.isArray(coords)) return 'Pinned location';
  
  let nearestPlace = null;
  let minDistance = Infinity;
  for (const place of CAMPUS_PLACES) {
    if (place.lat === 0 && place.lng === 0) continue;
    const dist = calculateDistance(coords[0], coords[1], place.lat, place.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestPlace = place;
    }
  }
  
  if (nearestPlace && minDistance < 1) {
    return 'Near ' + nearestPlace.name;
  }
  return 'Pinned location';
};

const formatPrice = (price) => {
  const p = Number(price);
  if (p % 1 === 0) return 'GH₵' + p;
  return 'GH₵' + p.toFixed(2);
};

const RideCard = ({ ride }) => {
  const [expanded, setExpanded] = useState(false);
  
  const pickupName = formatLocation(ride.pickup, ride.pickupCoords);
  const dropoffName = formatLocation(ride.dropoff, ride.dropoffCoords);
  
  const statusColor = ride.status === 'completed' ? 'var(--canvas-soft)' : ride.status === 'cancelled' ? 'transparent' : 'var(--ink)';
  const statusTextColor = ride.status === 'completed' ? 'var(--ink)' : ride.status === 'cancelled' ? 'var(--body)' : 'white';
  const statusBorder = ride.status === 'cancelled' ? '1px solid var(--surface-pressed)' : 'none';

  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      style={{ 
        backgroundColor: 'white', 
        border: '1px solid var(--surface-pressed)', 
        borderRadius: '16px', 
        padding: '16px', 
        display: 'flex', 
        flexDirection: 'column', 
        cursor: 'pointer' 
      }}
      aria-expanded={expanded}
    >
       <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--canvas-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
             {ride.type === 'parcel' ? <Package size={20} color="var(--ink)" /> : <Car size={20} color="var(--ink)" />}
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
             <div style={{ display: 'flex', gap: '12px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '8px', marginTop: '4px' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ink)' }}></div>
                 <div style={{ width: '2px', height: '20px', backgroundColor: 'var(--surface-pressed)', margin: '2px 0' }}></div>
                 <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--ink)' }}></div>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px', minWidth: 0 }}>
                 <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: '1' }}>
                   <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1}}>{pickupName}</span>
                   {ride.stops && ride.stops.length > 0 && (
                     <span style={{ fontSize: '12px', fontWeight: '500', backgroundColor: 'var(--canvas-soft)', padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                       {ride.stops.length} {ride.stops.length === 1 ? 'stop' : 'stops'}
                     </span>
                   )}
                 </div>
                 <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1' }}>
                   {dropoffName}
                 </div>
               </div>
             </div>
             
             <div style={{ fontSize: '14px', color: 'var(--body)', marginTop: '8px', paddingLeft: '20px' }}>
               {new Date(ride.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
             </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, paddingLeft: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--ink)' }}>{formatPrice(ride.price)}</span>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '500', 
                backgroundColor: statusColor, 
                color: statusTextColor,
                border: statusBorder,
                padding: '4px 8px', 
                borderRadius: '999px',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap'
              }}>
                {ride.status}
              </span>
            </div>
            <ChevronDown size={16} color="var(--body)" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginTop: '12px' }} />
          </div>
       </div>
       
       {expanded && (
         <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--surface-pressed)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--body)' }}>
           {ride.stops && ride.stops.length > 0 && (
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>Stops</span>
               <span style={{ color: 'var(--ink)', fontWeight: '500', textAlign: 'right' }}>{ride.stops.join(', ')}</span>
             </div>
           )}
           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
             <span>Driver</span>
             <span style={{ color: 'var(--ink)', fontWeight: '500' }}>{ride.driverName || 'Not assigned'}</span>
           </div>
           {ride.status === 'completed' && (
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>Rating</span>
               <span style={{ color: 'var(--ink)', fontWeight: '500' }}>{ride.rating ? ride.rating + ' ★' : 'None'}</span>
             </div>
           )}
           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
             <span>Payment</span>
             <span style={{ color: 'var(--ink)', fontWeight: '500' }}>Cash</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
             <span>Ride ID</span>
             <span style={{ color: 'var(--ink)', fontWeight: '500', fontSize: '12px', fontFamily: 'monospace' }}>{ride.id}</span>
           </div>
         </div>
       )}
    </div>
  );
};

const StudentHistory = () => {
  const { rides, currentUser } = useMockData();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [period, setPeriod] = useState('All time'); // 'This month' | 'All time'
  
  const myRides = rides.filter(r => r.studentId === currentUser.uid);

  useEffect(() => {
    if (import.meta.env.DEV && myRides.length > 0) {
      const statuses = [...new Set(myRides.map(r => r.status))];
      const firstRide = myRides[0];
      const dateField = firstRide.createdAt || firstRide.date;
      const dateType = dateField ? (typeof dateField?.toDate === 'function' ? 'Firestore Timestamp' : typeof dateField) : 'missing';
      console.log('StudentHistory Dev Log - Statuses:', statuses);
      console.log('StudentHistory Dev Log - First ride date type:', dateType, 'Value:', dateField);
    }
  }, [myRides]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const now = new Date();
  
  const parseDate = (r) => {
    const val = r.createdAt || r.date;
    if (!val) return null;
    if (typeof val?.toDate === 'function') return val.toDate();
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const periodRides = myRides.filter(r => {
    const d = parseDate(r);
    if (!d) return false;
    if (period === 'All time') return true;
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  const completedPeriodRides = periodRides.filter(r => String(r.status).toLowerCase() === 'completed');
  const totalRides = completedPeriodRides.length;
  const totalSpent = completedPeriodRides.reduce((sum, r) => sum + (Number(r.price) || 0), 0);

  let filteredRides = [...myRides];
  if (filter === 'Completed') filteredRides = filteredRides.filter(r => r.status === 'completed');
  if (filter === 'Cancelled') filteredRides = filteredRides.filter(r => r.status === 'cancelled');
  if (filter === 'Parcel') filteredRides = filteredRides.filter(r => r.type === 'parcel');
  
  filteredRides.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const isToday = (d) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const isYesterday = (d) => {
     const yesterday = new Date(now);
     yesterday.setDate(now.getDate() - 1);
     return d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  };
  
  const groups = {};
  filteredRides.forEach(r => {
    const d = parseDate(r);
    if (!d) return;
    let label = '';
    if (isToday(d)) label = 'Today';
    else if (isYesterday(d)) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    if (!groups[label]) groups[label] = [];
    groups[label].push(r);
  });

  return (
    <div style={{ padding: '16px', paddingBottom: '96px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 
        style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: 'var(--ink)', 
          margin: 0,
          position: 'sticky',
          top: '0',
          backgroundColor: 'var(--canvas)',
          padding: '16px 0 8px 0',
          zIndex: 10
        }}
      >
        Your rides
      </h1>
      
      <div style={{ backgroundColor: 'var(--ink)', borderRadius: '16px', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '999px', padding: '4px' }}>
             {['All time', 'This month'].map(p => (
               <button 
                 key={p}
                 onClick={() => setPeriod(p)}
                 style={{ 
                   height: '44px', 
                   padding: '0 16px', 
                   borderRadius: '999px', 
                   border: 'none', 
                   backgroundColor: period === p ? 'white' : 'transparent',
                   color: period === p ? 'var(--ink)' : 'white',
                   fontSize: '14px', 
                   fontWeight: '600', 
                   cursor: 'pointer',
                   transition: 'all 0.2s'
                 }}
               >
                 {p}
               </button>
             ))}
          </div>
        </div>
        
        {totalRides === 0 ? (
           <div style={{ fontSize: '16px', opacity: 0.8, padding: '12px 0' }}>
             No rides {period === 'This month' ? 'this month' : 'all time'}
           </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
             <div>
               <div style={{ fontSize: '24px', fontWeight: '700' }}>{totalRides}</div>
               <div style={{ fontSize: '14px', opacity: 0.8 }}>Completed rides</div>
             </div>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '24px', fontWeight: '700' }}>{formatPrice(totalSpent)}</div>
               <div style={{ fontSize: '14px', opacity: 0.8 }}>Spent</div>
             </div>
          </div>
        )}
      </div>
      
      <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
         {['All', 'Completed', 'Cancelled', 'Parcel'].map(f => (
           <button 
             key={f} 
             onClick={() => setFilter(f)}
             style={{ 
               height: '44px', 
               padding: '0 20px', 
               borderRadius: '999px',
               border: '1px solid var(--surface-pressed)',
               backgroundColor: filter === f ? 'var(--ink)' : 'white',
               color: filter === f ? 'white' : 'var(--ink)',
               fontSize: '14px',
               fontWeight: '500',
               cursor: 'pointer',
               whiteSpace: 'nowrap'
             }}
           >
             {f}
           </button>
         ))}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px', width: '100%' }}></div>
            ))}
          </div>
        ) : filteredRides.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--ink)' }}>
             <HistoryIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
             <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>No rides found</p>
          </div>
        ) : (
          Object.keys(groups).map(label => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <div style={{ fontSize: '14px', color: 'var(--body)' }}>{label}</div>
               {groups[label].map(ride => <RideCard key={ride.id} ride={ride} />)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentHistory;
