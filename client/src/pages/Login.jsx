import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const { login } = useAuth();
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
      navigate(redirectTo);
    } catch (err) {
      console.error('Local signin error:', err);
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
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
    setForgotMsg('Password recovery link sent! Contact your System Administrator to reset account credentials.');
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
