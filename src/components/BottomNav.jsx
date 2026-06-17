import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { Home, Clock, DollarSign, LayoutDashboard, Database, Bell, User } from 'lucide-react';

const BottomNav = () => {
  const { currentUser } = useMockData();
  
  if (!currentUser) return null;

  return (
    <nav className="bottom-nav">
      {currentUser.role === 'student' && (
        <>
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
