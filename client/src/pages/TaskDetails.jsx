import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ListTodo, Calendar, User, Folder, AlertTriangle, ArrowLeft, CheckCircle2, MessageSquare, Send, CheckSquare, Edit, Save, Trash2, X } from 'lucide-react';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const [task, setTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('pending');

  // Comments and subtasks
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [subtasksList, setSubtasksList] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token && id) {
      fetchTaskDetails();
      fetchProjects();
      fetchTeamList();
    }
  }, [token, id]);

  useEffect(() => {
    // If route contains ?edit=true, activate edit mode
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [location.search]);

  const fetchTaskDetails = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setComments(data.comments || []);
        setSubtasksList(data.subtasks ? JSON.parse(data.subtasks) : []);

        // Populate edit states
        setEditTitle(data.title);
        setEditDesc(data.description || '');
        setEditProjectId(data.project_id || '');
        setEditAssignedTo(data.assigned_to || '');
        setEditPriority(data.priority);
        setEditDueDate(data.due_date ? data.due_date.split('T')[0] : '');
        setEditStatus(data.status);
      } else {
        navigate('/tasks');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateTask = async (e) => {
    if (e) e.preventDefault();
    if (!editTitle.trim()) return setError('Task title is required.');
    if (!editProjectId) return setError('Task project is required.');
    
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
          project_id: parseInt(editProjectId),
          assigned_to: editAssignedTo ? parseInt(editAssignedTo) : null,
          priority: editPriority,
          due_date: editDueDate || null,
          status: editStatus
        })
      });

      if (res.ok) {
        setIsEditing(false);
        setError('');
        fetchTaskDetails();
      } else {
        const errData = await res.json();
        setError(errData.message || 'Update failed.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        navigate('/tasks');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (res.ok) {
        setNewComment('');
        fetchTaskDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    const newSubItem = {
      id: Date.now(),
      title: newSubtask.trim(),
      completed: false
    };

    const updatedList = [...subtasksList, newSubItem];
    const updatedStr = JSON.stringify(updatedList);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subtasks: updatedStr })
      });
      if (res.ok) {
        setNewSubtask('');
        setSubtasksList(updatedList);
        // Refresh local details too
        fetchTaskDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subId) => {
    const updatedList = subtasksList.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
    const updatedStr = JSON.stringify(updatedList);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subtasks: updatedStr })
      });
      if (res.ok) {
        setSubtasksList(updatedList);
        fetchTaskDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isManager = user && (user.role === 'admin' || user.role === 'project_manager' || user.role === 'team_member' || user.role === 'member');
  const canDeleteTask = user && ['admin', 'project_manager'].includes(user.role);
  const canEditTask = user && ['admin', 'project_manager', 'team_member', 'member'].includes(user.role);

  if (loading) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading task deliverables details...</div>;
  }

  if (!task) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Task not found.</div>;
  }

  // Calculate subtasks completions
  const completedSubs = subtasksList.filter(s => s.completed).length;
  const progressPct = subtasksList.length > 0 ? Math.round((completedSubs / subtasksList.length) * 100) : (task.status === 'completed' ? 100 : 0);

  return (
    <div style={{ textAlign: 'left', maxWidth: '880px', margin: '0 auto' }}>
      
      {/* Back navigation */}
      <button 
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none', color: 'hsl(var(--accent-cyan))',
          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem',
          fontWeight: '700', cursor: 'pointer', marginBottom: '16px', padding: 0
        }}
      >
        <ArrowLeft size={16} /> Go Back
      </button>

      {/* Main Details Panel */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', position: 'relative' }}>
        
        {/* Toggle Form / Details Display */}
        {!isEditing ? (
          <div>
            {/* Header tags */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`status-badge status-${task.status}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span className={`task-priority-badge priority-${task.priority}`} style={{ margin: 0 }}>
                  {task.priority} Priority
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {canEditTask && (
                  <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}>
                    <Edit size={12} /> Edit Task
                  </button>
                )}
                {canDeleteTask && (
                  <button onClick={handleDeleteTask} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>

            {/* Task Name */}
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', margin: 0, marginBottom: '8px', lineHeight: 1.25 }}>
              {task.title}
            </h2>
            
            {/* Project connection link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginBottom: '20px' }}>
              <Folder size={14} style={{ color: 'hsl(var(--accent-cyan))' }} />
              <span>Project: </span>
              <span 
                onClick={() => navigate(`/projects/${task.project_id}`)}
                style={{ color: 'hsl(var(--accent-cyan))', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {task.project_name || `ID ${task.project_id}`}
              </span>
            </div>

            {/* Description box */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.92rem', color: '#fff', lineHeight: 1.65, margin: 0, background: 'hsla(220, 20%, 25%, 0.15)', padding: '16px 20px', borderRadius: '12px', border: '1px solid hsl(var(--border-glass))' }}>
                {task.description || 'No description or scope brief provided.'}
              </p>
            </div>

            {/* Meta Row: Assignee & Schedule */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '20px' }}>
              
              {/* Assignee Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'hsla(220, 20%, 16%, 0.4)', borderRadius: '10px', border: '1px solid hsl(var(--border-glass))' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-purple)))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: '800', color: '#fff', flexShrink: 0
                }}>
                  {(task.assigned_to_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: 0 }}>Assigned To</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', margin: 0, marginTop: '2px' }}>{task.assigned_to_name || 'Unassigned'}</p>
                </div>
              </div>

              {/* Schedule due date Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'hsla(220, 20%, 16%, 0.4)', borderRadius: '10px', border: '1px solid hsl(var(--border-glass))' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'hsla(190, 90%, 50%, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'hsl(var(--accent-cyan))', flexShrink: 0
                }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: 0 }}>Target Due Date</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', margin: 0, marginTop: '2px' }}>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                  </p>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <form onSubmit={handleUpdateTask}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Edit Task Specs</h3>
              <button type="button" onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="glass-panel" style={{ padding: '10px 14px', borderColor: 'hsla(0, 85%, 60%, 0.3)', color: 'hsl(0, 85%, 65%)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Title input */}
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" value={editTitle} onChange={e => { setEditTitle(e.target.value); setError(''); }} required />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              </div>

              {/* Project Select */}
              <div className="form-group">
                <label className="form-label">Associate Project</label>
                <select value={editProjectId} onChange={e => { setEditProjectId(e.target.value); setError(''); }} required>
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Assignee & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select value={editAssignedTo} onChange={e => setEditAssignedTo(e.target.value)}>
                    <option value="">Unassigned</option>
                    {teamMembers.filter(m => m.role !== 'client').map(member => (
                      <option key={member.id} value={member.id}>{member.username}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="testing">Testing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Submit footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '8px 20px', color: '#000', gap: '6px' }}>
                  <Save size={13} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </div>
          </form>
        )}

      </div>

      {/* Checklist & Comments row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Left Column: Subtasks checklist console */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={16} style={{ color: 'hsl(var(--accent-cyan))' }} /> Subtasks Progress
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
              {subtasksList.length > 0 ? `${completedSubs}/${subtasksList.length} completed` : 'No subtasks'}
            </span>
          </div>

          {/* Progress bar */}
          {subtasksList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ flex: 1, height: '6px', background: 'hsla(220, 20%, 30%, 0.6)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--accent-blue)), hsl(var(--status-complete)))', borderRadius: '999px', transition: 'width 0.4s' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'hsl(var(--status-complete))' }}>{progressPct}%</span>
            </div>
          )}

          {/* Add Subtask form */}
          {isManager && (
            <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input 
                type="text" 
                placeholder="+ Add subtask item..."
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem', flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', color: '#000' }}>
                Add
              </button>
            </form>
          )}

          {/* Subtasks checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '250px' }}>
            {subtasksList.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.82rem', fontStyle: 'italic', margin: 0 }}>
                No checklist subtasks.
              </p>
            ) : (
              subtasksList.map(sub => (
                <div 
                  key={sub.id} 
                  onClick={() => handleToggleSubtask(sub.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: sub.completed ? 'hsla(145, 75%, 45%, 0.04)' : 'hsla(220, 20%, 25%, 0.15)',
                    border: '1px solid hsl(var(--border-glass))',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={sub.completed}
                    readOnly
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ 
                    fontSize: '0.82rem', 
                    color: sub.completed ? 'hsl(var(--text-muted))' : '#fff',
                    textDecoration: sub.completed ? 'line-through' : 'none'
                  }}>
                    {sub.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Discussions/Comments Feed */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '350px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <MessageSquare size={16} style={{ color: 'hsl(var(--accent-cyan))' }} /> Discussions
          </h3>

          {/* Scrollable comments list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', marginBottom: '14px' }}>
            {comments.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No task discussion comments. Start the thread!
              </div>
            ) : (
              comments.map(c => (
                <div 
                  key={c.id} 
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'hsla(220, 20%, 25%, 0.15)',
                    border: '1px solid hsl(var(--border-glass))',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>{c.username}</span>
                      <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: '4px', background: 'hsla(190, 90%, 50%, 0.1)', color: 'hsl(var(--accent-cyan))', textTransform: 'uppercase', fontWeight: '700' }}>
                        {c.role || 'Member'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'recent'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#fff', margin: 0, lineHeight: 1.45 }}>{c.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Comment submission form */}
          <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <input 
              type="text" 
              placeholder="Write a message to the team..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              style={{ padding: '10px 14px', fontSize: '0.85rem', flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', color: '#000' }}>
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default TaskDetails;
