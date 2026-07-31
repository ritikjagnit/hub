import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verifying your account...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Token is missing.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch('/api/auth/verify-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Your account has been successfully verified!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. The link may have expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error occurred during verification. Please try again.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-box glass-panel" style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="spin" color="hsl(var(--accent-cyan))" style={{ margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ color: 'hsl(var(--text-main))', marginBottom: '10px' }}>Verifying...</h2>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={56} color="hsl(var(--status-complete))" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ color: 'hsl(var(--text-main))', marginBottom: '10px' }}>Verified!</h2>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginBottom: '24px' }}>{message}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/login')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={56} color="hsl(var(--status-high))" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ color: 'hsl(var(--text-main))', marginBottom: '10px' }}>Verification Failed</h2>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginBottom: '24px' }}>{message}</p>
            <button 
              className="btn" 
              onClick={() => navigate('/login')}
              style={{ width: '100%', justifyContent: 'center', background: 'hsla(0,0%,100%,0.1)', color: '#fff' }}
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyAccount;
