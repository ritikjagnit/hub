import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Folder, Calendar, Users, ListTodo, FileText, Upload, Plus, Edit2, Trash2, ArrowLeft, CheckCircle2, UserCheck, Clock, AlertTriangle, Activity, DollarSign, Receipt, TrendingUp, TrendingDown, History, FolderPlus, File, Download, Eye, X } from 'lucide-react';
import { io } from 'socket.io-client';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, tasks, members, documents, billing
  
  const socketRef = useRef(null);

  // Modals / forms states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);

  // Project edit inputs
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDeadline, setProjDeadline] = useState('');
  const [projStatus, setProjStatus] = useState('pending');

  // Quick task inputs
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickPriority, setQuickPriority] = useState('medium');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickAssignedTo, setQuickAssignedTo] = useState('');

  // Team assign checkboxes
  const [assignedUsers, setAssignedUsers] = useState([]);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Document Folder states
  const [folders, setFolders] = useState(['General', 'Designs', 'Requirements', 'Invoices', 'Contracts']);
  const [activeFolder, setActiveFolder] = useState('General');
  const [newFolderName, setNewFolderName] = useState('');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('General');

  // Billing & Budget states
  const [costSummary, setCostSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [clients, setClients] = useState([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceClientId, setInvoiceClientId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('hosting');

  useEffect(() => {
    if (token && id) {
      fetchProjectDetails();
      fetchTeamList();
      fetchBillingData();

      socketRef.current = io(import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);
      socketRef.current.on('task_created', (task) => {
        if (task.project_id === parseInt(id)) {
          fetchProjectDetails();
        }
      });

      return () => {
        if (socketRef.current) socketRef.current.disconnect();
      };
    }
  }, [token, id]);

  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        // Pre-populate edit form fields
        setProjName(data.name);
        setProjDesc(data.description || '');
        setProjDeadline(data.deadline ? data.deadline.split('T')[0] : '');
        setProjStatus(data.status);
      } else {
        navigate('/projects');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${id}`, {
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
        fetchProjectDetails();
      } else {
        alert('Failed to update project.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks, time logs, and briefs will be lost.')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        navigate('/projects');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssignModal = () => {
    const existingIds = project.members ? project.members.map(m => m.id) : [];
    setAssignedUsers(existingIds);
    setIsAssignModalOpen(true);
  };

  const handleToggleMember = (userId) => {
    if (assignedUsers.includes(userId)) {
      setAssignedUsers(assignedUsers.filter(uid => uid !== userId));
    } else {
      setAssignedUsers([...assignedUsers, userId]);
    }
  };

  const handleSaveTeam = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_ids: assignedUsers })
      });
      if (res.ok) {
        setIsAssignModalOpen(false);
        fetchProjectDetails();
      } else {
        alert('Failed to assign team.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickCreateTask = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return alert('Task title is required.');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: quickTitle.trim(),
          description: quickDesc.trim(),
          priority: quickPriority,
          status: 'pending',
          due_date: quickDueDate || null,
          assigned_to: quickAssignedTo ? parseInt(quickAssignedTo) : null,
          project_id: parseInt(id)
        })
      });

      if (res.ok) {
        setQuickTitle('');
        setQuickDesc('');
        setQuickPriority('medium');
        setQuickDueDate('');
        setQuickAssignedTo('');
        setIsQuickTaskOpen(false);
        fetchProjectDetails();
      } else {
        alert('Failed to create task.');
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
        fetchProjectDetails();
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
        fetchProjectDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBillingData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resCost, resInvoices, resExpenses, resClients] = await Promise.all([
        fetch(`/api/billing/cost-summary/${id}`, { headers }),
        fetch('/api/billing/invoices', { headers }),
        fetch('/api/billing/expenses', { headers }),
        fetch('/api/workspace/employees', { headers })
      ]);

      if (resCost.ok) setCostSummary(await resCost.json());
      if (resInvoices.ok) {
        const allInvoices = await resInvoices.json();
        setInvoices(allInvoices.filter(inv => inv.project_id === parseInt(id)));
      }
      if (resExpenses.ok) {
        const allExpenses = await resExpenses.json();
        setExpenses(allExpenses.filter(exp => exp.project_id === parseInt(id)));
      }
      if (resClients.ok) {
        const allEmployees = await resClients.json();
        setClients(allEmployees.filter(u => u.role === 'client'));
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
    }
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setFolders(prev => [...prev, newFolderName.trim()]);
    setActiveFolder(newFolderName.trim());
    setNewFolderName('');
    setIsFolderModalOpen(false);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceNo || !invoiceAmount || !invoiceDueDate) return alert('Fill all required fields');

    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invoice_number: invoiceNo,
          amount: parseFloat(invoiceAmount),
          due_date: invoiceDueDate,
          issue_date: new Date().toISOString(),
          project_id: parseInt(id),
          client_id: invoiceClientId ? parseInt(invoiceClientId) : null
        })
      });

      if (res.ok) {
        setIsInvoiceModalOpen(false);
        setInvoiceNo('');
        setInvoiceAmount('');
        setInvoiceDueDate('');
        fetchBillingData();
        fetchProjectDetails();
      } else {
        alert('Invoice creation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expenseAmount) return alert('Amount is required');

    try {
      const res = await fetch('/api/billing/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(expenseAmount),
          description: expenseDesc,
          category: expenseCategory,
          project_id: parseInt(id)
        })
      });

      if (res.ok) {
        setIsExpenseModalOpen(false);
        setExpenseAmount('');
        setExpenseDesc('');
        fetchBillingData();
        fetchProjectDetails();
      } else {
        alert('Expense logging failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    if (!window.confirm('Simulate payments routing via gateway?')) return;

    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'paid' })
      });
      if (res.ok) {
        alert('Invoice successfully marked paid!');
        fetchBillingData();
        fetchProjectDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return alert('Select a document first.');
    const formData = new FormData();
    formData.append('folder_name', uploadFolder);
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`/api/projects/${id}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        alert('Document uploaded successfully!');
        setSelectedFile(null);
        setFileInputKey(prev => prev + 1);
        fetchProjectDetails();
      } else {
        alert('File upload failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading project brief details...</div>;
  }

  if (!project) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Project not found.</div>;
  }

  // Calculate stats
  const totalTasks = project.tasks ? project.tasks.length : 0;
  const completedTasks = project.tasks ? project.tasks.filter(t => t.status === 'completed').length : 0;
  const pendingTasks = project.tasks ? project.tasks.filter(t => t.status === 'pending').length : 0;
  const activeTasks = project.tasks ? project.tasks.filter(t => t.status === 'in_progress' || t.status === 'testing').length : 0;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.status === 'completed' ? 100 : 0);

  const isManager = user && (user.role === 'admin' || user.role === 'project_manager' || user.role === 'team_member' || user.role === 'member');
  const canManageProjects = user && ['admin', 'project_manager'].includes(user.role);
  const canAddTasks = user && ['admin', 'project_manager', 'team_member', 'member'].includes(user.role);

  return (
    <div style={{ textAlign: 'left' }}>
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/projects')}
        style={{
          background: 'none', border: 'none', color: 'hsl(var(--accent-cyan))',
          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem',
          fontWeight: '700', cursor: 'pointer', marginBottom: '16px', padding: 0
        }}
      >
        <ArrowLeft size={16} /> Back to Projects
      </button>

      {/* Project Banner Header */}
      <div className="glass-panel" style={{
        padding: '28px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        border: '1px solid hsla(190, 90%, 50%, 0.15)',
        background: 'linear-gradient(135deg, hsla(190, 90%, 50%, 0.04), hsla(220, 20%, 25%, 0.1))',
      }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span className={`status-badge status-${project.status}`}>
              {project.status.replace('_', ' ')}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
              Created: {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', margin: 0, marginBottom: '8px' }}>
            {project.name}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'hsl(var(--text-muted))', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
            {project.description || 'No description provided.'}
          </p>
        </div>

        {canManageProjects && (
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button onClick={() => setIsEditModalOpen(true)} className="btn btn-secondary" style={{ padding: '10px 18px', gap: '8px' }}>
              <Edit2 size={14} /> Edit Project
            </button>
            <button onClick={handleDeleteProject} className="btn btn-danger" style={{ padding: '10px 18px', gap: '8px' }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Tabs list */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid hsl(var(--border-glass))', marginBottom: '24px' }}>
        {[
          { id: 'overview', label: 'Overview', icon: <Folder size={14} /> },
          { id: 'tasks', label: `Tasks (${totalTasks})`, icon: <ListTodo size={14} /> },
          { id: 'members', label: `Team Members (${project.members ? project.members.length : 0})`, icon: <Users size={14} /> },
          { id: 'documents', label: 'Documents', icon: <FileText size={14} /> },
          { id: 'billing', label: 'Billing & Budget', icon: <DollarSign size={14} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px', fontSize: '0.9rem', fontWeight: '700',
              background: activeTab === t.id ? 'hsla(190,90%,50%,0.08)' : 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid hsl(var(--accent-cyan))' : '2px solid transparent',
              color: activeTab === t.id ? '#fff' : 'hsl(var(--text-muted))',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginTop: '2px'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
          {/* Details column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Milestones Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: 'hsl(var(--accent-cyan))' }} /> Date milestones
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '12px 16px', background: 'hsla(220, 20%, 25%, 0.15)', borderRadius: '10px', border: '1px solid hsl(var(--border-glass))' }}>
                  <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Launch/Created Date</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                    {project.created_at ? new Date(project.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div style={{ padding: '12px 16px', background: 'hsla(220, 20%, 25%, 0.15)', borderRadius: '10px', border: '1px solid hsl(var(--border-glass))' }}>
                  <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Target Milestone Deadline</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'hsl(var(--status-pending))', margin: 0 }}>
                    {project.deadline ? new Date(project.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Local timeline activity */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} style={{ color: 'hsl(var(--accent-cyan))' }} /> Project Activity
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {totalTasks === 0 ? (
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                    No actions logged for this project yet.
                  </p>
                ) : (
                  project.tasks.slice(0, 5).map((t, idx) => (
                    <div key={t.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: t.status === 'completed' ? 'hsl(var(--status-complete))' : 'hsl(var(--status-pending))',
                          marginTop: '6px'
                        }} />
                        {idx !== Math.min(project.tasks.length, 5) - 1 && (
                          <div style={{ width: '1px', height: '36px', background: 'hsl(var(--border-glass))', marginTop: '4px' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.82rem', color: '#fff', margin: 0 }}>
                          Task <strong>{t.title}</strong> was created
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', margin: '2px 0 0 0' }}>
                          Status: {t.status.replace('_', ' ')} | Assignee: {t.assigned_to_name || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Progress Ring side column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', marginBottom: '20px', alignSelf: 'flex-start' }}>
                Project Deliverables Progress
              </h3>

              {(() => {
                const size = 150, stroke = 12, r = (size - stroke) / 2;
                const circ = 2 * Math.PI * r;
                const dash = (progressPct / 100) * circ;
                const color = project.status === 'completed' ? 'hsl(var(--status-complete))' : 'hsl(var(--accent-cyan))';
                return (
                  <div style={{ position: 'relative', width: size, height: size, marginBottom: '20px' }}>
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsla(220,20%,25%,0.5)" strokeWidth={stroke} />
                      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ}`}
                        style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color}88)` }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{progressPct}%</div>
                      <span style={{ fontSize: '0.62rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Done</span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
                <div style={{ padding: '10px', background: 'hsla(220,20%,20%,0.4)', borderRadius: '8px', border: '1px solid hsl(var(--border-glass))' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>{completedTasks}</div>
                  <span style={{ fontSize: '0.65rem', color: 'hsl(var(--status-complete))' }}>Completed Tasks</span>
                </div>
                <div style={{ padding: '10px', background: 'hsla(220,20%,20%,0.4)', borderRadius: '8px', border: '1px solid hsl(var(--border-glass))' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>{pendingTasks + activeTasks}</div>
                  <span style={{ fontSize: '0.65rem', color: 'hsl(var(--status-pending))' }}>Incomplete Tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TASKS */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', margin: 0 }}>
              Tasks associated with {project.name}
            </h3>
            {canAddTasks && (
              <button onClick={() => setIsQuickTaskOpen(true)} className="btn btn-primary" style={{ padding: '8px 16px', gap: '6px', color: '#000' }}>
                <Plus size={14} /> Add Task
              </button>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            {totalTasks === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                No tasks created for this project yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border-glass))', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>Task Title</th>
                    <th style={{ padding: '12px 16px' }}>Assignee</th>
                    <th style={{ padding: '12px 16px' }}>Priority</th>
                    <th style={{ padding: '12px 16px' }}>Due Date</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.tasks.map(task => (
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
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-purple)))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '800', color: '#fff' }}>
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
                      <td style={{ padding: '16px' }}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <select 
                          value={task.status} 
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'hsla(220, 20%, 25%, 0.4)', cursor: 'pointer', border: '1px solid hsl(var(--border-glass))' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="testing">Testing</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => navigate(`/tasks/${task.id}`)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              Details
                            </button>
                            {canManageProjects && (
                              <button onClick={() => handleDeleteTask(task.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                <Trash2 size={11} />
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
        </div>
      )}

      {/* TAB CONTENT: MEMBERS */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', margin: 0 }}>
              Project Team Allocations
            </h3>
            {canManageProjects && (
              <button onClick={handleOpenAssignModal} className="btn btn-primary" style={{ padding: '8px 16px', gap: '6px', color: '#000' }}>
                <UserCheck size={14} /> Allocate Members
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {!project.members || project.members.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic', gridColumn: '1/-1' }}>No team members assigned.</p>
            ) : (
              project.members.map((member, idx) => {
                const initial = member.username ? member.username.charAt(0).toUpperCase() : '?';
                return (
                  <div key={member.id} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: `linear-gradient(135deg, hsl(215,90%,55%), hsl(190,90%,50%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: '800', color: '#0c0e14', flexShrink: 0
                    }}>
                      {initial}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', margin: 0 }}>{member.username}</p>
                      <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: '2px 0 0 0' }}>
                        {member.role.replace('_', ' ')}
                      </p>
                      {member.email && (
                        <p style={{ fontSize: '0.72rem', color: 'hsl(var(--accent-cyan))', margin: '4px 0 0 0' }}>{member.email}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
          {/* Sidebar Folder list */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', fontWeight: '800' }}>Folders</span>
              <button onClick={() => setIsFolderModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--accent-cyan))' }} title="Create Folder">
                <FolderPlus size={16} />
              </button>
            </div>
            {folders.map(f => (
              <button 
                key={f}
                onClick={() => setActiveFolder(f)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeFolder === f ? 'hsla(190, 90%, 55%, 0.1)' : 'transparent',
                  color: activeFolder === f ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: activeFolder === f ? '700' : '400',
                  transition: 'all 0.2s'
                }}
              >
                <Folder size={16} />
                <span>{f}</span>
              </button>
            ))}
          </div>

          {/* Documents Grid */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0 }}>Folder: {activeFolder}</h3>
              <button onClick={() => setIsUploadModalOpen(true)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#000' }}>
                <Upload size={14} /> Upload Document
              </button>
            </div>
            
            {(() => {
              const filteredDocs = (project.documents || []).filter(doc => (doc.folder_name || 'General') === activeFolder);
              if (filteredDocs.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'hsl(var(--text-muted))' }}>
                    <File size={40} style={{ color: 'hsl(var(--accent-cyan))', marginBottom: '12px' }} />
                    <p>No documents stored in this folder yet.</p>
                  </div>
                );
              }
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {filteredDocs.map(doc => (
                    <div 
                      key={doc.id}
                      className="glass-panel"
                      style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        textAlign: 'center',
                        background: 'hsla(220, 20%, 15%, 0.3)',
                        border: '1px solid hsl(var(--border-glass))',
                        borderRadius: '12px',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'hsla(190, 90%, 55%, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--accent-cyan))' }}>
                        <File size={24} />
                      </div>
                      <div style={{ flex: 1, width: '100%' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }} title={doc.file_name}>
                          {doc.file_name}
                        </h4>
                        <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                          Uploaded by: {doc.uploader_name || 'Member'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '6px' }}>
                        <a 
                          href={doc.file_path.startsWith('http') ? doc.file_path : `http://localhost:5000${doc.file_path}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary" 
                          style={{ flex: 1, padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}
                        >
                          <Eye size={12} /> Preview
                        </a>
                        <a 
                          href={doc.file_path.startsWith('http') ? doc.file_path : `http://localhost:5000${doc.file_path}`} 
                          download 
                          className="btn btn-secondary" 
                          style={{ padding: '6px', fontSize: '0.75rem' }}
                        >
                          <Download size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB CONTENT: BILLING */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Project cost breakdown header */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <DollarSign size={24} style={{ color: 'hsl(var(--accent-cyan))' }} />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', margin: 0 }}>Project Budget vs Spent Analyzer</h3>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', margin: '4px 0 0 0' }}>Compare total labour costs and logged expenses against project limits.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {user && ['admin', 'project_manager', 'manager'].includes(user.role) && (
                <>
                  <button onClick={() => setIsInvoiceModalOpen(true)} className="btn btn-primary" style={{ color: '#000', padding: '8px 16px', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Create Invoice
                  </button>
                  <button onClick={() => setIsExpenseModalOpen(true)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    <Receipt size={16} /> Log Expense
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          {costSummary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: 0 }}>Allocated Budget</p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', margin: '4px 0 0 0' }}>${costSummary.budget || 0}</h2>
                </div>
                <TrendingUp size={24} style={{ color: 'hsl(var(--accent-cyan))' }} />
              </div>
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: 0 }}>Total Expenses</p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--status-high))', margin: '4px 0 0 0' }}>${costSummary.total_expenses || 0}</h2>
                </div>
                <TrendingDown size={24} style={{ color: 'hsl(var(--status-high))' }} />
              </div>
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: 0 }}>Labour Costs</p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--accent-blue))', margin: '4px 0 0 0' }}>${costSummary.total_labour_cost || 0}</h2>
                </div>
                <Clock size={24} style={{ color: 'hsl(var(--accent-blue))' }} />
              </div>
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: 0 }}>Remaining Balance</p>
                  <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '800', 
                    color: costSummary.remaining_budget >= 0 ? 'hsl(var(--status-complete))' : 'hsl(var(--status-high))', 
                    margin: '4px 0 0 0'
                  }}>
                    ${costSummary.remaining_budget !== null ? costSummary.remaining_budget : 'N/A'}
                  </h2>
                </div>
                <DollarSign size={24} style={{ color: costSummary.remaining_budget >= 0 ? 'hsl(var(--status-complete))' : 'hsl(var(--status-high))' }} />
              </div>
            </div>
          )}

          {/* Invoices and expenses tables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {/* Invoices list */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#fff', margin: 0 }}>Project Invoices</h3>
              {invoices.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '30px', margin: 0 }}>No invoices logged for this project.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {invoices.map(inv => (
                    <div key={inv.id} className="glass-panel" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsla(220, 20%, 15%, 0.3)' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', margin: 0 }}>{inv.invoice_number}</h4>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '2px 8px', 
                          borderRadius: '10px', 
                          background: inv.status === 'paid' ? 'hsla(145, 75%, 45%, 0.15)' : 'hsla(45, 80%, 55%, 0.15)',
                          color: inv.status === 'paid' ? 'hsl(var(--status-complete))' : 'hsl(var(--status-pending))',
                          fontWeight: '700',
                          display: 'inline-block',
                          marginTop: '6px'
                        }}>
                          {inv.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>${inv.amount}</span>
                        {inv.status !== 'paid' && (
                          <button onClick={() => handlePayInvoice(inv.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}>
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses list */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#fff', margin: 0 }}>Logged Expenses</h3>
              {expenses.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '30px', margin: 0 }}>No expenses logged for this project.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {expenses.map(exp => (
                    <div key={exp.id} className="glass-panel" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsla(220, 20%, 15%, 0.3)' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', margin: 0 }}>{exp.description || 'General Expense'}</h4>
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'hsla(220,20%,20%,0.6)', border: '1px solid hsl(var(--border-glass))', borderRadius: '4px', display: 'inline-block', marginTop: '6px', color: 'hsl(var(--accent-cyan))' }}>
                          Category: {exp.category}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: 'hsl(var(--status-high))' }}>-${exp.amount}</span>
                        <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', margin: '4px 0 0 0' }}>
                          By: {exp.logged_by_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {isFolderModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Create Folder</h3>
              <button onClick={() => setIsFolderModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateFolder}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Folder Name</label>
                <input type="text" placeholder="e.g. Layout Specifications" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>
                Add Folder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Upload Document</h3>
              <button onClick={() => setIsUploadModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleFileUpload(); setIsUploadModalOpen(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Choose File</label>
                <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} required />
              </div>
              <div className="form-group">
                <label className="form-label">Target Folder</label>
                <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)}>
                  {folders.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>
                Upload & Register
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Generate Invoice</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Invoice Number</label>
                <input type="text" placeholder="e.g. INV-2026-001" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Billing Amount ($)</label>
                <input type="number" step="0.01" placeholder="99.99" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Client</label>
                <select value={invoiceClientId} onChange={(e) => setInvoiceClientId(e.target.value)}>
                  <option value="">Select Target Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.username} ({c.email})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000', marginTop: '10px' }}>
                Generate & Send Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOG EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Log Project Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Expense Amount ($)</label>
                <input type="number" step="0.01" placeholder="e.g. 150.00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" placeholder="e.g. AWS hosting charges" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                  <option value="hosting">Cloud Infrastructure / Hosting</option>
                  <option value="marketing">Advertising & Marketing</option>
                  <option value="software">Software Licenses / SaaS subscriptions</option>
                  <option value="hardware">Workstations & Hardware</option>
                  <option value="office">Office Spaces & Rent</option>
                  <option value="other">Other Expenses</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000', marginTop: '10px' }}>
                Log Expense
              </button>
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
                <div key={member.id} onClick={() => handleToggleMember(member.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: assignedUsers.includes(member.id) ? 'hsla(190, 90%, 50%, 0.08)' : 'hsla(220, 20%, 25%, 0.15)', border: assignedUsers.includes(member.id) ? '1px solid hsla(190, 90%, 50%, 0.35)' : '1px solid hsl(var(--border-glass))', borderRadius: '10px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={assignedUsers.includes(member.id)} 
                    readOnly
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', margin: 0 }}>{member.username}</p>
                    <p style={{ fontSize: '0.70rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', margin: 0, marginTop: '2px' }}>{member.role.replace('_', ' ')}</p>
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

      {/* QUICK ADD TASK MODAL */}
      {isQuickTaskOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Add Task to {project.name}</h3>
              <button onClick={() => setIsQuickTaskOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleQuickCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" placeholder="Title" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea placeholder="Description" rows={3} value={quickDesc} onChange={(e) => setQuickDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select value={quickPriority} onChange={(e) => setQuickPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" value={quickDueDate} onChange={(e) => setQuickDueDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select value={quickAssignedTo} onChange={(e) => setQuickAssignedTo(e.target.value)}>
                  <option value="">Select Assignee</option>
                  {(project.members || teamMembers).filter(m => m.role !== 'client').map(member => (
                    <option key={member.id} value={member.id}>{member.username}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>Save Task</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetails;
