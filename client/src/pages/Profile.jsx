import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Clock, CheckCircle2, FolderKanban, Edit3, Key, Save, X, AlertCircle, CheckCircle, Activity, TrendingUp, Calendar } from 'lucide-react';

const Profile = () => {
  const { user, token } = useAuth();
  const [userTasks, setUserTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTab, setEditTab] = useState('info');
  const [formData, setFormData] = useState({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => { setLocalUser(user); }, [user]);

  useEffect(() => {
    if (token && user) {
      fetchAll();
    }
  }, [token, user]);

  const fetchAll = async () => {
    try {
      const [tasksRes, timeRes] = await Promise.all([
        fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/team/time', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (tasksRes.ok) {
        const all = await tasksRes.json();
        setUserTasks(all.filter(t => t.assigned_to === user.id));
      }
      if (timeRes.ok) {
        const tl = await timeRes.json();
        setTimeLogs(tl.filter(l => l.user_id === user.id).slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    if (editTab === 'password') {
      if (formData.newPassword !== formData.confirmPassword) {
        showToast('Passwords do not match', 'error'); return;
      }
      if (formData.newPassword && formData.newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error'); return;
      }
    }
    setSaving(true);
    try {
      const body = editTab === 'info'
        ? { username: formData.username }
        : { currentPassword: formData.currentPassword, newPassword: formData.newPassword };

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Update failed', 'error'); return; }
      if (data.user) setLocalUser(data.user);
      showToast(data.message || 'Profile updated!');
      setShowEditModal(false);
      setFormData({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !localUser) return null;

  const total = userTasks.length;
  const completed = userTasks.filter(t => t.status === 'completed').length;
  const active = userTasks.filter(t => t.status === 'in_progress').length;
  const pending = userTasks.filter(t => t.status === 'pending').length;
  const testing = userTasks.filter(t => t.status === 'testing').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalHours = timeLogs.reduce((acc, l) => acc + (l.duration_seconds || 0), 0);
  const hrs = Math.floor(totalHours / 3600);
  const mins = Math.floor((totalHours % 3600) / 60);

  const joinedDate = localUser.created_at
    ? new Date(localUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const roleColors = {
    admin: { bg: 'hsla(0,85%,60%,0.12)', color: 'hsl(0,85%,65%)', border: 'hsla(0,85%,60%,0.3)' },
    project_manager: { bg: 'hsla(260,80%,65%,0.12)', color: 'hsl(260,80%,70%)', border: 'hsla(260,80%,65%,0.3)' },
    team_member: { bg: 'hsla(190,90%,50%,0.12)', color: 'hsl(190,90%,55%)', border: 'hsla(190,90%,50%,0.3)' },
    client: { bg: 'hsla(40,90%,55%,0.12)', color: 'hsl(40,90%,60%)', border: 'hsla(40,90%,55%,0.3)' },
  };
  const rc = roleColors[localUser.role] || roleColors.team_member;

  const statusStyle = {
    completed: { bg: 'hsla(145,75%,45%,0.15)', color: 'hsl(145,75%,50%)' },
    in_progress: { bg: 'hsla(195,90%,55%,0.15)', color: 'hsl(195,90%,60%)' },
    pending: { bg: 'hsla(40,90%,55%,0.15)', color: 'hsl(40,90%,60%)' },
    testing: { bg: 'hsla(270,85%,65%,0.15)', color: 'hsl(270,85%,70%)' },
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 20px', borderRadius: '12px',
          background: toast.type === 'error' ? 'hsla(0,85%,60%,0.15)' : 'hsla(145,75%,45%,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'hsla(0,85%,60%,0.4)' : 'hsla(145,75%,45%,0.4)'}`,
          backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} color="hsl(0,85%,65%)" /> : <CheckCircle size={16} color="hsl(145,75%,55%)" />}
          <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-main))', fontWeight: '600' }}>{toast.msg}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information, credentials, and review your task deliverables.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setFormData({ username: localUser.username, currentPassword: '', newPassword: '', confirmPassword: '' }); setEditTab('info'); setShowEditModal(true); }} style={{ marginTop: '8px' }}>
          <Edit3 size={14} /> Edit Profile
        </button>
      </div>

      {/* Top Profile Hero Card */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, hsla(190,90%,50%,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Avatar */}
        <div style={{
          width: '96px', height: '96px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-cyan)))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.8rem', fontWeight: '800', color: '#0c0e14', textTransform: 'uppercase',
          boxShadow: '0 0 30px hsla(190,90%,50%,0.3), 0 8px 20px rgba(0,0,0,0.4)',
          position: 'relative'
        }}>
          {localUser.username ? localUser.username.charAt(0) : 'U'}
          <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '16px', height: '16px', borderRadius: '50%', background: 'hsl(145,75%,45%)', border: '2px solid hsl(var(--bg-secondary))' }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'hsl(var(--text-main))', marginBottom: '6px' }}>{localUser.username}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
              {localUser.role.replace(/_/g, ' ')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
              <Mail size={12} /> {localUser.email}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
              <Calendar size={12} /> Joined {joinedDate}
            </span>
          </div>
        </div>

        {/* Completion ring */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: '80px', height: '80px' }}>
            <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="32" fill="none" stroke="hsla(190,90%,50%,0.1)" strokeWidth="6" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(190,90%,50%)" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - completionRate / 100)}`}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'hsl(var(--text-main))' }}>{completionRate}%</span>
            </div>
          </div>
          <p style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '4px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completion</p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {[
          { icon: <FolderKanban size={18} />, label: 'Total Tasks', value: total, color: 'hsl(var(--accent-blue))', bg: 'hsla(215,90%,55%,0.1)' },
          { icon: <CheckCircle2 size={18} />, label: 'Completed', value: completed, color: 'hsl(var(--status-complete))', bg: 'hsla(145,75%,45%,0.1)' },
          { icon: <Activity size={18} />, label: 'In Progress', value: active, color: 'hsl(var(--status-progress))', bg: 'hsla(195,90%,55%,0.1)' },
          { icon: <Clock size={18} />, label: 'Pending', value: pending, color: 'hsl(var(--status-pending))', bg: 'hsla(40,90%,55%,0.1)' },
          { icon: <TrendingUp size={18} />, label: 'Testing', value: testing, color: 'hsl(var(--status-testing))', bg: 'hsla(270,85%,65%,0.1)' },
          { icon: <Clock size={18} />, label: 'Hours Logged', value: `${hrs}h ${mins}m`, color: 'hsl(var(--accent-cyan))', bg: 'hsla(190,90%,50%,0.1)' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: '800', color: stat.color, margin: 0, lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '4px' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', alignItems: 'start' }}>

        {/* Account Details card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'hsl(var(--text-main))', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} color="hsl(var(--accent-cyan))" /> Account Details
          </h3>
          {[
            { icon: <Mail size={14} />, label: 'Email Address', value: localUser.email },
            { icon: <Shield size={14} />, label: 'Role', value: localUser.role === 'admin' ? 'Administrator' : localUser.role === 'project_manager' ? 'Project Manager' : localUser.role === 'team_member' ? 'Team Member' : 'Client' },
            { icon: <User size={14} />, label: 'Account ID', value: `USR-${String(localUser.id).padStart(4, '0')}` },
            { icon: <Calendar size={14} />, label: 'Member Since', value: joinedDate },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0', borderBottom: i < 3 ? '1px solid hsl(var(--border-glass))' : 'none' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsla(190,90%,50%,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--accent-cyan))', flexShrink: 0 }}>
                {row.icon}
              </div>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px', margin: '0 0 2px' }}>{row.label}</p>
                <p style={{ fontSize: '0.88rem', color: 'hsl(var(--text-main))', fontWeight: '600', margin: 0 }}>{row.value}</p>
              </div>
            </div>
          ))}
          <button className="btn btn-secondary" onClick={() => { setFormData({ username: localUser.username, currentPassword: '', newPassword: '', confirmPassword: '' }); setEditTab('password'); setShowEditModal(true); }} style={{ width: '100%', marginTop: '16px', justifyContent: 'center', fontSize: '0.82rem' }}>
            <Key size={13} /> Change Password
          </button>
        </div>

        {/* My Tasks */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'hsl(var(--text-main))', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="hsl(var(--accent-cyan))" /> My Assigned Tasks
          </h3>
          {loadingTasks ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>Loading tasks...</div>
          ) : userTasks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontStyle: 'italic' }}>No tasks assigned to you yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
              {userTasks.map((t, i) => {
                const ss = statusStyle[t.status] || statusStyle.pending;
                return (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'hsla(220,20%,16%,0.5)', border: '1px solid hsl(var(--border-glass))', borderRadius: '10px', transition: 'all 0.2s', animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsla(190,90%,50%,0.3)'; e.currentTarget.style.background = 'hsla(220,20%,20%,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--border-glass))'; e.currentTarget.style.background = 'hsla(220,20%,16%,0.5)'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.83rem', fontWeight: '700', color: 'hsl(var(--text-main))', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</p>
                      <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', margin: 0 }}>{t.project_name || 'General'}</p>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '700', textTransform: 'capitalize', background: ss.bg, color: ss.color, flexShrink: 0, marginLeft: '8px' }}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowEditModal(false); } }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '460px', padding: '28px', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'hsl(var(--text-main))' }}>Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', padding: '4px', background: 'hsla(220,20%,12%,0.5)', borderRadius: '10px' }}>
              {['info', 'password'].map(tab => (
                <button key={tab} onClick={() => setEditTab(tab)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', textTransform: 'capitalize', transition: 'all 0.2s', background: editTab === tab ? 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-cyan)))' : 'transparent', color: editTab === tab ? '#0c0e14' : 'hsl(var(--text-muted))' }}>
                  {tab === 'info' ? '👤 Info' : '🔐 Password'}
                </button>
              ))}
            </div>

            {editTab === 'info' ? (
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} placeholder="Enter new username" />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" value={formData.currentPassword} onChange={e => setFormData(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Enter current password" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" value={formData.newPassword} onChange={e => setFormData(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 6 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
