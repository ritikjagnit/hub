import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, Clock, CheckCircle } from 'lucide-react';

const Navbar = () => {
  const { user, logout, attendance, logAttendanceAction } = useAuth();

  if (!user) return null;

  return (
    <header className="glass-panel" style={{
      margin: '16px 24px 0 24px',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '12px'
    }}>
      {/* Breadcrumb path */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: 'hsl(var(--accent-cyan))', letterSpacing: '0.5px' }}>
          Project Hub
        </span>
        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>
          / Workspace Console
        </span>
      </div>

      {/* Attendance & User profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Daily Attendance logging */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {attendance.checkedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-badge status-complete" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Active Checked-In ({attendance.checkInTime})
              </span>
              <button 
                onClick={() => logAttendanceAction('check_out')} 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Check Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-badge status-pending" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> Checked-Out {attendance.checkOutTime && `(at ${attendance.checkOutTime})`}
              </span>
              <button 
                onClick={() => logAttendanceAction('check_in')} 
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#000' }}
              >
                Check In
              </button>
            </div>
          )}
        </div>

        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid hsl(var(--border-glass))', paddingLeft: '20px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'hsla(190, 90%, 50%, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--accent-cyan))'
          }}>
            <User size={18} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: '600', lineHeight: 1.2 }}>{user.username}</p>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={logout} 
          className="btn btn-secondary" 
          style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
