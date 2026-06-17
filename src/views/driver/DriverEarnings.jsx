import React from 'react';
import { useMockData } from '../../context/MockDataContext';

// DriverEarnings component displays simple cards showing the logged-in driver's earnings totals.
const DriverEarnings = () => {
  // Pull computed earnings values from MockDataContext.
  const { earnings } = useMockData();

  return (
    // Top padding uses `calc` to prevent the floating desktop TopNav from overlapping the title text.
    <div style={{ padding: 'calc(var(--space-xl) + 64px) var(--space-xl) var(--space-xl) var(--space-xl)', minHeight: '100vh', backgroundColor: 'var(--canvas)' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="text-display-lg" style={{ marginBottom: 'var(--space-xl)', color: 'var(--ink)' }}>My Earnings</h1>
        
        <div className="flex-col gap-md">
          {/* Today's Earnings Card (Styled with primary brand color) */}
          <div className="card-soft" style={{ backgroundColor: 'var(--primary)', color: 'white', border: '1px solid var(--surface-pressed)' }}>
            <p className="text-body-md mb-2" style={{ opacity: 0.9 }}>Today's Total</p>
            <p className="text-display-xl" style={{ fontWeight: 'bold' }}>GH₵ {earnings.today}</p>
          </div>
          
          {/* Weekly Earnings Card */}
          <div className="card-soft" style={{ backgroundColor: 'var(--canvas-soft)', border: '1px solid var(--surface-pressed)' }}>
            <p className="text-body-md mb-2" style={{ color: 'var(--body)' }}>This Week</p>
            <p className="text-display-lg" style={{ color: 'var(--ink)', fontWeight: 'bold' }}>GH₵ {earnings.week}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverEarnings;

