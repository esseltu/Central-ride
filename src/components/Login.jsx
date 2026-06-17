import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle(role);
    } catch (err) {
      console.error(err);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      padding: 'var(--space-2xl)',
      background: 'linear-gradient(135deg, var(--canvas) 0%, var(--canvas-soft) 100%)',
      minHeight: '100vh'
    }}>
      <div style={{ marginTop: 'auto', marginBottom: 'auto', maxWidth: '400px', width: '100%', alignSelf: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <img src="/logo.png" alt="Central Ride Logo" style={{ width: '80px', marginBottom: 'var(--space-md)', borderRadius: '16px', boxShadow: 'var(--shadow-2)' }} />
          <h1 className="text-display-lg" style={{ color: 'var(--primary)' }}>Central Ride</h1>
          <p className="text-body-lg">The smart campus transit system.</p>
        </div>

        <div className="card" style={{ 
          background: 'rgba(255, 255, 255, 0.7)', 
          backdropFilter: 'blur(10px)', 
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h2 className="text-body-lg text-center" style={{ marginBottom: 'var(--space-lg)' }}>Sign in to continue</h2>
          
          <div className="flex-col gap-sm" style={{ marginBottom: 'var(--space-xl)' }}>
             <p className="text-body-sm-strong" style={{ color: 'var(--body)' }}>I am a...</p>
             <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={`btn ${role === 'student' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ flex: 1, padding: '8px' }}
                  onClick={() => setRole('student')}
                >
                  Student
                </button>
                <button 
                  className={`btn ${role === 'driver' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ flex: 1, padding: '8px' }}
                  onClick={() => setRole('driver')}
                >
                  Driver
                </button>
             </div>
          </div>

          {error && <p style={{ color: 'var(--accent-red)', fontSize: '14px', marginBottom: 'var(--space-md)', textAlign: 'center' }}>{error}</p>}

          <button 
            className="btn btn-large" 
            onClick={handleGoogleSignIn}
            style={{ 
              backgroundColor: '#fff', 
              color: '#333', 
              border: '1px solid #ccc',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '24px' }} />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
