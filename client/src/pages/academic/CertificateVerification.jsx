import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Award, FileText, UserCheck, Calendar } from 'lucide-react';

const CertificateVerification = () => {
  const { uuid } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (uuid) {
      verifyCertificateCode();
    } else {
      setLoading(false);
    }
  }, [uuid]);

  const verifyCertificateCode = async () => {
    try {
      const res = await fetch(`/api/academic/certificate/verify/${uuid}`);
      if (res.ok) {
        setCert(await res.json());
      } else {
        const err = await res.json();
        setError(err.message || 'Invalid certificate code.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to verification server lost.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      padding: '24px',
      textAlign: 'center'
    }}>
      
      {loading ? (
        <div style={{ color: 'hsl(var(--text-muted))', padding: '40px' }}>Verifying credential security nodes...</div>
      ) : cert ? (
        <div className="glass-panel" style={{
          padding: '40px',
          border: '2px solid hsl(var(--status-complete))',
          background: 'linear-gradient(135deg, hsla(145, 75%, 45%, 0.05), hsla(220, 20%, 25%, 0.15))'
        }}>
          
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'hsla(145, 75%, 45%, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <ShieldCheck size={36} style={{ color: 'hsl(var(--status-complete))' }} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
            Credential Verified
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '30px' }}>
            This completion certificate is authenticated under Vite University registry regulations.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'left',
            padding: '20px',
            borderRadius: '10px',
            background: 'hsla(0,0%,100%,0.02)',
            border: '1px solid hsl(var(--border-glass))',
            fontSize: '0.85rem',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--text-muted))' }}>Student Name</span>
              <strong style={{ color: 'hsl(var(--accent-cyan))' }}>{cert.Student?.username}</strong>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--text-muted))' }}>Department</span>
              <span>Computer Science & Engineering</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ color: 'hsl(var(--text-muted))', marginRight: '20px' }}>Capstone Thesis</span>
              <span style={{ textAlign: 'right', fontStyle: 'italic', maxWidth: '280px' }}>
                "{cert.Student?.Thesis?.[0]?.title || 'AI Guided Capstone Scheduler'}"
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--text-muted))' }}>Academic Mentor</span>
              <span>{cert.Student?.Thesis?.[0]?.Guide?.username || 'Department Advisors'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--text-muted))' }}>Final Evaluation Score</span>
              <strong style={{ color: 'hsl(var(--accent-purple))' }}>
                {cert.Student?.EvaluationMarks?.[0]?.final_marks ? `${cert.Student.EvaluationMarks[0].final_marks}/50` : 'Passed'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--text-muted))' }}>Registration Code</span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{cert.certificate_uuid}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--text-muted))' }}>Issuance Date</span>
              <span>{new Date(cert.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{
          padding: '40px',
          border: '1px solid hsl(0, 80%, 60%)',
          background: 'linear-gradient(135deg, hsla(0, 80%, 60%, 0.05), hsla(220, 20%, 25%, 0.15))'
        }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'hsla(0, 80%, 60%, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <ShieldAlert size={36} style={{ color: 'hsl(0, 80%, 60%)' }} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
            Verification Failure
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', lineHeight: 1.5 }}>
            {error || 'The credential code you queried could not be authenticated on the blockchain registry nodes.'}
          </p>
        </div>
      )}

    </div>
  );
};

export default CertificateVerification;
