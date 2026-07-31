import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword 
} from '../config/firebase';
import { 
  Lock, 
  Mail, 
  AlertTriangle 
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithToken, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // Handle standard Local Email/Password Sign In
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setForgotMsg('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectTo);  // ← goes back to invite page if came from invite link
    } catch (err) {
      console.error('Local signin error:', err);
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle secure Firebase Google Single Sign-On (SSO)
  const handleFirebaseGoogleLogin = async () => {
    setError('');
    setForgotMsg('');
    setLoading(true);

    try {
      // 1. Trigger official Google SSO login overlay
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr) {
        // Handle popup-specific errors before reaching the server
        if (popupErr.code === 'auth/popup-closed-by-user') {
          setError('Sign-in cancelled. The Google authentication popup was closed.');
          return;
        } else if (popupErr.code === 'auth/cancelled-popup-request') {
          setError('Sign-in pending. A Google auth window is already open.');
          return;
        } else if (popupErr.code === 'auth/popup-blocked') {
          setError('Popup was blocked by your browser. Please allow popups for this site.');
          return;
        }
        throw popupErr;
      }
      
      // 2. Retrieve secure Firebase idToken
      const idToken = await result.user.getIdToken();

      // 3. Sync and auto-create profile inside local SQLite database
      let response;
      try {
        response = await fetch('/api/auth/firebase-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
      } catch (fetchErr) {
        console.error('Network error calling firebase-login API:', fetchErr);
        setError('Cannot connect to the server. Make sure the backend is running on port 5000.');
        return;
      }

      const contentType = response.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response from firebase-login:', response.status, text);
        setError('Server returned an unexpected response. Check the server console for errors.');
        return;
      }

      if (response.ok) {
        loginWithToken(data.token, data.user);
        navigate('/dashboard');
      } else {
        console.error('Firebase login API error:', response.status, data);
        setError(data.message || 'Failed to sync Google account with local profile.');
      }
    } catch (err) {
      console.error('Firebase Google login error:', err);
      setError(err.message || 'An unexpected error occurred during Google sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Please type your email in the field first.');
      return;
    }
    setError('');
    // Inform user of standard Firebase password reset flow
    setForgotMsg('Please perform password recovery via Firebase Auth services.');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '40px 20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="Project Hub Logo" style={{ height: '120px', objectFit: 'contain', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'Outfit' }}>Welcome Back</h2>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginTop: '4px' }}>
            Access the Project Hub workspace to view your projects and tasks.
          </p>
        </div>

        {error && (
          <div className="status-badge" style={{
            background: 'hsla(0, 85%, 60%, 0.1)',
            color: 'hsl(var(--status-high))',
            padding: '12px',
            borderRadius: '8px',
            width: '100%',
            marginBottom: '16px',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <AlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {forgotMsg && (
          <div className="status-badge status-complete" style={{
            padding: '12px',
            borderRadius: '8px',
            width: '100%',
            marginBottom: '16px',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <span>{forgotMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'hsl(var(--text-muted))' }} />
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
                disabled={loading}
                required 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'hsl(var(--text-muted))' }} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                disabled={loading}
                required 
              />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.8rem', color: 'hsl(var(--accent-cyan))', cursor: 'pointer' }}
            >
              Forgot password?
            </button>
          </div>

          {/* Real Firebase Google Authentication Button */}
          <button 
            type="button" 
            onClick={handleFirebaseGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px',
              background: 'hsla(220, 20%, 25%, 0.3)',
              border: '1px solid hsl(var(--border-glass))',
              borderRadius: '8px',
              color: 'hsl(var(--text-main))',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
              marginBottom: '16px',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: '600',
              fontSize: '0.9rem',
              boxShadow: 'var(--shadow-card)',
              opacity: loading ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (loading) return;
              e.currentTarget.style.background = 'hsla(220, 20%, 25%, 0.6)';
              e.currentTarget.style.borderColor = 'hsl(var(--accent-cyan))';
              e.currentTarget.style.boxShadow = 'var(--shadow-glow), var(--shadow-card)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'hsla(220, 20%, 25%, 0.3)';
              e.currentTarget.style.borderColor = 'hsl(var(--border-glass))';
              e.currentTarget.style.boxShadow = 'var(--shadow-card)';
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>{loading ? 'Connecting Google...' : 'Continue with Google'}</span>
          </button>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '12px', color: '#000', opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '20px' }}>
          Self-registration is restricted. Contact your Admin or check your email for credentials.
        </p>
      </div>
    </div>
  );
};

export default Login;
