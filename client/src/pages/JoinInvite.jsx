import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, AlertCircle, CheckCircle2, RefreshCw, Home, LogIn, UserPlus, ShieldCheck } from 'lucide-react';

const JoinInvite = () => {
  const { token } = useParams();
  const { token: authToken, user, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [validating, setValidating] = useState(true);

  // Validate invite token on mount (public endpoint)
  useEffect(() => {
    const validateToken = async () => {
      setValidating(true);
      try {
        const res = await fetch(`/api/team/invite/validate/${token}`);
        if (res.ok) {
          const data = await res.json();
          setInviteInfo(data);
        } else {
          const data = await res.json();
          setError(data.message || 'This invite link is invalid or has expired.');
        }
      } catch (err) {
        // If validate endpoint doesn't exist, just show the invite card
        setInviteInfo({ role: 'member' });
      } finally {
        setValidating(false);
      }
    };
    if (token) validateToken();
  }, [token]);

  // Countdown redirect after success
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate('/dashboard');
    }
  }, [success, countdown, navigate]);

  const handleJoin = async () => {
    if (!user || !authToken) {
      // Redirect to login preserving the invite URL
      navigate(`/login?redirect=/invite/join/${token}`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/team/invite/join/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        if (fetchProfile) await fetchProfile();
      } else {
        setError(data.message || 'Failed to join. Link may be invalid or expired.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    maxWidth: '480px',
    width: '100%',
    padding: '40px 36px',
    borderRadius: '20px',
    border: '1px solid hsl(var(--border-glass))',
    boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
    animation: 'fadeIn 0.4s ease',
    background: 'hsla(220, 20%, 8%, 0.85)',
    backdropFilter: 'blur(16px)'
  };

  const iconBoxStyle = (color, bg) => ({
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    border: `1px solid ${color}33`,
    boxShadow: `0 4px 16px ${color}22`
  });

  // Validating state
  if (validating) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'hsl(var(--bg-primary))' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--accent-cyan))' }} />
            <p style={{ marginTop: '16px', color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>Validating invite link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'hsl(var(--bg-primary))', padding: '20px' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={iconBoxStyle('hsl(0,85%,65%)', 'hsla(0,85%,60%,0.1)')}>
              <AlertCircle size={30} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '12px', color: 'hsl(0,85%,65%)', fontFamily: 'Outfit' }}>
              Invalid Invite Link
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'hsl(var(--text-muted))', lineHeight: '1.7', marginBottom: '28px' }}>
              {error}
            </p>
            <Link to={user ? '/dashboard' : '/'} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '10px',
              background: 'hsla(220,20%,25%,0.5)', border: '1px solid hsl(var(--border-glass))',
              color: 'hsl(var(--text-main))', fontWeight: '700', fontSize: '0.88rem',
              textDecoration: 'none'
            }}>
              <Home size={15} /> Go to {user ? 'Dashboard' : 'Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'hsl(var(--bg-primary))', padding: '20px' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={iconBoxStyle('hsl(145,75%,55%)', 'hsla(145,75%,45%,0.1)')}>
              <CheckCircle2 size={30} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px', color: 'hsl(145,75%,55%)', fontFamily: 'Outfit' }}>
              Welcome to the Team! 🎉
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'hsl(var(--text-muted))', lineHeight: '1.7', marginBottom: '28px' }}>
              You have successfully joined the workspace. Redirecting to dashboard in <strong style={{ color: 'hsl(var(--text-main))' }}>{countdown}s</strong>...
            </p>
            <Link to="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '10px',
              background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-cyan)))',
              color: '#0c0e14', fontWeight: '800', fontSize: '0.88rem', textDecoration: 'none'
            }}>
              <Home size={15} /> Go to Dashboard Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main invite card — works for both logged-in and logged-out users
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'hsl(var(--bg-primary))', padding: '20px' }}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center' }}>

          {/* Icon */}
          <div style={iconBoxStyle('hsl(var(--accent-cyan))', 'hsla(190,90%,50%,0.1)')}>
            <UserCheck size={30} />
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', fontFamily: 'Outfit', color: 'hsl(var(--text-main))' }}>
            You're Invited!
          </h2>

          <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', lineHeight: '1.7', marginBottom: '24px' }}>
            You have been invited to join the <strong style={{ color: 'hsl(var(--text-main))' }}>ISPE Team</strong> workspace.
            {inviteInfo?.role && (
              <>
                {' '}Your role will be set to{' '}
                <span style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                  background: inviteInfo.role === 'admin' ? 'hsla(0,85%,60%,0.15)' : 'hsla(215,90%,55%,0.15)',
                  color: inviteInfo.role === 'admin' ? 'hsl(0,85%,65%)' : 'hsl(215,90%,65%)',
                  fontWeight: '700', fontSize: '0.8rem', textTransform: 'capitalize'
                }}>
                  {inviteInfo.role}
                </span>.
              </>
            )}
          </p>

          {/* Divider */}
          <div style={{ height: '1px', background: 'hsl(var(--border-glass))', margin: '0 0 24px' }} />

          {/* If logged in: show Accept button */}
          {user ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', borderRadius: '10px',
                background: 'hsla(145,75%,45%,0.08)', border: '1px solid hsla(145,75%,45%,0.2)',
                marginBottom: '20px', textAlign: 'left'
              }}>
                <ShieldCheck size={16} color="hsl(145,75%,55%)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
                  Joining as <strong style={{ color: 'hsl(var(--text-main))' }}>{user.username}</strong> ({user.email})
                </span>
              </div>
              <button
                onClick={handleJoin}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px 24px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-cyan)))',
                  color: '#0c0e14', fontWeight: '800', fontSize: '0.95rem',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  opacity: loading ? 0.7 : 1, transition: 'all 0.2s'
                }}
              >
                {loading ? (
                  <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Joining...</>
                ) : (
                  <><UserCheck size={16} /> Accept Invitation</>
                )}
              </button>
            </>
          ) : (
            /* If NOT logged in: show login/register options */
            <>
              <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', marginBottom: '16px' }}>
                Please log in or create an account to accept this invitation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link
                  to={`/login?redirect=/invite/join/${token}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '13px 24px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-cyan)))',
                    color: '#0c0e14', fontWeight: '800', fontSize: '0.9rem', textDecoration: 'none'
                  }}
                >
                  <LogIn size={16} /> Log In & Accept
                </Link>
                <Link
                  to={`/register?redirect=/invite/join/${token}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '13px 24px', borderRadius: '12px',
                    background: 'hsla(220,20%,20%,0.5)', border: '1px solid hsl(var(--border-glass))',
                    color: 'hsl(var(--text-main))', fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none'
                  }}
                >
                  <UserPlus size={16} /> Create Account & Accept
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default JoinInvite;
