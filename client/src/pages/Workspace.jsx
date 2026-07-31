import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, MapPin, Mail, Plus, X, Edit, Briefcase, FileSpreadsheet } from 'lucide-react';

const Workspace = () => {
  const { token, user } = useAuth();
  const [org, setOrg] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMessage, setInviteMessage] = useState('');

  // Creation states
  const [newTeamName, setNewTeamName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  // Edit employee state
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [editDeptId, setEditDeptId] = useState('');

  useEffect(() => {
    if (token) {
      fetchMyOrg();
      fetchEmployees();
      fetchTeams();
      fetchDepartments();
    }
  }, [token]);

  const fetchMyOrg = async () => {
    try {
      const res = await fetch('/api/workspace/org/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOrg(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/workspace/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setEmployees(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/workspace/team', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTeams(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/workspace/department', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDepartments(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });

      if (res.ok) {
        setInviteMessage(`Invitation successfully broadcast to ${inviteEmail}!`);
        setInviteEmail('');
      } else {
        setInviteMessage('Failed to deliver invitation.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const res = await fetch('/api/workspace/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTeamName })
      });

      if (res.ok) {
        setNewTeamName('');
        setIsTeamModalOpen(false);
        fetchTeams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      const res = await fetch('/api/workspace/department', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newDeptName })
      });

      if (res.ok) {
        setNewDeptName('');
        setIsDeptModalOpen(false);
        fetchDepartments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/workspace/employees/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: editingEmployee.id,
          role: editRole,
          team_id: editTeamId ? parseInt(editTeamId) : null,
          department_id: editDeptId ? parseInt(editDeptId) : null
        })
      });

      if (res.ok) {
        setEditingEmployee(null);
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const canManageWorkspace = user && ['admin', 'project_manager', 'manager'].includes(user.role);

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Workspace Directory</h1>
        <p className="page-subtitle">Manage organizational teams, structure departments, align roles, and invite employees.</p>
      </div>

      {org && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, hsla(190, 90%, 50%, 0.05), transparent)' }}>
          <Shield size={24} style={{ color: 'hsl(var(--accent-cyan))' }} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>Organization: {org.name}</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Enterprise Workspace Tenant isolation active</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Invite portal */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px', color: '#fff' }}>Invite Workspace Member</h3>
          <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Workspace Role</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="member">Employee / Member</option>
                <option value="manager">Workspace Manager</option>
                <option value="client">Client Portal Access</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ color: '#000', justifyContent: 'center' }}>
              Send Invitation Link
            </button>
            {inviteMessage && (
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--accent-cyan))', marginTop: '6px', textAlign: 'center' }}>{inviteMessage}</p>
            )}
          </form>
        </div>

        {/* Teams and Departments */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700' }}>Teams</h4>
              {canManageWorkspace && (
                <button onClick={() => setIsTeamModalOpen(true)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}>
                  <Plus size={12} /> Add Team
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {teams.length === 0 ? <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>No teams configured.</p> :
                teams.map(t => (
                  <span key={t.id} style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'hsla(220, 20%, 20%, 0.5)', border: '1px solid hsl(var(--border-glass))', borderRadius: '4px' }}>
                    {t.name}
                  </span>
                ))
              }
            </div>
          </div>

          <div style={{ borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700' }}>Departments</h4>
              {canManageWorkspace && (
                <button onClick={() => setIsDeptModalOpen(true)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}>
                  <Plus size={12} /> Add Dept
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {departments.length === 0 ? <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>No departments configured.</p> :
                departments.map(d => (
                  <span key={d.id} style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'hsla(220, 20%, 20%, 0.5)', border: '1px solid hsl(var(--border-glass))', borderRadius: '4px' }}>
                    {d.name}
                  </span>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Employees list table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>Employee Directory</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border-glass))', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px' }}>Name</th>
              <th style={{ padding: '10px' }}>Email</th>
              <th style={{ padding: '10px' }}>Role</th>
              <th style={{ padding: '10px' }}>Team</th>
              <th style={{ padding: '10px' }}>Department</th>
              {canManageWorkspace && <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid hsl(var(--border-glass))', fontSize: '0.85rem' }}>
                <td style={{ padding: '12px 10px', fontWeight: '700', color: '#fff' }}>{emp.username}</td>
                <td style={{ padding: '12px 10px' }}>{emp.email}</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'hsla(190, 90%, 55%, 0.1)', color: 'hsl(var(--accent-cyan))', fontWeight: '700' }}>
                    {emp.role.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px 10px', color: 'hsl(var(--text-muted))' }}>{emp.Team?.name || '—'}</td>
                <td style={{ padding: '12px 10px', color: 'hsl(var(--text-muted))' }}>{emp.Department?.name || '—'}</td>
                {canManageWorkspace && (
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <button 
                      onClick={() => {
                        setEditingEmployee(emp);
                        setEditRole(emp.role);
                        setEditTeamId(emp.Team?.id || '');
                        setEditDeptId(emp.Department?.id || '');
                      }}
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Edit size={12} /> Align
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE TEAM MODAL */}
      {isTeamModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Create Team</h3>
              <button onClick={() => setIsTeamModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Team Name</label>
                <input type="text" placeholder="e.g. Frontend Squad" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>
                Create Team
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DEPT MODAL */}
      {isDeptModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Create Department</h3>
              <button onClick={() => setIsDeptModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateDept}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Department Name</label>
                <input type="text" placeholder="e.g. Engineering" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>
                Create Department
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ALIGN EMPLOYEE DETAILS MODAL */}
      {editingEmployee && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Align Employee Details: {editingEmployee.username}</h3>
              <button onClick={() => setEditingEmployee(null)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Role Definition</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="member">Employee / Member</option>
                  <option value="manager">Workspace Manager</option>
                  <option value="admin">System Administrator</option>
                  <option value="client">Client Portal Access</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Team</label>
                <select value={editTeamId} onChange={(e) => setEditTeamId(e.target.value)}>
                  <option value="">No Team</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Department</label>
                <select value={editDeptId} onChange={(e) => setEditDeptId(e.target.value)}>
                  <option value="">No Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000', marginTop: '10px' }}>
                Save Profile Configuration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;
