import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Plus, ShieldAlert, Award, CalendarDays, X, CheckCircle2, 
  Clock, UserCheck, AlertCircle, RefreshCw, Trash2, Activity, Copy, Link as LinkIcon 
} from 'lucide-react';

const Team = () => {
  const { token, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // Search filter for active members
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('total'); // 'total', 'present', 'active', 'checked_out'

  // Action states (Add by ID, Add by Email, Invite Link, Register & Add)
  const [userIdInput, setUserIdInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  
  // Register & Add states
  const [regNameInput, setRegNameInput] = useState('');
  const [regEmailInput, setRegEmailInput] = useState('');
  const [regPasswordInput, setRegPasswordInput] = useState('');
  const [regRoleInput, setRegRoleInput] = useState('member');

  // Loading states
  const [loadingAddId, setLoadingAddId] = useState(false);
  const [loadingAddEmail, setLoadingAddEmail] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [toast, setToast] = useState(null);
  const [activityLog, setActivityLog] = useState([]);

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (token) {
      fetchTeamList();
      fetchAttendanceLogs();
    }
  }, [token]);

  // Auto-refresh attendance every 30s
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => fetchAttendanceLogs(), 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Search debounce effect for active members (top search bar)
  useEffect(() => {
    if (!token) return;
    if (!activeSearchQuery) {
      fetchTeamList();
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      performActiveSearch(activeSearchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [activeSearchQuery, token]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTeamList = async () => {
    try {
      const res = await fetch('/api/team/members', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setMembers(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchAttendanceLogs = async () => {
    setLoadingAttendance(true);
    try {
      const res = await fetch('/api/team/attendance', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setAttendance(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoadingAttendance(false); }
  };

  const performActiveSearch = async (query) => {
    try {
      const res = await fetch(`/api/team/search?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Action Handlers ──────────────────────────────────────────

  const handleAddById = async (e) => {
    e.preventDefault();
    if (!userIdInput) return;
    setLoadingAddId(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/team/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: userIdInput })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.alreadyOnTeam) {
          showToast(`ℹ️ ${data.message}`, 'info');
          setSuccessMsg(data.message);
          setUserIdInput('');
          fetchTeamList();
        } else {
          showToast('✅ Member added! Notification email sent.');
          setSuccessMsg(`User added successfully. A notification email has been sent to them.`);
          setUserIdInput('');
          fetchTeamList();
          setActivityLog(prev => [{
            action: 'added',
            username: data.username || `User ID ${userIdInput}`,
            role: data.role || 'member',
            time: new Date()
          }, ...prev]);
        }
      } else {
        setErrorMsg(data.message || 'Failed to add user by ID.');
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
    } finally {
      setLoadingAddId(false);
    }
  };

  const handleAddByEmail = async (e) => {
    e.preventDefault();
    if (!emailInput) return;
    setLoadingAddEmail(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/team/add-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.alreadyOnTeam) {
          showToast(`ℹ️ ${data.message}`, 'info');
          setSuccessMsg(data.message);
          setEmailInput('');
          fetchTeamList();
        } else if (data.invited) {
          showToast('✉️ Invitation link sent to email!');
          setSuccessMsg(data.message);
          setEmailInput('');
        } else {
          showToast('✅ Member added! Notification email sent.');
          setSuccessMsg(`User ${emailInput} added successfully. A notification email has been sent to them.`);
          setEmailInput('');
          fetchTeamList();
          setActivityLog(prev => [{
            action: 'added',
            username: data.user?.username || emailInput,
            role: data.user?.role || 'member',
            time: new Date()
          }, ...prev]);
        }
      } else {
        setErrorMsg(data.message || 'Failed to add user by email.');
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
    } finally {
      setLoadingAddEmail(false);
    }
  };

  const handleRegisterAndAdd = async (e) => {
    e.preventDefault();
    setLoadingRegister(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/team/add-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: regNameInput,
          email: regEmailInput,
          password: regPasswordInput,
          role: regRoleInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('👤 Member added & credentials emailed!');
        setSuccessMsg(data.message || `Member has been added and login credentials emailed to ${regEmailInput}.`);
        setRegNameInput('');
        setRegEmailInput('');
        setRegPasswordInput('');
        setRegRoleInput('member');
        fetchTeamList();

        setActivityLog(prev => [{
          action: 'added',
          username: regNameInput || regEmailInput,
          role: regRoleInput,
          time: new Date()
        }, ...prev]);
      } else {
        setErrorMsg(data.message || 'Failed to add member.');
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
    } finally {
      setLoadingRegister(false);
    }
  };

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    setLoadingInvite(true);
    setErrorMsg('');
    setSuccessMsg('');
    setGeneratedInviteLink('');

    try {
      const res = await fetch('/api/team/invite/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: inviteRole })
      });
      const data = await res.json();
      if (res.ok) {
        const link = `${window.location.origin}/invite/join/${data.token}`;
        setGeneratedInviteLink(link);
        showToast('Invite link generated!');
      } else {
        setErrorMsg(data.message || 'Failed to generate invite link.');
      }
    } catch (err) {
      setErrorMsg('Network error generating invite.');
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    showToast('Invite link copied to clipboard!');
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/team/role/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        showToast('✅ Role updated! Notification email sent to member.');
        fetchTeamList();
      } else {
        const data = await res.json();
        showToast('Role update failed: ' + data.message, 'error');
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Are you sure you want to remove "${member.username}" from the team?`)) return;
    try {
      const res = await fetch(`/api/team/remove/${member.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ "${member.username}" removed. Notification email sent.`);
        fetchTeamList();
        setActivityLog(prev => [{
          action: 'deleted',
          username: member.username,
          role: member.role,
          time: new Date()
        }, ...prev]);
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting member', 'error');
    }
  };

  const canEditRole = (member) => {
    if (!user || user.id === member.id) return false;
    return isAdmin;
  };

  const canDeleteMember = (member) => {
    if (!user || user.id === member.id) return false;
    return isAdmin;
  };

  const formatDate = (rawDate) => {
    if (!rawDate) return '—';
    try {
      const d = new Date(rawDate);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return rawDate; }
  };

  const formatTime = (rawTime) => {
    if (!rawTime) return null;
    if (rawTime.includes('T')) {
      try {
        return new Date(rawTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch { return rawTime; }
    }
    return rawTime;
  };

  const getAttendanceStatus = (log) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const logDateStr = log.date
      ? (log.date.includes('T') ? log.date.split('T')[0] : log.date)
      : '';
    const isToday = logDateStr === todayStr;

    if (log.check_in && log.check_out) {
      return { label: 'Present', icon: <CheckCircle2 size={12} />, bg: 'hsla(145,75%,45%,0.15)', color: 'hsl(145,75%,55%)', border: 'hsla(145,75%,45%,0.3)' };
    } else if (log.check_in && !log.check_out && isToday) {
      return { label: 'Active Session', icon: <Clock size={12} />, bg: 'hsla(190,90%,50%,0.15)', color: 'hsl(190,90%,55%)', border: 'hsla(190,90%,50%,0.3)' };
    } else if (log.check_in && !log.check_out && !isToday) {
      return { label: 'Present', icon: <CheckCircle2 size={12} />, bg: 'hsla(145,75%,45%,0.15)', color: 'hsl(145,75%,55%)', border: 'hsla(145,75%,45%,0.3)' };
    } else {
      return { label: 'Absent', icon: <AlertCircle size={12} />, bg: 'hsla(0,85%,60%,0.15)', color: 'hsl(0,85%,65%)', border: 'hsla(0,85%,60%,0.3)' };
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = attendance.filter(l => {
    const d = l.date ? (l.date.includes('T') ? l.date.split('T')[0] : l.date) : '';
    return d === todayStr;
  });
  const presentToday = todayLogs.filter(l => l.check_in).length;
  const activeNow = todayLogs.filter(l => l.check_in && !l.check_out).length;
  const checkedOut = todayLogs.filter(l => l.check_in && l.check_out).length;

  const roleColors = {
    admin: { bg: 'hsla(0,85%,60%,0.1)', color: 'hsl(0,85%,65%)', border: 'hsla(0,85%,60%,0.25)' },
    member: { bg: 'hsla(215,90%,55%,0.1)', color: 'hsl(215,90%,60%)', border: 'hsla(215,90%,55%,0.25)' },
    project_manager: { bg: 'hsla(260,80%,65%,0.1)', color: 'hsl(260,80%,70%)', border: 'hsla(260,80%,65%,0.25)' },
    team_member: { bg: 'hsla(190,90%,50%,0.1)', color: 'hsl(190,90%,55%)', border: 'hsla(190,90%,50%,0.25)' },
    client: { bg: 'hsla(40,90%,55%,0.1)', color: 'hsl(40,90%,60%)', border: 'hsla(40,90%,55%,0.25)' }
  };

  return (
    <div style={{ textAlign: 'left' }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 20px', borderRadius: '12px',
          background: toast.type === 'error'
            ? 'hsla(0,85%,60%,0.15)'
            : toast.type === 'info'
            ? 'hsla(215,90%,55%,0.15)'
            : 'hsla(145,75%,45%,0.15)',
          border: `1px solid ${
            toast.type === 'error'
              ? 'hsla(0,85%,60%,0.4)'
              : toast.type === 'info'
              ? 'hsla(215,90%,55%,0.4)'
              : 'hsla(145,75%,45%,0.4)'
          }`,
          backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.3s ease', maxWidth: '400px'
        }}>
          {toast.type === 'error'
            ? <AlertCircle size={16} color="hsl(0,85%,65%)" />
            : toast.type === 'info'
            ? <AlertCircle size={16} color="hsl(215,90%,60%)" />
            : <CheckCircle2 size={16} color="hsl(145,75%,55%)" />}
          <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-main))', fontWeight: '600' }}>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Team Member Management</h1>
          <p className="page-subtitle">Add team members via User ID or Email, register new users, generate invite links, and manage roles.</p>
        </div>
      </div>

      {/* Inline Notifications */}
      {errorMsg && (
        <div style={{ background: 'hsla(0,85%,60%,0.1)', color: 'hsl(var(--status-high))', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '24px', border: '1px solid hsla(0,85%,60%,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ background: 'hsla(145,75%,45%,0.1)', color: 'hsl(var(--status-complete))', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '24px', border: '1px solid hsla(145,75%,45%,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={15} /> {successMsg}
        </div>
      )}

      {/* Attendance Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { id: 'total', icon: <Users size={18} />, label: "Total Active", value: members.length, color: 'hsl(var(--accent-blue))', bg: 'hsla(215,90%,55%,0.1)' },
          { id: 'present', icon: <UserCheck size={18} />, label: "Present Today", value: presentToday, color: 'hsl(var(--status-complete))', bg: 'hsla(145,75%,45%,0.1)' },
          { id: 'active', icon: <Clock size={18} />, label: "Active Now", value: activeNow, color: 'hsl(var(--accent-cyan))', bg: 'hsla(190,90%,50%,0.1)' },
          { id: 'checked_out', icon: <CheckCircle2 size={18} />, label: "Checked Out", value: checkedOut, color: 'hsl(var(--status-pending))', bg: 'hsla(40,90%,55%,0.1)' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="glass-panel stat-card" 
            onClick={() => setStatusFilter(stat.id)}
            style={{ 
              padding: '18px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '14px',
              cursor: 'pointer',
              border: statusFilter === stat.id ? `1px solid ${stat.color}` : '1px solid hsla(0,0%,100%,0.05)',
              transition: 'all 0.2s ease',
              boxShadow: statusFilter === stat.id ? `0 0 15px ${stat.color}33` : 'none',
              transform: statusFilter === stat.id ? 'translateY(-2px)' : 'none'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: '800', color: stat.color, margin: 0, lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '3px' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Operations Grid */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          
          {/* Register & Add User Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} color="hsl(var(--accent-cyan))" /> Add New Member
            </h3>
            <form onSubmit={handleRegisterAndAdd}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vishwajit Kapse"
                  value={regNameInput}
                  onChange={(e) => setRegNameInput(e.target.value)}
                  style={{ borderRadius: '8px' }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Email</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={regEmailInput}
                  onChange={(e) => setRegEmailInput(e.target.value)}
                  style={{ borderRadius: '8px' }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Password</label>
                <input
                  type="password"
                  placeholder="Password for new member"
                  value={regPasswordInput}
                  onChange={(e) => setRegPasswordInput(e.target.value)}
                  style={{ borderRadius: '8px' }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Role</label>
                <select value={regRoleInput} onChange={(e) => setRegRoleInput(e.target.value)} style={{ borderRadius: '8px' }}>
                  <option value="member">Member</option>
                  <option value="team_member">Team Member</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loadingRegister}
                style={{ width: '100%', justifyContent: 'center', color: '#000', borderRadius: '8px' }}
              >
                {loadingRegister ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Add & Email Credentials'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Directory Table Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <ShieldAlert size={17} color="hsl(var(--accent-cyan))" /> Employee Directory
          </h3>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <input
              type="text"
              placeholder="Search team members by name or email..."
              value={activeSearchQuery}
              onChange={(e) => setActiveSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', borderRadius: '8px', fontSize: '0.8rem' }}
            />
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }}>
              <Users size={14} />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredMembers = members.filter(member => {
                  if (activeSearchQuery) {
                    const q = activeSearchQuery.toLowerCase();
                    const nameMatch = member.username && member.username.toLowerCase().includes(q);
                    const emailMatch = member.email && member.email.toLowerCase().includes(q);
                    if (!nameMatch && !emailMatch) return false;
                  }

                  if (statusFilter === 'total') return true;
                  const todayLog = todayLogs.find(l => l.user_id === member.id);
                  if (statusFilter === 'present') return todayLog && todayLog.check_in;
                  if (statusFilter === 'active') return todayLog && todayLog.check_in && !todayLog.check_out;
                  if (statusFilter === 'checked_out') return todayLog && todayLog.check_in && todayLog.check_out;
                  return true;
                });

                if (filteredMembers.length === 0) {
                  return (
                    <tr>
                      <td colSpan={isAdmin ? 4 : 3} style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontStyle: 'italic', padding: '24px' }}>
                        No team members match this filter.
                      </td>
                    </tr>
                  );
                }

                return filteredMembers.map(member => {
                  const rc = roleColors[member.role] || roleColors.member;
                  const initial = member.username ? member.username.charAt(0).toUpperCase() : 'U';
                  const todayLog = todayLogs.find(l => l.user_id === member.id);
                  const isActive = todayLog && todayLog.check_in && !todayLog.check_out;
                  const isPresent = todayLog && todayLog.check_in;

                  return (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {/* Avatar with status dot */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-cyan)))',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.85rem', fontWeight: '800', color: '#0c0e14'
                            }}>
                              {initial}
                            </div>
                            <div style={{
                              position: 'absolute', bottom: '-1px', right: '-1px',
                              width: '10px', height: '10px', borderRadius: '50%',
                              background: isActive ? 'hsl(145,75%,50%)' : isPresent ? 'hsl(40,90%,55%)' : 'hsl(var(--text-muted))',
                              border: '2px solid hsl(var(--bg-secondary))'
                            }} />
                          </div>
                          <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>{member.username}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                        {member.email}
                      </td>
                      <td>
                        {canEditRole(member) ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            style={{ 
                              fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', width: '120px',
                              background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, fontWeight: '700' 
                            }}
                          >
                            <option value="member">Member</option>
                            <option value="team_member">Team Member</option>
                            <option value="project_manager">Project Manager</option>
                            <option value="client">Client</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span style={{
                            fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px', display: 'inline-block',
                            background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, fontWeight: '700',
                            textTransform: 'uppercase', letterSpacing: '0.3px'
                          }}>
                            {member.role.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td>
                          {canDeleteMember(member) ? (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '6px',
                                background: 'hsla(0,85%,60%,0.08)',
                                border: '1px solid hsla(0,85%,60%,0.2)',
                                color: 'hsl(0,85%,65%)', fontSize: '0.75rem',
                                fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'hsla(0,85%,60%,0.18)';
                                e.currentTarget.style.borderColor = 'hsla(0,85%,60%,0.45)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'hsla(0,85%,60%,0.08)';
                                e.currentTarget.style.borderColor = 'hsla(0,85%,60%,0.2)';
                              }}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          ) : (
                            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Tracker Log Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
            <CalendarDays size={17} color="hsl(var(--accent-cyan))" /> Daily Check-In Attendance Tracker
          </h3>
          <button
            onClick={fetchAttendanceLogs}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
          >
            <RefreshCw size={13} style={{ animation: loadingAttendance ? 'spin 1s linear infinite' : 'none' }} />
            Refresh Logs
          </button>
        </div>

        {loadingAttendance ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
            Loading attendance records...
          </div>
        ) : attendance.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontStyle: 'italic' }}>
            No attendance records found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Work Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Presence Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((log, i) => {
                const status = getAttendanceStatus(log);
                const checkOut = formatTime(log.check_out);
                return (
                  <tr key={log.id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-cyan)))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: '800', color: '#0c0e14'
                        }}>
                          {log.username ? log.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>{log.username || '—'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                      {formatDate(log.date)}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {formatTime(log.check_in) ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'hsl(var(--status-complete))' }}>
                          <CheckCircle2 size={13} /> {formatTime(log.check_in)}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {checkOut ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'hsl(var(--status-pending))' }}>
                          <Clock size={13} /> {checkOut}
                        </span>
                      ) : (
                        <span style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic', fontSize: '0.8rem' }}>Not checked out</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem',
                        fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px',
                        background: status.bg, color: status.color, border: `1px solid ${status.border}`
                      }}>
                        {status.icon} {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Activity Log Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={17} color="hsl(var(--accent-cyan))" /> Team Activity Log
          <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'hsl(var(--text-muted))', background: 'hsla(220,20%,25%,0.5)', padding: '2px 8px', borderRadius: '20px', marginLeft: '4px' }}>
            This session
          </span>
        </h3>

        {activityLog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontStyle: 'italic' }}>
            No add or delete actions yet in this session.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activityLog.map((log, idx) => {
              const isAdd = log.action === 'added';
              const timeStr = log.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const dateStr = log.time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: isAdd ? 'hsla(145,75%,45%,0.06)' : 'hsla(0,85%,60%,0.06)',
                  border: `1px solid ${isAdd ? 'hsla(145,75%,45%,0.2)' : 'hsla(0,85%,60%,0.2)'}`
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'hsl(var(--text-main))' }}>
                        {log.username}
                      </span>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: '700', padding: '1px 7px', borderRadius: '20px',
                        background: isAdd ? 'hsla(145,75%,45%,0.15)' : 'hsla(0,85%,60%,0.15)',
                        color: isAdd ? 'hsl(145,75%,55%)' : 'hsl(0,85%,65%)',
                        textTransform: 'uppercase'
                      }}>
                        {isAdd ? '+ Added' : '✕ Removed'}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--text-muted))' }}>{timeStr}</div>
                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>{dateStr}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Team;
