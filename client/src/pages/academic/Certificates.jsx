import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Award, ShieldCheck, Download, ExternalLink, Printer } from 'lucide-react';

const Certificates = () => {
  const { token, user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    if (token) {
      fetchCertificates();
    }
  }, [token]);

  const fetchCertificates = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/academic/certificate', { headers });
      if (res.ok) {
        const list = await res.json();
        setCerts(list);
        if (list.length > 0) {
          setSelectedCert(list[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-certificate-area');
    const originalContent = document.body.innerHTML;

    // Open a clean printable window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Academic Completion Certificate</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #fff;
              font-family: 'Outfit', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            .cert-print-container {
              border: 12px double #1e293b;
              padding: 40px;
              width: 800px;
              height: 550px;
              position: relative;
              background: #faf8f5;
              text-align: center;
              box-sizing: border-box;
            }
            h1 { font-size: 2.2rem; color: #0f172a; margin-top: 10px; font-family: Georgia, serif; }
            h3 { font-size: 1rem; text-transform: uppercase; color: #64748b; letter-spacing: 2px; }
            .name { font-size: 1.8rem; font-weight: bold; color: #1e1b4b; border-bottom: 2px solid #e2e8f0; display: inline-block; padding: 5px 30px; margin: 15px 0; }
            p { font-size: 1rem; color: #334155; line-height: 1.6; max-width: 600px; margin: 10px auto; }
            .uuid { position: absolute; bottom: 20px; left: 40px; font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; }
            .badge-logo { font-size: 1.25rem; font-weight: 800; color: #4338ca; letter-spacing: 1px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="cert-print-container">
            <div class="badge-logo">VITE UNIVERSITY</div>
            <h3>Certificate of Completion</h3>
            <p>This is proudly presented to</p>
            <div class="name">${user?.username}</div>
            <p>
              for successfully executing and presenting the senior capstone project titled:
            </p>
            <p style="font-weight: bold; font-style: italic;">
              "${selectedCert?.Student?.Thesis?.[0]?.title || 'AI Guided Capstone Framework'}"
            </p>
            <p>
              Under the faculty guidance of <strong>${selectedCert?.Student?.Thesis?.[0]?.Guide?.username || 'Department Advisors'}</strong>.
            </p>
            <div style="margin-top: 40px; display: flex; justify-content: space-around; font-size: 0.85rem; color: #334155;">
              <div>
                <div style="border-top: 1px solid #94a3b8; width: 150px; margin-top: 30px; padding-top: 5px;">HOD SIGNATURE</div>
              </div>
              <div>
                <div style="border-top: 1px solid #94a3b8; width: 150px; margin-top: 30px; padding-top: 5px;">ADVISOR SIGNATURE</div>
              </div>
            </div>
            <div class="uuid">Verification Code: ${selectedCert?.certificate_uuid}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading certificate credentials...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px', textAlign: 'left' }}>
      
      {/* Left List of Certificates */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} style={{ color: 'hsl(var(--accent-cyan))' }} /> Issued Credentials
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
          {certs.length === 0 ? (
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', fontStyle: 'italic', padding: '20px 0' }}>
              No completion certificates have been issued yet. Ensure you have passing grading rubrics published.
            </p>
          ) : (
            certs.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCert(c)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: selectedCert?.id === c.id ? 'hsla(190, 90%, 50%, 0.12)' : 'hsla(0,0%,100%,0.02)',
                  border: selectedCert?.id === c.id ? '1px solid hsl(var(--accent-cyan))' : '1px solid hsl(var(--border-glass))',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                  <span>Completion Certificate</span>
                  <ShieldCheck size={14} style={{ color: 'hsl(var(--status-complete))' }} />
                </div>
                <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.72rem' }}>UUID: {c.certificate_uuid.substring(0, 16)}...</div>
                <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.68rem', marginTop: '6px' }}>
                  Issued: {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Certificate Frame Preview */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {selectedCert ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Certificate Live Preview</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handlePrint}
                  style={{
                    background: 'hsl(var(--accent-cyan))',
                    color: '#000',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Printer size={12} /> Print / Save PDF
                </button>
                <a
                  href={`/api/academic/certificate/verify/${selectedCert.certificate_uuid}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: 'none',
                    border: '1px solid hsl(var(--border-glass))',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Verify URL <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Aesthetic SVG/HTML certificate template box */}
            <div id="printable-certificate-area" style={{
              background: '#faf8f5',
              border: '8px double #1e293b',
              borderRadius: '8px',
              padding: '30px',
              textAlign: 'center',
              color: '#000',
              fontFamily: 'serif',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}>
              <span style={{ fontSize: '1.1rem', letterSpacing: '1px', fontWeight: '800', color: '#4338ca', display: 'block', marginBottom: '8px' }}>
                VITE UNIVERSITY
              </span>
              <span style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '20px' }}>
                Certificate of Completion
              </span>
              
              <span style={{ fontSize: '0.85rem', color: '#475569', display: 'block' }}>This is proudly presented to</span>
              
              <span style={{
                fontSize: '1.65rem',
                fontWeight: 'bold',
                color: '#1e1b4b',
                borderBottom: '2px solid #e2e8f0',
                display: 'inline-block',
                padding: '4px 20px',
                margin: '12px 0'
              }}>
                {user?.username}
              </span>

              <p style={{ fontSize: '0.85rem', color: '#334155', maxWidth: '480px', margin: '8px auto', fontFamily: 'sans-serif', lineHeight: 1.5 }}>
                for successfully executing and presenting the senior capstone project titled:
              </p>
              
              <p style={{ fontSize: '0.9rem', fontWeight: 'bold', fontStyle: 'italic', color: '#0f172a', margin: '10px 0' }}>
                "{selectedCert?.Student?.Thesis?.[0]?.title || 'AI Guided Capstone Framework'}"
              </p>
              
              <p style={{ fontSize: '0.82rem', color: '#334155', fontFamily: 'sans-serif' }}>
                Under the faculty guidance of <strong>{selectedCert?.Student?.Thesis?.[0]?.Guide?.username || 'Department Advisors'}</strong>.
              </p>

              <div style={{
                marginTop: '30px',
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '0.75rem',
                color: '#475569',
                fontFamily: 'sans-serif'
              }}>
                <div>
                  <div style={{ borderTop: '1px solid #cbd5e1', width: '120px', marginTop: '20px', paddingImg: '5px' }}>HOD</div>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #cbd5e1', width: '120px', marginTop: '20px', paddingImg: '5px' }}>ADVISOR</div>
                </div>
              </div>

              {/* Bottom footer tag */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '20px',
                fontSize: '0.55rem',
                color: '#94a3b8',
                textTransform: 'uppercase',
                fontFamily: 'sans-serif'
              }}>
                Verification Code: {selectedCert.certificate_uuid}
              </div>
            </div>
          </>
        ) : (
          <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))' }}>
            Select an issued credential from the sidebar.
          </div>
        )}
      </div>

    </div>
  );
};

export default Certificates;
