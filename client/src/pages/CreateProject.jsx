import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FolderPlus, Calendar, Users, X, AlertCircle, Save } from 'lucide-react';

const CreateProject = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('in_progress');
  const [teamMembers, setTeamMembers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchTeamList();
    }
  }, [token]);

  const fetchTeamList = async () => {
    try {
      const res = await fetch('/api/team', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTeamMembers(await res.json());
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  const handleToggleMember = (userId) => {
    if (assignedUsers.includes(userId)) {
      setAssignedUsers(assignedUsers.filter(id => id !== userId));
    } else {
      setAssignedUsers([...assignedUsers, userId]);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Project name is required.');
      return false;
    }
    if (!deadline) {
      setError('Please select a deadline date.');
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(deadline) < today) {
      setError('Deadline cannot be in the past.');
      return false;
    }
    setError('');
    return true;
  };

  const submitProject = async (overrideStatus = null) => {
    if (!validateForm()) return;
    setLoading(true);

    const projectStatus = overrideStatus || status;

    try {
      // 1. Create project record
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          deadline,
          status: projectStatus
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create project.');
      }

      const { projectId } = await res.json();

      // 2. Assign team members if any
      if (assignedUsers.length > 0) {
        const assignRes = await fetch(`/api/projects/${projectId}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_ids: assignedUsers })
        });
        if (!assignRes.ok) {
          console.warn('Failed to assign team members, but project was created.');
        }
      }

      setLoading(false);
      // If it is draft, redirect to projects. Otherwise details page.
      if (projectStatus === 'pending') {
        navigate('/projects');
      } else {
        navigate(`/projects/${projectId}`);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'left', maxWidth: '680px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderPlus size={28} style={{ color: 'hsl(var(--accent-cyan))' }} /> Create Project
          </h1>
          <p className="page-subtitle">Initiate a new client scope, allocate team resources, and set target schedule milestones.</p>
        </div>
        <button onClick={() => navigate('/projects')} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          Cancel
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{
          padding: '12px 16px',
          borderColor: 'hsla(0, 85%, 60%, 0.3)',
          background: 'hsla(0, 85%, 60%, 0.08)',
          color: 'hsl(0, 85%, 65%)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Area */}
      <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Name input */}
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: '700' }}>Project Name</label>
          <input
            type="text"
            placeholder="e.g. Phoenix Website Redesign"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            required
            style={{ fontSize: '0.95rem', padding: '10px 14px' }}
          />
        </div>

        {/* Description input */}
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: '700' }}>Description / Scope Brief</label>
          <textarea
            placeholder="Provide context, metrics of success, and initial client briefs..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ fontSize: '0.9rem', padding: '10px 14px' }}
          />
        </div>

        {/* Meta Grid: Dates & Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} style={{ color: 'hsl(var(--accent-cyan))' }} /> Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => { setDeadline(e.target.value); setError(''); }}
              required
              style={{ fontSize: '0.9rem', padding: '8px 12px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '700' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ fontSize: '0.9rem', padding: '8px 12px' }}
            >
              <option value="in_progress">In Progress</option>
              <option value="testing">Testing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Team allocation list */}
        <div style={{ borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '20px' }}>
          <label className="form-label" style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Users size={14} style={{ color: 'hsl(var(--accent-cyan))' }} /> Allocate Team Members
          </label>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            {teamMembers.filter(m => m.role !== 'client').map(member => (
              <div 
                key={member.id} 
                onClick={() => handleToggleMember(member.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: assignedUsers.includes(member.id) ? 'hsla(190, 90%, 50%, 0.08)' : 'hsla(220, 20%, 25%, 0.15)',
                  border: assignedUsers.includes(member.id) ? '1px solid hsla(190, 90%, 50%, 0.35)' : '1px solid hsl(var(--border-glass))',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={assignedUsers.includes(member.id)} 
                  readOnly
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', margin: 0 }}>{member.username}</p>
                  <p style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: 0, marginTop: '2px' }}>
                    {member.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          borderTop: '1px solid hsl(var(--border-glass))',
          paddingTop: '20px',
          marginTop: '10px'
        }}>
          <button 
            type="button" 
            onClick={() => submitProject('pending')}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '10px 20px', gap: '8px' }}
          >
            <Save size={14} /> Save Draft
          </button>
          
          <button 
            type="button" 
            onClick={() => submitProject()}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '10px 24px', gap: '8px', color: '#000' }}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>

      </div>

    </div>
  );
};

export default CreateProject;
