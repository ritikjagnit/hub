import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Folder, Plus, Calendar, UserCheck, Trash2, Edit2, Upload, FileText, X } from 'lucide-react';
import { io } from 'socket.io-client';

const Projects = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  const socketRef = useRef(null);

  // Modals & form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  // Form inputs
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDeadline, setProjDeadline] = useState('');
  const [projStatus, setProjStatus] = useState('pending');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [fileInputKeys, setFileInputKeys] = useState({});

  // Quick Task states
  const [activeQuickAddProjId, setActiveQuickAddProjId] = useState(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDesc, setQuickTaskDesc] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState('medium');
  const [quickTaskDueDate, setQuickTaskDueDate] = useState('');
  const [quickTaskAssignedTo, setQuickTaskAssignedTo] = useState('');

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchTeamList();

      socketRef.current = io(import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);
      
      socketRef.current.on('project_created', () => {
        fetchProjects();
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
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

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: projName,
          description: projDesc,
          deadline: projDeadline,
          status: projStatus
        })
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        resetForm();
        fetchProjects();
      } else {
        alert('Failed to create project');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${currentProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: projName,
          description: projDesc,
          deadline: projDeadline,
          status: projStatus
        })
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        resetForm();
        fetchProjects();
      } else {
        alert('Failed to update project');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks, time logs, and discussions will be removed.')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssignModal = (proj) => {
    setCurrentProject(proj);
    const existingIds = proj.members.map(m => m.user_id);
    setAssignedUsers(existingIds);
    setIsAssignModalOpen(true);
  };

  const handleToggleMember = (userId) => {
    if (assignedUsers.includes(userId)) {
      setAssignedUsers(assignedUsers.filter(id => id !== userId));
    } else {
      setAssignedUsers([...assignedUsers, userId]);
    }
  };

  const handleSaveTeam = async () => {
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_ids: assignedUsers })
      });
      if (res.ok) {
        setIsAssignModalOpen(false);
        fetchProjects();
      } else {
        alert('Failed to save team assignments');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (projId) => {
    const file = selectedFiles[projId];
    if (!file) return alert('Please select a file first.');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/projects/${projId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        alert('Document uploaded successfully!');
        setSelectedFiles(prev => ({ ...prev, [projId]: null }));
        setFileInputKeys(prev => ({ ...prev, [projId]: (prev[projId] || 0) + 1 }));
        fetchProjects();
      } else {
        alert('File upload failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (proj) => {
    setCurrentProject(proj);
    setProjName(proj.name);
    setProjDesc(proj.description || '');
    setProjDeadline(proj.deadline);
    setProjStatus(proj.status);
    setIsEditModalOpen(true);
  };

  const handleQuickCreateTask = async (e, projectId) => {
    e.preventDefault();
    if (!quickTaskTitle) return alert('Task title is required');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: quickTaskTitle,
          description: quickTaskDesc,
          priority: quickTaskPriority,
          status: 'pending',
          due_date: quickTaskDueDate || null,
          assigned_to: quickTaskAssignedTo ? parseInt(quickTaskAssignedTo) : null,
          project_id: projectId
        })
      });

      if (res.ok) {
        setQuickTaskTitle('');
        setQuickTaskDesc('');
        setQuickTaskPriority('medium');
        setQuickTaskDueDate('');
        setQuickTaskAssignedTo('');
        setActiveQuickAddProjId(null);
        fetchProjects();
      } else {
        alert('Failed to create task');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setProjName('');
    setProjDesc('');
    setProjDeadline('');
    setProjStatus('pending');
    setCurrentProject(null);
    setSelectedFiles({});
    setFileInputKeys({});
    setQuickTaskTitle('');
    setQuickTaskDesc('');
    setQuickTaskPriority('medium');
    setQuickTaskDueDate('');
    setQuickTaskAssignedTo('');
    setActiveQuickAddProjId(null);
  };

  const isManager = user && (user.role === 'admin' || user.role === 'project_manager' || user.role === 'team_member' || user.role === 'member');
  const canManageProjects = user && ['admin', 'project_manager'].includes(user.role);
  const canAddTasks = user && ['admin', 'project_manager', 'team_member', 'member'].includes(user.role);

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage client scopes, assignments, deadlines, and project briefs.</p>
        </div>
        {canManageProjects && (
          <button onClick={() => { resetForm(); setIsCreateModalOpen(true); }} className="btn btn-primary" style={{ color: '#000' }}>
            <Plus size={16} /> Create Project
          </button>
        )}
      </div>

      {/* Grid of Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {projects.length === 0 ? (
          <p style={{ color: 'hsl(var(--text-muted))', padding: '20px' }}>No active projects recorded.</p>
        ) : (
          projects.map(proj => (
            <div key={proj.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className={`status-badge status-${proj.status}`}>
                  {proj.status.replace('_', ' ')}
                </span>
                
                {canManageProjects && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleOpenEdit(proj)} className="btn btn-secondary" style={{ padding: '6px', minWidth: '30px' }} title="Edit">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDeleteProject(proj.id)} className="btn btn-danger" style={{ padding: '6px', minWidth: '30px' }} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div 
                onClick={() => navigate(`/projects/${proj.id}`)} 
                style={{ cursor: 'pointer' }}
                title="View Full Dashboard Details"
              >
                <h3 className="link-hover" style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: 'hsl(var(--accent-cyan))' }}>
                  {proj.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', minHeight: '40px' }}>{proj.description}</p>
              </div>

              {/* Meta: Deadline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                <Calendar size={14} style={{ color: 'hsl(var(--accent-cyan))' }} />
                <span>Deadline: <strong>{proj.deadline}</strong></span>
              </div>

              {/* Project Progress - Circular Ring */}
              {(() => {
                const pct = proj.status === 'completed' ? 100 : proj.status === 'testing' ? 75 : proj.status === 'in_progress' ? 50 : 25;
                const color = proj.status === 'completed' ? 'hsl(var(--status-complete))' : proj.status === 'testing' ? 'hsl(var(--status-testing))' : proj.status === 'in_progress' ? 'hsl(var(--status-progress))' : 'hsl(var(--status-pending))';
                const size = 80, stroke = 8, r = (size - stroke) / 2;
                const circ = 2 * Math.PI * r;
                const dash = (pct / 100) * circ;
                const stepLabel = proj.status === 'completed' ? 'Completed' : proj.status === 'testing' ? 'Testing' : proj.status === 'in_progress' ? 'In Progress' : 'Pending';
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 14px', background: 'hsla(220,20%,18%,0.4)', borderRadius: '12px', border: '1px solid hsl(var(--border-glass))' }}>
                    {/* Ring */}
                    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsla(220,20%,25%,0.5)" strokeWidth={stroke} />
                        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                          strokeLinecap="round"
                          strokeDasharray={`${dash} ${circ}`}
                          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 5px ${color}99)` }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '900', color, lineHeight: 1 }}>{pct}%</div>
                      </div>
                    </div>
                    {/* Step labels */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Progress Track</div>
                      {['Pending', 'In Progress', 'Testing', 'Completed'].map((step, i) => {
                        const stepPcts = [25, 50, 75, 100];
                        const isActive = step.toLowerCase().replace(' ', '_') === proj.status || (step === 'In Progress' && proj.status === 'in_progress');
                        const stepColors = ['hsl(var(--status-pending))', 'hsl(var(--status-progress))', 'hsl(var(--status-testing))', 'hsl(var(--status-complete))'];
                        const isDone = stepPcts[i] <= pct;
                        return (
                          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDone ? stepColors[i] : 'hsla(220,20%,35%,0.6)', flexShrink: 0, boxShadow: isDone ? `0 0 4px ${stepColors[i]}` : 'none', transition: 'all 0.3s' }} />
                            <span style={{ fontSize: '0.68rem', fontWeight: isDone ? '700' : '400', color: isDone ? stepColors[i] : 'hsl(var(--text-muted))' }}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Team list */}
              <div style={{ borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>Team Members ({proj.members ? proj.members.length : 0})</span>
                  {canManageProjects && (
                    <button 
                      onClick={() => handleOpenAssignModal(proj)} 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                    >
                      <UserCheck size={12} /> Manage Team
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {proj.members && proj.members.length > 0 ? (
                    proj.members.map(m => (
                      <span key={m.user_id} className="status-badge" style={{ background: 'hsla(220, 20%, 25%, 0.5)', border: '1px solid hsl(var(--border-glass))', fontSize: '0.7rem' }}>
                        {m.username} ({m.role === 'project_manager' ? 'PM' : 'Dev'})
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>No members assigned</span>
                  )}
                </div>
              </div>

              {/* Project Tasks */}
              <div style={{ borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>
                    Project Tasks ({proj.tasks ? proj.tasks.length : 0})
                  </span>
                  {canAddTasks && (
                    <button 
                      onClick={() => {
                        if (activeQuickAddProjId === proj.id) {
                          setActiveQuickAddProjId(null);
                        } else {
                          setActiveQuickAddProjId(proj.id);
                          setQuickTaskTitle('');
                          setQuickTaskDesc('');
                          setQuickTaskPriority('medium');
                          setQuickTaskDueDate('');
                          setQuickTaskAssignedTo('');
                        }
                      }}
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={12} /> {activeQuickAddProjId === proj.id ? 'Cancel' : 'Add Task'}
                    </button>
                  )}
                </div>

                {/* Quick Add Task Form */}
                {activeQuickAddProjId === proj.id && (
                  <form onSubmit={(e) => handleQuickCreateTask(e, proj.id)} style={{ background: 'hsla(220, 20%, 25%, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid hsl(var(--border-glass))' }}>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Task title (e.g. Landing Page Design)" 
                        value={quickTaskTitle} 
                        onChange={(e) => setQuickTaskTitle(e.target.value)} 
                        required 
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <textarea 
                        placeholder="Description..." 
                        value={quickTaskDesc} 
                        onChange={(e) => setQuickTaskDesc(e.target.value)} 
                        rows={2}
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '2px' }}>Priority</label>
                        <select 
                          value={quickTaskPriority} 
                          onChange={(e) => setQuickTaskPriority(e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '2px' }}>Due Date</label>
                        <input 
                          type="date" 
                          value={quickTaskDueDate} 
                          onChange={(e) => setQuickTaskDueDate(e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '2px' }}>Assignee</label>
                      <select 
                        value={quickTaskAssignedTo} 
                        onChange={(e) => setQuickTaskAssignedTo(e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <option value="">Select Assignee</option>
                        {teamMembers.filter(m => m.role !== 'client').map(member => (
                          <option key={member.id} value={member.id}>{member.username}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '6px', fontSize: '0.8rem', justifyContent: 'center', color: '#000' }}>
                      Save Task
                    </button>
                  </form>
                )}

                {/* Tasks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                  {proj.tasks && proj.tasks.length > 0 ? (
                    proj.tasks.map(task => (
                      <div key={task.id} style={{ padding: '10px', background: 'hsla(220, 20%, 25%, 0.15)', border: '1px solid hsl(var(--border-glass))', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'hsl(var(--text-main))' }}>{task.title}</span>
                          <span className={`task-priority-badge priority-${task.priority}`} style={{ fontSize: '0.55rem', padding: '1px 4px', margin: 0 }}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '6px', lineHeight: '1.3' }}>{task.description}</p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', borderTop: '1px dashed hsl(var(--border-glass))', paddingTop: '6px' }}>
                          <span>Assignee: <strong>{task.assigned_to_name || 'Unassigned'}</strong></span>
                          <span className={`status-badge status-${task.status}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>No tasks created yet.</span>
                  )}
                </div>
              </div>

              {/* Documents tab */}
              <div style={{ borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '12px', flexGrow: 1 }}>
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Project Brief Documents
                </span>
                
                {/* Upload attachment tool */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <label className="btn btn-secondary" style={{ flexGrow: 1, fontSize: '0.75rem', padding: '6px 12px', justifyContent: 'flex-start', cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    <FileText size={12} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedFiles[proj.id] ? selectedFiles[proj.id].name : 'Choose Document'}
                    </span>
                    <input 
                      type="file" 
                      key={fileInputKeys[proj.id] || 0}
                      onChange={(e) => setSelectedFiles(prev => ({ ...prev, [proj.id]: e.target.files[0] }))}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button 
                    onClick={() => handleFileUpload(proj.id)} 
                    className="btn btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px', color: '#000', flexShrink: 0 }}
                  >
                    <Upload size={12} /> Upload
                  </button>
                </div>

                {/* Documents logs list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {proj.documents && proj.documents.length > 0 ? (
                    proj.documents.map(doc => (
                      <a 
                        key={doc.id} 
                        href={doc.file_path.startsWith('http') ? doc.file_path : `http://localhost:5000${doc.file_path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.75rem',
                          color: 'hsl(var(--accent-cyan))',
                          textDecoration: 'none',
                          padding: '6px',
                          background: 'hsla(220, 20%, 25%, 0.2)',
                          borderRadius: '6px'
                        }}
                      >
                        <FileText size={12} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                      </a>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>No documents uploaded.</span>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Create Project</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input type="text" placeholder="Alpha Website Redesign" value={projName} onChange={(e) => setProjName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} placeholder="Provide details about scope..." value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input type="date" value={projDeadline} onChange={(e) => setProjDeadline(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={projStatus} onChange={(e) => setProjStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="testing">Testing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>Create</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Edit Project</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input type="text" value={projName} onChange={(e) => setProjName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input type="date" value={projDeadline} onChange={(e) => setProjDeadline(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={projStatus} onChange={(e) => setProjStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="testing">Testing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* TEAM ASSIGN MODAL */}
      {isAssignModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Assign Project Team</h3>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              {teamMembers.filter(member => member.role !== 'client').map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'hsla(220, 20%, 25%, 0.2)', borderRadius: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={assignedUsers.includes(member.id)} 
                    onChange={() => handleToggleMember(member.id)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{member.username}</p>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>{member.role.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleSaveTeam} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>
              Save Team Assignments
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Projects;
