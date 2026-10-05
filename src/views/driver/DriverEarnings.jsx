import React from 'react';
import { useMockData } from '../../context/MockDataContext';
import { TrendingUp, CalendarDays } from 'lucide-react';

const DriverEarnings = () => {
  const { earnings } = useMockData();

  return (
    <div style={{ padding: 'calc(var(--space-xl) + 64px) var(--space-xl) var(--space-xl) var(--space-xl)', minHeight: '100dvh', backgroundColor: 'var(--canvas)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="text-display-lg" style={{ marginBottom: 'var(--space-xl)', color: 'var(--ink)' }}>My Earnings</h1>
        
        <div className="flex-col gap-md">
          <div style={{ backgroundColor: 'var(--ink)', color: 'var(--on-dark)', borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
              <TrendingUp size={20} />
              <p className="text-body-md">Today's Total</p>
            </div>
            <p className="text-display-xl" style={{ fontWeight: 'bold' }}>GH₵ {earnings.today}</p>
          </div>
          
          <div style={{ backgroundColor: 'var(--canvas-soft)', borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)', opacity: 0.6 }}>
              <CalendarDays size={20} />
              <p className="text-body-md">This Week</p>
            </div>
            <p className="text-display-lg" style={{ color: 'var(--ink)', fontWeight: 'bold' }}>GH₵ {earnings.week}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverEarnings;

