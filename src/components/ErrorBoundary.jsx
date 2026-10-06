import React from 'react';
import { RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl)', textAlign: 'center' }}>
          <h2 className="text-display-md" style={{ marginBottom: '16px' }}>Something went wrong</h2>
          <p className="text-body-md" style={{ marginBottom: '32px', color: 'var(--body)' }}>An unexpected error occurred in this view.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '300px' }}>
            <button 
              className="btn btn-large" 
              style={{ backgroundColor: 'var(--ink)', color: 'white', borderRadius: 'var(--radius-pill)', width: '100%' }}
              onClick={() => window.location.reload()}
            >
              <RotateCcw size={20} style={{ marginRight: '8px' }} />
              Reload
            </button>
            <button 
              className="btn" 
              style={{ backgroundColor: 'transparent', color: 'var(--ink)', width: '100%' }}
              onClick={() => window.location.replace('/')}
            >
              <Home size={20} style={{ marginRight: '8px' }} />
              Go to home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
