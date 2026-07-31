import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database, Shield, Settings, CreditCard, Activity, Download, RefreshCw, Check, X } from 'lucide-react';

const AdminPanel = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('logs'); // logs, settings, subscription, database

  // Audit Logs state
  const [logs, setLogs] = useState([]);

  // System Settings state
  const [appName, setAppName] = useState('');
  const [allowPublicReg, setAllowPublicReg] = useState(false);
  const [enforceCompanyEmail, setEnforceCompanyEmail] = useState(false);
  const [idleTimeout, setIdleTimeout] = useState(60);
  const [timezone, setTimezone] = useState('UTC');
  const [saveStatus, setSaveStatus] = useState('');

  // Subscription state
  const [planName, setPlanName] = useState('');
  const [billingCycle, setBillingCycle] = useState('Monthly');
  const [cost, setCost] = useState('');
  const [maxUsers, setMaxUsers] = useState(50);
  const [maxStorage, setMaxStorage] = useState(500);

  // Backup & Restore states
  const [backups, setBackups] = useState([]);
  const [backupStatus, setBackupStatus] = useState('');

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchAuditLogs();
      fetchSystemSettings();
      fetchSubscription();
      fetchBackups();
    }
  }, [token, user]);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setLogs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppName(data.appName);
        setAllowPublicReg(data.allowPublicRegistration);
        setEnforceCompanyEmail(data.enforceCompanyEmail);
        setIdleTimeout(data.idleTimeoutMinutes);
        setTimezone(data.timezone);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/admin/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlanName(data.planName);
        setBillingCycle(data.billingCycle);
        setCost(data.cost);
        setMaxUsers(data.maxUsers);
        setMaxStorage(data.maxStorageGB);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/admin/backups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setBackups(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSaveStatus('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appName,
          allowPublicRegistration: allowPublicReg,
          enforceCompanyEmail,
          idleTimeoutMinutes: parseInt(idleTimeout),
          timezone
        })
      });

      if (res.ok) {
        setSaveStatus('Settings successfully saved!');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSubscription = async (e) => {
    e.preventDefault();
    setSaveStatus('');
    try {
      const res = await fetch('/api/admin/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planName,
          billingCycle,
          cost,
          maxUsers,
          maxStorageGB: maxStorage
        })
      });

      if (res.ok) {
        setSaveStatus('Subscription limits adjusted!');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerBackup = async () => {
    setBackupStatus('Creating backup snapshot file...');
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBackupStatus('Database backup snapshot file written successfully.');
        fetchBackups();
        fetchAuditLogs();
        setTimeout(() => setBackupStatus(''), 3000);
      } else {
        setBackupStatus('Database backup failed.');
      }
    } catch (err) {
      console.error(err);
      setBackupStatus('Error backing up database.');
    }
  };

  const triggerRestore = async (filename) => {
    if (!window.confirm(`MANDATORY RESTORATION WARNING: Overwrite the active database state with snapshot ${filename}?`)) return;

    setBackupStatus('Restoring database snapshot...');
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filename })
      });

      if (res.ok) {
        setBackupStatus('Database snapshot restored successfully! Reloading.');
        fetchAuditLogs();
        setTimeout(() => setBackupStatus(''), 3000);
      } else {
        setBackupStatus('Database restoration failed.');
      }
    } catch (err) {
      console.error(err);
      setBackupStatus('Error restoring database.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <Shield size={40} style={{ color: 'red', marginBottom: '12px' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Only Workspace System Administrators can access this console.</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Configure application settings, review organization security audits, adjust licensing, and trigger backups.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
        {/* Left Side Menu */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', fontWeight: '800', marginBottom: '8px' }}>Console Tools</span>
          {[
            { id: 'logs', label: 'Security Audit Logs', icon: Activity },
            { id: 'settings', label: 'System Settings', icon: Settings },
            { id: 'subscription', label: 'Subscription Plans', icon: CreditCard },
            { id: 'database', label: 'Backup & Restore', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSaveStatus(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === tab.id ? 'hsla(190, 90%, 55%, 0.1)' : 'transparent',
                  color: activeTab === tab.id ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === tab.id ? '700' : '400',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Console view Panel */}
        <div className="glass-panel" style={{ padding: '24px', minHeight: '450px' }}>
          {activeTab === 'logs' && (
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>Workspace Security Audit Logs</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid hsl(var(--border-glass))', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border-glass))', color: 'hsl(var(--text-muted))', background: 'hsla(220, 20%, 10%, 0.4)' }}>
                      <th style={{ padding: '12px' }}>Timestamp</th>
                      <th style={{ padding: '12px' }}>User</th>
                      <th style={{ padding: '12px' }}>Action Trigger</th>
                      <th style={{ padding: '12px' }}>Description Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid hsl(var(--border-glass))' }}>
                        <td style={{ padding: '12px', color: 'hsl(var(--text-muted))' }}>{new Date(log.created_at).toLocaleString()}</td>
                        <td style={{ padding: '12px', fontWeight: '700', color: '#fff' }}>{log.username}</td>
                        <td style={{ padding: '12px', color: 'hsl(var(--accent-cyan))' }}>{log.action}</td>
                        <td style={{ padding: '12px', lineHeight: 1.4 }}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>System Configurations</h3>
              
              <div className="form-group">
                <label className="form-label">Application Branding Name</label>
                <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={allowPublicReg} onChange={(e) => setAllowPublicReg(e.target.checked)} />
                  <span>Allow public signups (without invitation code)</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={enforceCompanyEmail} onChange={(e) => setEnforceCompanyEmail(e.target.checked)} />
                  <span>Enforce workspace company domain check during registration</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Idle Inactivity Session Timeout (Minutes)</label>
                <input type="number" value={idleTimeout} onChange={(e) => setIdleTimeout(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Global Workspace Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  <option value="UTC">UTC (GMT)</option>
                  <option value="IST">Asia/Kolkata (IST)</option>
                  <option value="EST">America/New_York (EST)</option>
                  <option value="PST">America/Los_Angeles (PST)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ color: '#000', alignSelf: 'flex-start' }}>
                Save System Config
              </button>

              {saveStatus && (
                <div style={{ color: 'hsl(var(--accent-cyan))', fontSize: '0.85rem', fontWeight: '700', marginTop: '10px' }}>
                  {saveStatus}
                </div>
              )}
            </form>
          )}

          {activeTab === 'subscription' && (
            <form onSubmit={handleUpdateSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>Adjust Licensing & Subscriptions</h3>
              
              <div className="form-group">
                <label className="form-label">Pricing Plan Title</label>
                <input type="text" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Billing Renewal Cycle</label>
                <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)}>
                  <option value="Monthly">Monthly Cycle</option>
                  <option value="Annual">Annual Cycle</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pricing Cost</label>
                <input type="text" value={cost} onChange={(e) => setCost(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Max Workspace Members</label>
                  <input type="number" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Cloud Storage (GB)</label>
                  <input type="number" value={maxStorage} onChange={(e) => setMaxStorage(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ color: '#000', alignSelf: 'flex-start' }}>
                Adjust Plan Boundaries
              </button>

              {saveStatus && (
                <div style={{ color: 'hsl(var(--accent-cyan))', fontSize: '0.85rem', fontWeight: '700', marginTop: '10px' }}>
                  {saveStatus}
                </div>
              )}
            </form>
          )}

          {activeTab === 'database' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>Database Backups & Snapshot Recovery</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                Generate physical backups of your SQLite state files or restore the database to an older snapshot.
              </p>

              <button onClick={triggerBackup} className="btn btn-primary" style={{ color: '#000', alignSelf: 'flex-start', gap: '8px' }}>
                <RefreshCw size={16} /> Create Backup Snapshot
              </button>

              {backupStatus && (
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--accent-cyan))', fontWeight: '700' }}>{backupStatus}</p>
              )}

              <div style={{ marginTop: '10px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '10px' }}>Available Snapshots:</h4>
                {backups.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>No snapshots created yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {backups.map(back => (
                      <div key={back.filename} className="glass-panel" style={{ padding: '12px 14px', background: 'hsla(220, 20%, 15%, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{back.filename}</span>
                          <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                            Created: {new Date(back.created_at).toLocaleString()} | Size: {(back.sizeBytes / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button onClick={() => triggerRestore(back.filename)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                          Restore Snapshot
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
