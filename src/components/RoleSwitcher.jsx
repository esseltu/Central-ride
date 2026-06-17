import React from 'react';
import { useAuth } from '../context/AuthContext';

// RoleSwitcher component renders a simple, floating logout button on mobile screens.
const RoleSwitcher = () => {
  // Extract user session info and the logout function from AuthContext.
  const { currentUser, logout } = useAuth();

  // EARLY RETURN:
  // If no user is logged in, there is no reason to show a logout button.
  // Returning `null` means React renders absolutely nothing in the DOM.
  if (!currentUser) return null;

  return (
    <button 
      className="btn btn-white-danger" 
      onClick={() => logout()} // Calls the firebase signOut method defined in AuthContext
      // Inline styles for absolute positioning at the top-right corner of the mobile layout
      style={{ position: 'fixed', top: '24px', right: '20px', zIndex: 1000 }}
    >
      Logout
    </button>
  );
};

export default RoleSwitcher;

