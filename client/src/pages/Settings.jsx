import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, ShieldCheck, Database, Sliders, BellRing, RefreshCw } from 'lucide-react';

const Settings = () => {
  const { token, logout } = useAuth();
  
  // Notification states
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [accentTheme, setAccentTheme] = useState('cyan');
  
  // Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isResettingDb, setIsResettingDb] = useState(false);

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match');
      return;
    }
    if (newPass.length < 6) {
      setPassError('Password must be at least 6 characters');
      return;
    }

    // Simulate password updates
    setPassSuccess('Security credentials successfully updated!');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const handleRestoreDatabase = async () => {
    if (!window.confirm('WARNING: Wiping the database will drop all tables and seed default demo accounts. You will be signed out. Proceed?')) return;
    
    setIsResettingDb(true);
    try {
      const response = await fetch('/api/team/reset-database', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert('SQLite relational database successfully reset and seeded!');
        logout(); // Kick back to login
      } else {
        alert('Failed to reset database.');
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering database reset');
    } finally {
      setIsResettingDb(false);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <h1 className="page-title">Workspace Settings</h1>
      <p className="page-subtitle">Configure developer triggers, edit authentication keys, or reset database parameters.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Left Column: System & Theme settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Accent theme selection */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} style={{ color: 'hsl(var(--accent-cyan))' }} /> Accent Preferences
            </h3>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Theme Accents</label>
              <select value={accentTheme} onChange={(e) => setAccentTheme(e.target.value)}>
                <option value="cyan">Vibrant Cyan (Default)</option>
                <option value="blue">Sapphire Blue</option>
                <option value="purple">Neon Purple</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'hsla(220, 20%, 25%, 0.15)', borderRadius: '8px' }}>
              <BellRing size={16} style={{ color: 'hsl(var(--accent-cyan))', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Desktop Notifications</span>
                <input 
                  type="checkbox" 
                  checked={allowNotifications} 
                  onChange={() => setAllowNotifications(!allowNotifications)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Database Control */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} style={{ color: 'hsl(var(--status-high))' }} /> System Parameters
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4, marginBottom: '16px' }}>
              Wipe and reset all SQLite tables. Ideal for returning to the clean seeding state for verification.
            </p>

            <button 
              onClick={handleRestoreDatabase} 
              disabled={isResettingDb}
              className="btn btn-danger" 
              style={{ width: '100%', justifyContent: 'center', padding: '10px', gap: '8px' }}
            >
              {isResettingDb ? <RefreshCw size={14} className="spin-animation" /> : <RefreshCw size={14} />}
              Restore Default Database
            </button>
          </div>

        </div>

        {/* Right Column: Password security */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ color: 'hsl(var(--accent-cyan))' }} /> Security Credentials
          </h3>

          {passError && (
            <div className="status-badge" style={{ background: 'hsla(0, 85%, 60%, 0.1)', color: 'hsl(var(--status-high))', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '12px', width: '100%' }}>
              {passError}
            </div>
          )}

          {passSuccess && (
            <div className="status-badge status-complete" style={{ padding: '8px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '12px', width: '100%' }}>
              {passSuccess}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={currentPass} 
                onChange={(e) => setCurrentPass(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={newPass} 
                onChange={(e) => setNewPass(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={confirmPass} 
                onChange={(e) => setConfirmPass(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px', color: '#000' }}>
              Update Security Keys
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Settings;
