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
        
        {/* Top Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <img src="/logo.png" alt="Central Ride Logo" style={{ width: '80px', marginBottom: 'var(--space-md)', borderRadius: '16px', boxShadow: 'var(--shadow-2)' }} />
          <h1 className="text-display-lg" style={{ color: 'var(--primary)' }}>Central Ride</h1>
          <p className="text-body-lg">The smart campus transit system.</p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ 
          background: 'rgba(255, 255, 255, 0.7)', 
          backdropFilter: 'blur(10px)', // Blurs the background content behind the card (Glassmorphism)
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h2 className="text-body-lg text-center" style={{ marginBottom: 'var(--space-lg)' }}>Sign in to continue</h2>
          
          {/* Role selector buttons:
              Updates the local `role` state when clicked.
              We use a template literal (backticks) to dynamically toggle the styling class
              between `btn-primary` (active color) and `btn-secondary` (inactive gray).
          */}
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

          {/* Conditional Rendering: Only render the paragraph tag if an error is present. */}
          {error && <p style={{ color: 'var(--accent-red)', fontSize: '14px', marginBottom: 'var(--space-md)', textAlign: 'center' }}>{error}</p>}

          {/* Google Login Trigger Button */}
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

