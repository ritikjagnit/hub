import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, User, Mail, Lock, CreditCard, Sparkles } from 'lucide-react';

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'protonmail.com', 'yandex.com', 'gmx.com'
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const plan = searchParams.get('plan');

  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, text: '' });

  const isCompanyEmail = (email) => {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1].toLowerCase();
    return !FREE_EMAIL_DOMAINS.includes(domain);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password } = formData;

    if (!username || !email || !password) {
      setStatus({ type: 'error', text: 'All fields are required.' });
      return;
    }

    if (!isCompanyEmail(email)) {
      setStatus({ 
        type: 'error', 
        text: 'Please register with your official company email address. Free providers (Gmail, Yahoo, etc.) are restricted.' 
      });
      return;
    }

    if (password.length < 6) {
      setStatus({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, text: '' });

    try {
      const baseUrl = window.location.origin.includes('localhost:5173') ? 'http://localhost:5000' : '';
      const response = await fetch(`${baseUrl}/api/auth/register-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, paymentId })
      });
      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', text: 'Workspace Admin registered successfully! Redirecting...' });
        // Automatically save token and login
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setStatus({ type: 'error', text: data.message || 'Registration failed.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'Server connection error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // If no paymentId is present, show restricted access
  if (!paymentId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '40px 20px'
      }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <img src="/logo.png" alt="Project Hub Logo" style={{ height: '100px', objectFit: 'contain', marginBottom: '20px' }} />
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'hsla(0, 85%, 60%, 0.1)',
              color: 'hsl(var(--status-high))',
              marginBottom: '16px'
            }}>
              <ShieldAlert size={28} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'Outfit', color: 'hsl(var(--text-main))' }}>Registration Restricted</h2>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginTop: '10px', lineHeight: '1.6' }}>
              Self-registration is disabled for the <strong>Project Hub</strong> workspace. 
            </p>
          </div>

          <div style={{
            background: 'hsla(220, 20%, 25%, 0.3)',
            border: '1px solid hsl(var(--border-glass))',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            color: 'hsl(var(--text-muted))',
            marginBottom: '28px',
            textAlign: 'left'
          }}>
            Only verified enterprise customers who purchase a plan can register workspaces. Purchase a subscription plan on the landing page first to gain access.
          </div>

          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '12px', 
              color: '#000',
              gap: '8px',
              borderRadius: '8px'
            }}
          >
            <ArrowLeft size={16} /> Go to Pricing
          </button>
        </div>
      </div>
    );
  }

  // Display Admin Registration Form
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '90vh',
      padding: '40px 20px',
      background: 'radial-gradient(circle at 10% 20%, rgba(90, 85, 230, 0.05) 0%, rgba(0, 0, 0, 0) 40%)'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="Project Hub" style={{ height: '70px', objectFit: 'contain', marginBottom: '16px' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'hsla(190, 90%, 50%, 0.1)', color: 'hsl(190, 90%, 50%)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '16px' }}>
            <Sparkles size={12} /> ENTERPRISE ADMIN SETUP
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit', color: 'hsl(var(--text-main))', margin: 0 }}>Create Workspace</h2>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', marginTop: '8px' }}>
            Configure your enterprise tenant administration credentials.
          </p>
        </div>

        {/* Payment Success Card */}
        <div style={{
          background: 'hsla(150, 80%, 40%, 0.08)',
          border: '1px solid hsla(150, 80%, 40%, 0.3)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
            <CreditCard size={18} />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#a3a3a3' }}>
            <div style={{ color: '#22c55e', fontWeight: 'bold' }}>Payment Verified!</div>
            <div style={{ fontSize: '0.75rem', marginTop: '2px', wordBreak: 'break-all' }}>ID: {paymentId} ({plan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'})</div>
          </div>
        </div>

        {status.text && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            background: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${status.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: status.type === 'success' ? '#22c55e' : '#f87171'
          }}>
            {status.text}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--text-muted))', marginBottom: '8px' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'hsla(220, 20%, 15%, 0.5)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'hsl(190, 90%, 50%)'}
                onBlur={e => e.target.style.borderColor = 'hsl(var(--border-glass))'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--text-muted))', marginBottom: '8px' }}>
              Official Company Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@yourcompany.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'hsla(220, 20%, 15%, 0.5)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'hsl(190, 90%, 50%)'}
                onBlur={e => e.target.style.borderColor = 'hsl(var(--border-glass))'}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
              ⚠️ Gmail, Yahoo, Outlook, and other free domains are restricted.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--text-muted))', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'hsla(220, 20%, 15%, 0.5)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'hsl(190, 90%, 50%)'}
                onBlur={e => e.target.style.borderColor = 'hsl(var(--border-glass))'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              fontWeight: 'bold',
              color: '#000',
              marginTop: '10px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Setting up...' : 'Configure Workspace & Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
