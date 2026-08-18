import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Calendar, User, Trash2, AlertCircle, X, Eye, BarChart2, TrendingUp, CheckCircle2, Clock, Zap } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, closestCorners } from '@dnd-kit/core';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../config/socket';

const DroppableColumn = ({ id, title, color, count, onAddTask, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div 
      ref={setNodeRef} 
      className="kanban-column" 
      style={{ 
        borderTop: `3px solid ${color}`,
        background: isOver ? 'hsla(190, 90%, 50%, 0.08)' : undefined, 
        borderColor: isOver ? color : undefined,
        transition: 'background 0.2s, border-color 0.2s' 
      }}
    >
      <div className="column-header">
        <span className="column-title" style={{ color, fontSize: '0.92rem' }}>
          <AlertCircle size={15} /> {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="task-count-badge">{count}</span>
          <button 
            onClick={() => onAddTask(id)}
            style={{
              background: 'hsla(220, 20%, 25%, 0.6)',
              border: '1px solid hsl(var(--border-glass))',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 6px',
              transition: 'all 0.2s'
            }}
            title={`Add task to ${title}`}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      <div className="kanban-column-cards">
        {children}
      </div>
    </div>
  );
};

const DraggableTask = ({ task, isManager, handleDeleteTask, handleStatusChange, handleOpenComments }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id.toString(), data: task });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging ? '0 12px 32px rgba(0,0,0,0.5)' : undefined,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="glass-panel task-card kanban-task">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span className={`task-priority-badge priority-${task.priority}`} style={{ marginBottom: 0 }}>
          {task.priority}
        </span>
        {isManager && (
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => handleDeleteTask(task.id)} className="btn btn-danger" style={{ padding: '4px 6px', borderRadius: '6px' }} title="Delete task">
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <div style={{ marginBottom: '12px', minWidth: 0 }}>
        <h4 style={{ 
          fontSize: '0.95rem', 
          fontWeight: '600', 
          marginBottom: '4px', 
          color: 'hsl(var(--text-main))',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          lineHeight: 1.35
        }}>
          {task.title}
        </h4>
        {task.description && (
          <p style={{ 
            fontSize: '0.8rem', 
            color: 'hsl(var(--text-muted))', 
            lineHeight: 1.45,
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: '4px 0 8px'
          }}>
            {task.description}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'hsl(var(--accent-cyan))', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
            Project: {task.project_name || `ID ${task.project_id}`}
          </span>
          {task.project_status && (
            <span className={`status-badge status-${task.project_status}`} style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'hsla(220, 20%, 25%, 0.5)', border: '1px solid hsl(var(--border-glass))' }}>
              {task.project_status.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '10px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-purple)))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
            {(task.assigned_to_name || 'U').charAt(0).toUpperCase()}
          </div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
            {task.assigned_to_name || 'Unassigned'}
          </span>
        </div>
        {task.due_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <Calendar size={12} />
            <span>{new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <select 
          value={task.status} 
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => handleStatusChange(task.id, e.target.value)}
          style={{ fontSize: '0.75rem', padding: '4px 6px', background: 'hsla(220, 20%, 25%, 0.4)', cursor: 'pointer', border: '1px solid hsl(var(--border-glass))', borderRadius: '6px', flex: 1, minWidth: 0 }}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="testing">Testing</option>
          <option value="completed">Completed</option>
        </select>
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleOpenComments(task)} 
          className="btn btn-secondary" 
          style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px', flexShrink: 0 }}
        >
          <Eye size={12} /> Details
        </button>
      </div>
    </div>
  );
};

const Tasks = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isPendingView = location.pathname.endsWith('/pending');

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Pending tasks list filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const socketRef = useRef(null);

  // Modals & comments toggler
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCommentsTask, setActiveCommentsTask] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  
  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskStatus, setTaskStatus] = useState('pending');
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchProjects();
      fetchTeamList();

      socketRef.current = io(getSocketUrl());
      
      socketRef.current.on('task_created', () => {
        fetchTasks();
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTasks(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          setTaskProjectId(prev => prev || data[0].id.toString());
        }
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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskProjectId) return alert('Title and Project are required');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          status: taskStatus,
          due_date: taskDueDate || null,
          assigned_to: taskAssignedTo ? parseInt(taskAssignedTo) : null,
          project_id: parseInt(taskProjectId)
        })
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        resetForm();
        fetchTasks();
      } else {
        alert('Failed to create task');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks(); // fetch from server to get accurate state
      } else {
        alert('Status update failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task record?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenComments = async (task) => {
    setActiveCommentsTask(task);
    setNewComment('');
    setNewSubtaskTitle('');
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTaskComments(data.comments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    const currentSubtasks = activeCommentsTask.subtasks ? JSON.parse(activeCommentsTask.subtasks) : [];
    const updatedSubtasks = currentSubtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    const subtasksStr = JSON.stringify(updatedSubtasks);

    try {
      const res = await fetch(`/api/tasks/${activeCommentsTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subtasks: subtasksStr })
      });

      if (res.ok) {
        setActiveCommentsTask(prev => ({ ...prev, subtasks: subtasksStr }));
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const currentSubtasks = activeCommentsTask.subtasks ? JSON.parse(activeCommentsTask.subtasks) : [];
    const newSubtask = {
      id: Date.now(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    const updatedSubtasks = [...currentSubtasks, newSubtask];
    const subtasksStr = JSON.stringify(updatedSubtasks);

    try {
      const res = await fetch(`/api/tasks/${activeCommentsTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subtasks: subtasksStr })
      });

      if (res.ok) {
        setActiveCommentsTask(prev => ({ ...prev, subtasks: subtasksStr }));
        setNewSubtaskTitle('');
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment) return;

    try {
      const res = await fetch(`/api/tasks/${activeCommentsTask.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });

      if (res.ok) {
        setNewComment('');
        handleOpenComments(activeCommentsTask);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = (defaultStatus = 'pending') => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskDueDate('');
    setTaskAssignedTo('');
    setTaskProjectId(projects.length > 0 ? projects[0].id.toString() : '');
    setTaskStatus(defaultStatus);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const taskId = parseInt(active.id);
    const newStatus = over.id;
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      // Optimistic UI update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      handleStatusChange(taskId, newStatus);
    }
  };

  const columns = [
    { id: 'pending', title: 'Pending', color: 'hsl(var(--status-pending))' },
    { id: 'in_progress', title: 'In Progress', color: 'hsl(var(--status-progress))' },
    { id: 'testing', title: 'Testing', color: 'hsl(var(--status-testing))' },
    { id: 'completed', title: 'Completed', color: 'hsl(var(--status-complete))' }
  ];

  const isManager = user && (user.role === 'admin' || user.role === 'project_manager' || user.role === 'team_member' || user.role === 'member');
  const canDeleteTask = user && ['admin', 'project_manager'].includes(user.role);
  const canCreateTask = user && ['admin', 'project_manager', 'team_member', 'member'].includes(user.role);

  // Filter tasks for pending list view
  const filteredTasks = tasks.filter(t => {
    if (t.status !== 'pending') return false;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProject = projectFilter ? t.project_id === parseInt(projectFilter) : true;
    const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
    return matchesSearch && matchesProject && matchesPriority;
  });

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ textAlign: 'left' }}>
      <style>{`
        .kanban-task {
          cursor: grab;
        }
        .kanban-task:active {
          cursor: grabbing;
        }
        .link-hover:hover {
          color: hsl(var(--accent-cyan)) !important;
          text-decoration: underline;
        }
      `}</style>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">{isPendingView ? 'Pending Tasks' : 'Tasks Board'}</h1>
          <p className="page-subtitle">
            {isPendingView 
              ? 'Filter, search, and manage all task items currently awaiting start.' 
              : 'Track project actions, transition columns with drag & drop, and audit deliverables.'}
          </p>
        </div>
        {canCreateTask && (
          <button 
            onClick={() => {
              if (isPendingView) {
                navigate('/tasks/create');
              } else {
                resetForm('pending'); 
                setIsCreateModalOpen(true);
              }
            }} 
            className="btn btn-primary" 
            style={{ color: '#000' }}
          >
            <Plus size={16} /> Create Task
          </button>
        )}
      </div>

      {isPendingView ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Bar */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Search pending tasks..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ padding: '8px 12px', fontSize: '0.85rem', minWidth: '200px', flex: 1 }}
              />
              <select
                value={projectFilter}
                onChange={e => { setProjectFilter(e.target.value); setCurrentPage(1); }}
                style={{ padding: '8px 12px', fontSize: '0.85rem', minWidth: '150px' }}
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                style={{ padding: '8px 12px', fontSize: '0.85rem', minWidth: '120px' }}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
              Found {filteredTasks.length} pending tasks
            </div>
          </div>

          {/* Pending Tasks List */}
          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            {paginatedTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))', fontSize: '0.9rem', fontStyle: 'italic' }}>
                No pending tasks found.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border-glass))', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>Task Title</th>
                    <th style={{ padding: '12px 16px' }}>Project</th>
                    <th style={{ padding: '12px 16px' }}>Assignee</th>
                    <th style={{ padding: '12px 16px' }}>Priority</th>
                    <th style={{ padding: '12px 16px' }}>Due Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.map(task => (
                    <tr key={task.id} style={{ borderBottom: '1px solid hsl(var(--border-glass))', fontSize: '0.85rem' }}>
                      <td style={{ padding: '16px' }}>
                        <span 
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          style={{ fontWeight: '700', color: '#fff', cursor: 'pointer', transition: 'color 0.2s' }}
                          className="link-hover"
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', margin: '4px 0 0', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: 'hsl(var(--accent-cyan))', fontWeight: '600' }}>
                        {task.project_name || `ID ${task.project_id}`}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-purple)))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#fff' }}>
                            {(task.assigned_to_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span>{task.assigned_to_name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`task-priority-badge priority-${task.priority}`} style={{ margin: 0 }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: task.due_date && new Date(task.due_date) < new Date() ? 'hsl(var(--status-high))' : 'inherit' }}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => navigate(`/tasks/${task.id}`)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}>
                            <Eye size={12} /> View
                          </button>
                          {canCreateTask && (
                            <button onClick={() => navigate(`/tasks/${task.id}?edit=true`)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}>
                              Edit
                            </button>
                          )}
                          <button onClick={() => handleStatusChange(task.id, 'completed')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px', borderColor: 'hsl(var(--status-complete))', color: 'hsl(var(--status-complete))' }}>
                            <CheckCircle2 size={12} /> Complete
                          </button>
                          {canDeleteTask && (
                            <button onClick={() => handleDeleteTask(task.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}>
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Monthly Overview Bar - Circular Progress Rings */}
          {(() => {
            const now = new Date();
            const monthName = now.toLocaleString('default', { month: 'long' });
            const year = now.getFullYear();
            const monthTasks = tasks.filter(t => {
              const d = t.created_at ? new Date(t.created_at) : null;
              return d && d.getMonth() === now.getMonth() && d.getFullYear() === year;
            });
            const total = monthTasks.length || tasks.length;
            const completed = (monthTasks.length ? monthTasks : tasks).filter(t => t.status === 'completed').length;
            const inProgress = (monthTasks.length ? monthTasks : tasks).filter(t => t.status === 'in_progress').length;
            const pending = (monthTasks.length ? monthTasks : tasks).filter(t => t.status === 'pending').length;
            const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
            const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
            const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
            const highPct = total > 0 ? Math.round((highPriority / total) * 100) : 0;

            // SVG ring helper
            const CircleRing = ({ pct, color, size = 90, stroke = 8, label, sub, centerText }) => {
              const r = (size - stroke) / 2;
              const circ = 2 * Math.PI * r;
              const dash = (pct / 100) * circ;
              return (
                <div className="glass-panel" style={{
                  padding: '18px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}33`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                >
                  {/* SVG Ring */}
                  <div style={{ position: 'relative', width: size, height: size }}>
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                      {/* Track */}
                      <circle
                        cx={size / 2} cy={size / 2} r={r}
                        fill="none"
                        stroke="hsla(220,20%,25%,0.5)"
                        strokeWidth={stroke}
                      />
                      {/* Progress Arc */}
                      <circle
                        cx={size / 2} cy={size / 2} r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ}`}
                        style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color}88)` }}
                      />
                    </svg>
                    {/* Center label */}
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center', lineHeight: 1.1,
                    }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '900', color, letterSpacing: '-0.5px' }}>{centerText}</div>
                    </div>
                  </div>
                  {/* Label */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--text-main))' }}>{label}</div>
                    <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{sub}</div>
                  </div>
                </div>
              );
            };

            return (
              <div style={{ marginBottom: '28px' }}>
                {/* Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <BarChart2 size={16} style={{ color: 'hsl(var(--accent-cyan))' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {monthName} {year} — Overview
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'hsl(var(--border-glass))' }} />
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{total} Total Tasks</span>
                </div>

                {/* Circular Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
                  <CircleRing
                    pct={completionPct} color="hsl(var(--status-complete))"
                    label="Completed" sub={`${completed} of ${total} tasks`}
                    centerText={`${completionPct}%`}
                  />
                  <CircleRing
                    pct={inProgressPct} color="hsl(var(--status-progress))"
                    label="In Progress" sub={`${inProgress} tasks active`}
                    centerText={String(inProgress)}
                  />
                  <CircleRing
                    pct={pendingPct} color="hsl(var(--status-pending))"
                    label="Pending" sub={`${pending} awaiting start`}
                    centerText={String(pending)}
                  />
                  <CircleRing
                    pct={highPct} color="hsl(var(--status-high, 0, 90%, 60%))"
                    label="High Priority" sub={`${highPriority} urgent tasks`}
                    centerText={String(highPriority)}
                  />
                  {/* Overall completion ring (larger) */}
                  <div className="glass-panel" style={{
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: 'linear-gradient(135deg, hsla(190,90%,50%,0.06), hsla(250,80%,60%,0.06))',
                  }}>
                    {/* Large ring */}
                    {(() => {
                      const size = 110, stroke = 10, r = (size - stroke) / 2;
                      const circ = 2 * Math.PI * r;
                      const dash = (completionPct / 100) * circ;
                      return (
                        <div style={{ position: 'relative', width: size, height: size }}>
                          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                            <defs>
                              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="hsl(var(--accent-blue))" />
                                <stop offset="100%" stopColor="hsl(var(--status-complete))" />
                              </linearGradient>
                            </defs>
                            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsla(220,20%,25%,0.5)" strokeWidth={stroke} />
                            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={stroke}
                              strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
                              style={{ transition: 'stroke-dasharray 1.2s ease', filter: 'drop-shadow(0 0 8px hsl(var(--accent-cyan)))' }}
                            />
                          </svg>
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: '900', background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--status-complete)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{completionPct}%</div>
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'hsl(var(--text-main))' }}>Month Rate</div>
                      <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Overall Completion</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Kanban Board Container */}
          <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="kanban-board-container">
              <div className="kanban-board">
                {columns.map(col => {
                  const colTasks = tasks.filter(t => t.status === col.id);
                  
                  return (
                    <DroppableColumn 
                      key={col.id} 
                      id={col.id} 
                      title={col.title} 
                      color={col.color} 
                      count={colTasks.length}
                      onAddTask={(status) => {
                        resetForm(status);
                        setIsCreateModalOpen(true);
                      }}
                    >
                      {colTasks.length === 0 ? (
                        <div style={{ 
                          padding: '30px 16px', 
                          border: '2px dashed hsl(var(--border-glass))', 
                          borderRadius: '10px', 
                          textAlign: 'center', 
                          color: 'hsl(var(--text-muted))', 
                          fontSize: '0.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: 'hsla(220, 20%, 18%, 0.2)',
                          minHeight: '120px'
                        }}>
                          <Clock size={18} style={{ opacity: 0.5 }} />
                          <span>No tasks in {col.title}</span>
                        </div>
                      ) : (
                        colTasks.map(task => (
                          <DraggableTask 
                            key={task.id} 
                            task={task} 
                            isManager={canDeleteTask} 
                            handleDeleteTask={handleDeleteTask} 
                            handleStatusChange={handleStatusChange} 
                            handleOpenComments={handleOpenComments} 
                          />
                        ))
                      )}
                    </DroppableColumn>
                  );
                })}
              </div>
            </div>
          </DndContext>
        </>
      )}

      {/* TASK CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Create Task</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" placeholder="Build DB configurations" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} placeholder="Provide task steps..." value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Project</label>
                <select value={taskProjectId} onChange={(e) => setTaskProjectId(e.target.value)} required>
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} required>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="testing">Testing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Member</label>
                <select value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(e.target.value)}>
                  <option value="">Select Assignee</option>
                  {teamMembers.filter(m => m.role !== 'client').map(member => (
                    <option key={member.id} value={member.id}>{member.username} ({member.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>Create Task</button>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS MODAL */}
      {activeCommentsTask && (
        <div className="modal-overlay">
          <div style={{
            width: '100%', maxWidth: '560px',
            background: 'hsl(222,22%,12%)',
            border: '1px solid hsl(var(--border-glass))',
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            maxHeight: '92vh', overflow: 'hidden'
          }}>
            {/* ── TOP HEADER ── */}
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid hsl(var(--border-glass))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => setActiveCommentsTask(null)}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--accent-cyan))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '700' }}>
                ← Task Details
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select value={activeCommentsTask.status}
                  onChange={async (e) => {
                    const s = e.target.value;
                    await handleStatusChange(activeCommentsTask.id, s);
                    setActiveCommentsTask(prev => ({ ...prev, status: s }));
                  }}
                  style={{
                    padding: '5px 12px', fontSize: '0.75rem', fontWeight: '700',
                    background: activeCommentsTask.status === 'completed' ? 'hsla(145,75%,45%,0.2)' :
                      activeCommentsTask.status === 'in_progress' ? 'hsla(195,90%,55%,0.2)' :
                      activeCommentsTask.status === 'testing' ? 'hsla(270,85%,65%,0.2)' : 'hsla(40,90%,55%,0.2)',
                    color: activeCommentsTask.status === 'completed' ? 'hsl(var(--status-complete))' :
                      activeCommentsTask.status === 'in_progress' ? 'hsl(var(--status-progress))' :
                      activeCommentsTask.status === 'testing' ? 'hsl(var(--status-testing))' : 'hsl(var(--status-pending))',
                    border: '1px solid currentColor', borderRadius: '20px', cursor: 'pointer'
                  }}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="testing">Testing</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => setActiveCommentsTask(null)}
                  style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── SCROLLABLE BODY ── */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>

              {/* Task Title */}
              <h2 style={{ fontSize: '1.55rem', fontWeight: '800', color: 'hsl(var(--text-main))', marginBottom: '18px', lineHeight: 1.25 }}>
                {activeCommentsTask.title}
              </h2>

              {/* 3-Column Info Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '20px', background: 'hsla(220,20%,18%,0.5)', borderRadius: '12px', border: '1px solid hsl(var(--border-glass))', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderRight: '1px solid hsl(var(--border-glass))' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Project</p>
                  <p style={{ fontSize: '0.88rem', fontWeight: '700', color: 'hsl(var(--accent-cyan))' }}>{activeCommentsTask.project_name || 'N/A'}</p>
                </div>
                <div style={{ padding: '14px 16px', borderRight: '1px solid hsl(var(--border-glass))' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Assigned To</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg,hsl(var(--accent-blue)),hsl(var(--accent-purple)))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                      {(activeCommentsTask.assigned_to_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <p style={{ fontSize: '0.88rem', fontWeight: '700' }}>{activeCommentsTask.assigned_to_name || 'Unassigned'}</p>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Due Date</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <Calendar size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                    <p style={{ fontSize: '0.88rem', fontWeight: '700' }}>{activeCommentsTask.due_date || '—'}</p>
                  </div>
                  <span className={`task-priority-badge priority-${activeCommentsTask.priority}`} style={{ margin: 0, padding: '2px 8px', fontSize: '0.65rem' }}>
                    {activeCommentsTask.priority}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.78rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Description</h4>
                <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-main))', lineHeight: 1.65, padding: '12px 14px', background: 'hsla(220,20%,18%,0.5)', borderRadius: '10px', border: '1px solid hsl(var(--border-glass))' }}>
                  {activeCommentsTask.description || 'No description provided.'}
                </p>
              </div>

              {/* Subtasks */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.78rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subtasks</h4>
                  {(() => {
                    const subs = activeCommentsTask.subtasks ? JSON.parse(activeCommentsTask.subtasks) : [];
                    const done = subs.filter(s => s.completed).length;
                    const pct = subs.length > 0 ? Math.round((done / subs.length) * 100) : 0;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '70px', height: '5px', background: 'hsla(220,20%,30%,0.6)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,hsl(var(--accent-blue)),hsl(var(--status-complete)))', borderRadius: '999px', transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>{done}/{subs.length}</span>
                      </div>
                    );
                  })()}
                </div>
                <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input type="text" placeholder="+ Add subtask..." value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.85rem', flex: 1 }} />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', color: '#000', flexShrink: 0 }}>Add</button>
                </form>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(() => {
                    const subs = activeCommentsTask.subtasks ? JSON.parse(activeCommentsTask.subtasks) : [];
                    if (subs.length === 0) return <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>No subtasks yet.</p>;
                    return subs.map(sub => (
                      <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: sub.completed ? 'hsla(145,75%,45%,0.08)' : 'hsla(220,20%,20%,0.4)', border: `1px solid ${sub.completed ? 'hsla(145,75%,45%,0.3)' : 'hsl(var(--border-glass))'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div onClick={() => handleToggleSubtask(sub.id)}
                          style={{ width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${sub.completed ? 'hsl(var(--status-complete))' : 'hsl(var(--border-glass))'}`, background: sub.completed ? 'hsl(var(--status-complete))' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                          {sub.completed && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span style={{ fontSize: '0.88rem', textDecoration: sub.completed ? 'line-through' : 'none', color: sub.completed ? 'hsl(var(--text-muted))' : 'hsl(var(--text-main))' }}>{sub.title}</span>
                      </label>
                    ));
                  })()}
                </div>
              </div>

              {/* Discussion */}
              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Discussion</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {taskComments.length === 0 ? (
                    <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.82rem', textAlign: 'center', fontStyle: 'italic', padding: '12px' }}>No comments yet.</p>
                  ) : (
                    taskComments.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,hsl(var(--accent-blue)),hsl(var(--accent-cyan)))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#000', flexShrink: 0 }}>
                          {c.username.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, background: 'hsla(220,20%,20%,0.5)', border: '1px solid hsl(var(--border-glass))', borderRadius: '0 10px 10px 10px', padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--accent-cyan))' }}>{c.username} <span style={{ color: 'hsl(var(--text-muted))', fontWeight: '400' }}>({c.role.replace('_',' ')})</span></span>
                            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-main))', lineHeight: 1.4 }}>{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── FIXED BOTTOM COMMENT BAR ── */}
            <form onSubmit={handlePostComment} style={{ padding: '14px 20px', borderTop: '1px solid hsl(var(--border-glass))', display: 'flex', gap: '10px', alignItems: 'center', background: 'hsla(222,22%,10%,0.95)', flexShrink: 0 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,hsl(var(--accent-blue)),hsl(var(--accent-purple)))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <input type="text" placeholder="Add a comment..." value={newComment}
                onChange={(e) => setNewComment(e.target.value)} required
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.88rem', borderRadius: '25px', background: 'hsla(220,20%,20%,0.7)', border: '1px solid hsl(var(--border-glass))' }} />
              <button type="submit" className="btn btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.85rem', color: '#000', borderRadius: '25px', flexShrink: 0 }}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;

