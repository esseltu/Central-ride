import React from 'react';

// Splash component displays a loading screen when the app starts up or checks login state.
const Splash = () => {
  return (
    // Style attributes in React use JS objects (e.g. flex: 1, flexDirection: 'column').
    // We use CSS variables like `var(--primary)` which are defined in `src/index.css`.
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--primary)' }}>
      
      {/* Pulse Animation Container: 
          Uses a custom CSS keyframe animation defined at the bottom of this file.
      */}
      <div style={{ animation: 'pulse 2s infinite', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--canvas)', borderRadius: 'var(--radius-pill)', padding: 'var(--space-md)' }}>
        <img src="/logo.png" alt="Central Ride Logo" style={{ width: '80px', height: 'auto', objectFit: 'contain' }} />
      </div>
      
      <h2 style={{ color: 'var(--on-primary)', marginTop: 'var(--space-md)', fontWeight: 500 }}>Central Ride</h2>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 'var(--space-sm)' }}>Secure Smart Campus Transportation</p>
      
      {/* React allows injecting normal CSS directly inside a component using `<style>` tags. */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Splash;

