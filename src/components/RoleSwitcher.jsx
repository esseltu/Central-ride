import React from 'react';
import { useAuth } from '../context/AuthContext';

const RoleSwitcher = () => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <button 
      className="btn btn-white-danger" 
      onClick={() => logout()}
      style={{ position: 'fixed', top: '24px', right: '20px', zIndex: 1000 }}
    >
      Logout
    </button>
  );
};

export default RoleSwitcher;
