import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ListTodo, Calendar, User, Folder, AlertCircle, Save } from 'lucide-react';

const CreateTask = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pending');

  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchTeamList();
    }
  }, [token]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeamList = async () => {
    try {
      const res = await fetch('/api/team', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTeamMembers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get users for selected project, or fall back to all team members
  const getAvailableAssignees = () => {
    if (!projectId) return teamMembers.filter(m => m.role !== 'client');
    const selectedProj = projects.find(p => p.id === parseInt(projectId));
    if (selectedProj && selectedProj.members && selectedProj.members.length > 0) {
      return selectedProj.members.filter(m => m.role !== 'client');
    }
    return teamMembers.filter(m => m.role !== 'client');
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Task title is required.');
      return false;
    }
    if (!projectId) {
      setError('Please select a project.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (overrideStatus = null) => {
    if (!validateForm()) return;
    setLoading(true);

    const taskStatus = overrideStatus || status;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          status: taskStatus,
          due_date: dueDate || null,
          assigned_to: assignedTo ? parseInt(assignedTo) : null,
          project_id: parseInt(projectId)
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create task.');
      }

      const data = await res.json();
      setLoading(false);

      if (taskStatus === 'pending') {
        navigate('/tasks');
      } else {
        navigate(`/tasks/${data.taskId}`);
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
            <ListTodo size={28} style={{ color: 'hsl(var(--accent-cyan))' }} /> Create Task
          </h1>
          <p className="page-subtitle">Schedule individual actions, associate them with a project scope, and assign deliverables.</p>
        </div>
        <button onClick={() => navigate('/tasks')} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
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

      {/* Form Card */}
      <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Task Title */}
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: '700' }}>Task Title</label>
          <input
            type="text"
            placeholder="e.g. Design Login Page UI"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            required
            style={{ fontSize: '0.95rem', padding: '10px 14px' }}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: '700' }}>Description</label>
          <textarea
            placeholder="Outline task details, subtasks requirements, or notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ fontSize: '0.9rem', padding: '10px 14px' }}
          />
        </div>

        {/* Project Select */}
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Folder size={14} style={{ color: 'hsl(var(--accent-cyan))' }} /> Select Project
          </label>
          <select
            value={projectId}
            onChange={(e) => { setProjectId(e.target.value); setAssignedTo(''); setError(''); }}
            required
            style={{ fontSize: '0.9rem', padding: '8px 12px' }}
          >
            <option value="">Choose Project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* User Select & Priority Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} style={{ color: 'hsl(var(--accent-cyan))' }} /> Assignee
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              style={{ fontSize: '0.9rem', padding: '8px 12px' }}
            >
              <option value="">Unassigned</option>
              {getAvailableAssignees().map(member => (
                <option key={member.user_id || member.id} value={member.user_id || member.id}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '700' }}>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ fontSize: '0.9rem', padding: '8px 12px' }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Due Date & Initial Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} style={{ color: 'hsl(var(--accent-cyan))' }} /> Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="testing">Testing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Footer buttons */}
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
            onClick={() => handleSubmit('pending')}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '10px 20px', gap: '8px' }}
          >
            <Save size={14} /> Save Draft
          </button>
          
          <button 
            type="button" 
            onClick={() => handleSubmit()}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '10px 24px', gap: '8px', color: '#000' }}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>

      </div>

    </div>
  );
};

export default CreateTask;
