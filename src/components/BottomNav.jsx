import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { Home, Clock, DollarSign, LayoutDashboard, Database, Bell, User, History as HistoryIcon } from 'lucide-react';

const BottomNav = () => {
  const { currentUser } = useMockData();
  
  if (!currentUser) return null;

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink 
      to={to} 
      className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
      aria-label={label}
    >
      {({ isActive }) => (
        <>
          <Icon size={24} className="nav-icon" />
          {isActive ? (
            <span className="nav-label" aria-hidden="true">{label}</span>
          ) : (
            <span className="visually-hidden">{label}</span>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <nav className="bottom-nav">
      
      {/* 1. STUDENT BOTTOM TABS */}
      {currentUser.role === 'student' && (
        <>
          <NavItem to="/" icon={Home} label="Ride" />
          <NavItem to="/history" icon={HistoryIcon} label="History" />
          <NavItem to="/profile" icon={User} label="Profile" />
        </>
      )}

      {/* 2. DRIVER / RIDER BOTTOM TABS */}
      {(currentUser.role === 'driver' || currentUser.role === 'rider') && (
        <>
          <NavItem to="/" icon={Home} label="Requests" />
          <NavItem to="/earnings" icon={DollarSign} label="Earnings" />
          <NavItem to="/profile" icon={User} label="Profile" />
        </>
      )}

      {/* 3. ADMIN BOTTOM TABS */}
      {currentUser.role === 'admin' && (
        <>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/records" icon={Database} label="Records" />
          <NavItem to="/alerts" icon={Bell} label="Alerts" />
        </>
      )}
    </nav>
  );
};

export default BottomNav;

