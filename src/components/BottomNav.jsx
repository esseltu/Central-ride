import React from 'react';
// NavLink is a special React Router component used for navigation links.
// It automatically detects if the current URL matches the link's path (`to="/..."`)
// and lets us dynamically apply an 'active' style or class (using a function callback).
import { NavLink } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { Home, Clock, DollarSign, LayoutDashboard, Database, Bell, User } from 'lucide-react';

// BottomNav component represents the mobile-only navigation bottom tab bar.
const BottomNav = () => {
  const { currentUser } = useMockData();
  
  // If no user session is loaded, do not display the bottom navigation.
  if (!currentUser) return null;

  return (
    <nav className="bottom-nav">
      
      {/* 1. STUDENT BOTTOM TABS */}
      {currentUser.role === 'student' && (
        <>
          {/* NavLink's `className` takes a callback function that receives an object with an `isActive` boolean property. */}
          <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Home size={24} />
            <span>Ride</span>
          </NavLink>
          <NavLink to="/history" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Clock size={24} />
            <span>History</span>
          </NavLink>
          <NavLink to="/profile" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <User size={24} />
            <span>Profile</span>
          </NavLink>
        </>
      )}

      {/* 2. DRIVER / RIDER BOTTOM TABS */}
      {(currentUser.role === 'driver' || currentUser.role === 'rider') && (
        <>
          <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Home size={24} />
            <span>Requests</span>
          </NavLink>
          <NavLink to="/earnings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <DollarSign size={24} />
            <span>Earnings</span>
          </NavLink>
          <NavLink to="/profile" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <User size={24} />
            <span>Profile</span>
          </NavLink>
        </>
      )}

      {/* 3. ADMIN BOTTOM TABS */}
      {currentUser.role === 'admin' && (
        <>
          <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={24} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/records" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Database size={24} />
            <span>Records</span>
          </NavLink>
          <NavLink to="/alerts" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Bell size={24} />
            <span>Alerts</span>
          </NavLink>
        </>
      )}
    </nav>
  );
};

export default BottomNav;

