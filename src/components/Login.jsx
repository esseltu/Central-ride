import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Login component allows users to choose their role and sign in with Google.
const Login = () => {
  // Extract google authentication method from the AuthContext.
  const { loginWithGoogle } = useAuth();
  
  // React Hooks:
  // - role: Holds the selected role ('student' or 'driver'). Defaults to 'student'.
  // - error: Stores any error message string we get if authentication fails.
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  // Click Handler: Triggers Google login pop-up, passing in the selected role.
  const handleGoogleSignIn = async () => {
    try {
      // clear any old errors
      setError('');
      await loginWithGoogle(role);
    } catch (err) {
      console.error(err);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const textShadowStyle = { textShadow: '0 1px 2px rgba(0,0,0,0.4)' };

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      padding: 'var(--space-2xl)',
      backgroundImage: `linear-gradient(var(--login-overlay), var(--login-overlay)), var(--login-bg-image)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100dvh'
    }}>
      <div style={{ marginTop: 'auto', marginBottom: 'auto', maxWidth: '400px', width: '100%', alignSelf: 'center' }}>
        
        {/* Top Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <img src="/logo.png" alt="Central Ride Logo" style={{ width: '80px', marginBottom: 'var(--space-md)' }} />
          <h1 className="text-display-lg" style={{ color: 'var(--on-dark)' }}>Central Ride</h1>
          <p className="text-body-lg" style={{ color: 'var(--on-dark)' }}>The smart campus transit system.</p>
        </div>

        {/* Login Card */}
        <div className="login-glass-card" style={{ padding: 'var(--space-2xl)' }}>
          <h2 className="text-body-lg text-center" style={{ color: 'var(--on-dark)', marginBottom: 'var(--space-lg)', ...textShadowStyle }}>
            Sign in to continue
          </h2>
          
          {/* Role selector buttons */}
          <div className="flex-col gap-sm" style={{ marginBottom: 'var(--space-xl)' }}>
             <p className="text-body-sm-strong" style={{ color: 'var(--on-dark)', ...textShadowStyle }}>I am a...</p>
             <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn" 
                  style={{ 
                    flex: 1, 
                    padding: '8px', 
                    backgroundColor: role === 'student' ? '#ffffff' : 'transparent',
                    color: role === 'student' ? '#000000' : '#ffffff',
                    border: role === 'student' ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.4)',
                  }}
                  onClick={() => setRole('student')}
                >
                  Student
                </button>
                <button 
                  className="btn" 
                  style={{ 
                    flex: 1, 
                    padding: '8px', 
                    backgroundColor: role === 'driver' ? '#ffffff' : 'transparent',
                    color: role === 'driver' ? '#000000' : '#ffffff',
                    border: role === 'driver' ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.4)',
                  }}
                  onClick={() => setRole('driver')}
                >
                  Driver
                </button>
             </div>
          </div>

          {/* Conditional Rendering */}
          {error && <p style={{ color: 'var(--status-sos)', fontSize: '14px', marginBottom: 'var(--space-md)', textAlign: 'center' }}>{error}</p>}

          {/* Google Login Trigger Button */}
          <button 
            className="btn btn-large" 
            onClick={handleGoogleSignIn}
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#000000', 
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              borderRadius: 'var(--radius-pill)',
              minHeight: '44px',
              width: '100%'
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

