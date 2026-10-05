import React from 'react';

// Splash component displays a loading screen when the app starts up or checks login state.
const Splash = () => {
  return (
    <div style={{
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: 'var(--ink)',
      height: '100vh'
    }}>
      <div style={{ animation: 'fade-in 1.5s ease-out forwards', opacity: 0, textAlign: 'center' }}>
        <img src="/logo.png" alt="Central Ride Logo" style={{ width: '64px', height: '64px', marginBottom: 'var(--space-md)', filter: 'invert(1)' }} />
        <h1 className="text-display-lg" style={{ color: 'var(--on-dark)' }}>Central Ride</h1>
      </div>
      
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Splash;

