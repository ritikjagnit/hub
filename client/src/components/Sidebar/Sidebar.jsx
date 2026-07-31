import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, BarChart3, MessageSquare, Play, Pause, Square, Calendar as CalendarIcon, Settings as SettingsIcon, Menu, X, CalendarDays, Milestone, FileText, CreditCard, Bot, Link, Shield, Briefcase, Compass, Award } from 'lucide-react';

const Sidebar = () => {
  const { user, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Stopwatch states
  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [logDesc, setLogDesc] = useState('');

  useEffect(() => {
    if (token) {
      fetchProjectsAndTasks();
    }
  }, [token]);

  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const fetchProjectsAndTasks = async () => {
    try {
      const resProj = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resProj.ok) {
        const data = await resProj.json();
        setProjects(data);
        if (data.length > 0) setSelectedProject(data[0].id.toString());
      }

      const resTasks = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resTasks.ok) {
        const data = await resTasks.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const handleStartPause = () => {
    setTimerActive(!timerActive);
  };

  const handleLogTime = async () => {
    if (seconds === 0) return;
    if (!selectedProject) {
      alert('Please select a project to log your time to.');
      return;
    }

    try {
      const res = await fetch('/api/team/time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: parseInt(selectedProject),
          task_id: selectedTask ? parseInt(selectedTask) : null,
          duration_seconds: seconds,
          description: logDesc || 'Logged work duration'
        })
      });

      if (res.ok) {
        alert('Work time logged successfully!');
        setSeconds(0);
        setTimerActive(false);
        setLogDesc('');
      } else {
        const data = await res.json();
        alert('Logging failed: ' + data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  // Filter tasks based on selected project
  const filteredTasks = tasks.filter(t => t.project_id === parseInt(selectedProject));

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} color="hsl(190,90%,55%)" />
      </button>

      {/* Backdrop overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`glass-panel ${sidebarOpen ? 'sidebar-open' : ''}`} style={{
      width: '280px',
      margin: '16px 0 16px 24px',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid hsl(var(--border-glass))'
    }}>
      {/* Brand logo header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        borderBottom: '1px solid hsl(var(--border-glass))'
      }}>
        <img src="/logo.png" alt="Project Hub" style={{ height: '52px', width: 'auto', objectFit: 'contain', display: 'block' }} />
        <button
          onClick={() => setSidebarOpen(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          aria-label="Close menu"
        >
          <X size={20} color="hsl(218,15%,55%)" />
        </button>
      </div>

      {/* Navigation menu list */}
      <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }} onClick={() => setSidebarOpen(false)}>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <LayoutDashboard size={16} /> Dashboard
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/projects" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <FolderKanban size={16} /> Projects
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <CheckSquare size={16} /> Tasks
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/calendar" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <CalendarIcon size={16} /> Calendar
            </span>
          )}
        </NavLink>


        <NavLink 
          to="/reports" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <BarChart3 size={16} /> Reports
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/chat" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <MessageSquare size={16} /> Team Chat
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/team" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <Users size={16} /> Team
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/meetings" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <CalendarDays size={16} /> Meetings Sync
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/documents" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <FileText size={16} /> Cloud Drive
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/billing" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <CreditCard size={16} /> Invoices & Billing
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/ai-assistant" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <Bot size={16} /> Ascent AI Core
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/integrations" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <Link size={16} /> Integrations API
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/workspace" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <Briefcase size={16} /> Workspace
            </span>
          )}
        </NavLink>

        {['student', 'guide', 'hod', 'admin'].includes(user?.role) && (
          <>
            <div style={{
              padding: '12px 12px 6px 12px',
              fontSize: '0.65rem',
              fontWeight: '800',
              color: 'hsl(var(--accent-purple))',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Academic Portal
            </div>

            <NavLink 
              to="/academic/thesis" 
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
            >
              {({ isActive }) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                  <FileText size={16} /> Thesis Workspace
                </span>
              )}
            </NavLink>

            <NavLink 
              to="/academic/research" 
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
            >
              {({ isActive }) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                  <Compass size={16} /> Research Library
                </span>
              )}
            </NavLink>

            <NavLink 
              to="/academic/certificate" 
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
            >
              {({ isActive }) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                  <Award size={16} /> Certificates Portal
                </span>
              )}
            </NavLink>
          </>
        )}

        {user?.role === 'admin' && (
          <NavLink 
            to="/admin" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
          >
            {({ isActive }) => (
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                <Shield size={16} /> Administration
              </span>
            )}
          </NavLink>
        )}

        <NavLink 
          to="/settings" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#fff', background: 'transparent', border: 'none', padding: '10px 12px' }}
        >
          {({ isActive }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              <SettingsIcon size={16} /> Settings
            </span>
          )}
        </NavLink>
      </nav>

      {/* compact stopwatch logging widget */}
      <div className="stopwatch-widget" style={{ borderTop: '1px solid hsl(var(--border-glass))', background: 'hsla(222, 22%, 13%, 0.25)', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '800' }}>
            Tracker
          </span>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-cyan))', fontFamily: 'monospace', fontWeight: '800' }}>
            {formatTime(seconds)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button 
            onClick={handleStartPause} 
            className={`btn ${timerActive ? 'btn-secondary' : 'btn-primary'}`} 
            style={{ padding: '4px 8px', fontSize: '0.7rem', flex: 1, color: timerActive ? '#fff' : '#000' }}
          >
            {timerActive ? <Pause size={10} /> : <Play size={10} />} {timerActive ? 'Pause' : 'Start'}
          </button>
          <button 
            onClick={handleLogTime} 
            disabled={seconds === 0} 
            className="btn btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '0.7rem', opacity: seconds === 0 ? 0.5 : 1 }}
          >
            <Square size={10} /> Log
          </button>
        </div>

        {seconds > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.3s ease', marginTop: '8px' }}>
            <select 
              value={selectedProject} 
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedTask('');
              }}
              style={{ fontSize: '0.7rem', padding: '4px' }}
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select 
              value={selectedTask} 
              onChange={(e) => setSelectedTask(e.target.value)} 
              style={{ fontSize: '0.7rem', padding: '4px' }}
              disabled={!selectedProject}
            >
              <option value="">Select Task</option>
              {filteredTasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>

            <input 
              type="text" 
              placeholder="Description Note" 
              value={logDesc} 
              onChange={(e) => setLogDesc(e.target.value)} 
              style={{ fontSize: '0.7rem', padding: '4px' }}
            />
          </div>
        )}
      </div>

      {/* User profile footer card */}
      <NavLink to="/profile" style={{
        padding: '12px 16px',
        borderTop: '1px solid hsl(var(--border-glass))',
        background: 'hsla(222, 22%, 13%, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
      className={({ isActive }) => isActive ? 'profile-active' : ''}
      onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(222, 22%, 18%, 0.8)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'hsla(222, 22%, 13%, 0.5)'}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-cyan)))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '800',
          fontSize: '0.85rem',
          color: '#0c0e14',
          textTransform: 'uppercase',
          flexShrink: 0
        }}>
          {user.username ? user.username.charAt(0) : 'U'}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2, margin: 0 }}>
            {user.username}
          </p>
          <p style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px', margin: 0 }}>
            {user.role.replace('_', ' ')}
          </p>
        </div>
      </NavLink>

    </aside>
    </>
  );
};

export default Sidebar;
