import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Folder, CheckCircle2, Clock, Users, ArrowUpRight, Calendar, Activity, ListTodo, FolderPlus, Play, PlusCircle, X, Mail, Shield, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import StudentDashboard from './academic/StudentDashboard';
import GuideDashboard from './academic/GuideDashboard';
import HodDashboard from './academic/HodDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  if (user?.role === 'student') {
    return <StudentDashboard />;
  }
  if (user?.role === 'guide') {
    return <GuideDashboard />;
  }
  if (user?.role === 'hod') {
    return <HodDashboard />;
  }
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTeamModal, setShowTeamModal] = useState(false);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [resProj, resTasks, resTime, resAttend, resTeam] = await Promise.all([
        fetch('/api/projects', { headers }),
        fetch('/api/tasks', { headers }),
        fetch('/api/team/time', { headers }),
        fetch('/api/team/attendance', { headers }),
        fetch('/api/team', { headers })
      ]);

      if (resProj.ok) setProjects(await resProj.json());
      if (resTasks.ok) setTasks(await resTasks.json());
      if (resTime.ok) setTimeLogs(await resTime.json());
      if (resAttend.ok) setAttendance(await resAttend.json());
      if (resTeam.ok) setTeamMembers(await resTeam.json());

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading workspace analytics...</div>;
  }

  // 1. Core Real-time Counts
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  const totalTasks = tasks.length;
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasksCount = tasks.filter(t => t.status === 'in_progress' || t.status === 'testing').length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

  const totalTeamMembers = teamMembers.length;

  // 2. Today's Attendance & Active Members
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayAttendanceLogs = attendance.filter(log => {
    if (!log.date) return false;
    const logDateStr = typeof log.date === 'string' ? log.date.split('T')[0] : new Date(log.date).toISOString().split('T')[0];
    return logDateStr === todayStr;
  });
  const todayAttendanceCount = todayAttendanceLogs.length;
  const activeTeamCount = todayAttendanceLogs.filter(log => !log.check_out).length;

  // 3. Overdue Tasks
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < now;
  });
  const overdueTasksCount = overdueTasks.length;

  // 4. Projects at Risk (Incomplete projects with at least one overdue task)
  const projectsAtRisk = projects.filter(p => {
    if (p.status === 'completed') return false;
    const projectTasks = tasks.filter(t => t.project_id === p.id);
    return projectTasks.some(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < now;
    });
  });
  const projectsAtRiskCount = projectsAtRisk.length;

  // 5. Recent Task Assignments
  const recentAssignments = [...tasks]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 4);

  // 6. Project Status Donut chart dataset
  const projectStatusData = [
    { name: 'Pending', value: projects.filter(p => p.status === 'pending').length, color: 'hsl(var(--status-pending))' },
    { name: 'In Progress', value: activeProjects, color: 'hsl(var(--status-progress))' },
    { name: 'Completed', value: completedProjects, color: 'hsl(var(--status-complete))' }
  ];

  // 7. Tasks Status Donut chart dataset
  const donutData = [
    { name: 'Completed', value: completedTasksCount, color: 'hsl(var(--status-complete))' },
    { name: 'In Progress', value: inProgressTasksCount, color: 'hsl(var(--status-progress))' },
    { name: 'Pending', value: pendingTasksCount, color: 'hsl(var(--status-pending))' }
  ];

  // 8. Recharts: Dynamic Monthly Progress (Project Overview Area Chart)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
    monthlyMap[label] = { month: label, projects: 0, tasks: 0 };
  }
  projects.forEach(p => {
    if (!p.created_at) return;
    const date = new Date(p.created_at);
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
    if (monthlyMap[label]) {
      monthlyMap[label].projects += 1;
    }
  });
  tasks.forEach(t => {
    if (!t.created_at) return;
    const date = new Date(t.created_at);
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
    if (monthlyMap[label]) {
      monthlyMap[label].tasks += 1;
    }
  });
  const areaData = Object.values(monthlyMap);

  // 9. Team Productivity Hours (Hours logged per user from actual time logs)
  const userPerformance = {};
  timeLogs.forEach(log => {
    const hours = log.duration_seconds / 3600;
    const name = log.username || (log.Users && log.Users.username) || `User ${log.user_id}`;
    if (!userPerformance[name]) {
      userPerformance[name] = 0;
    }
    userPerformance[name] += hours;
  });
  const performanceArray = Object.keys(userPerformance).map(username => ({
    username,
    hours: parseFloat(userPerformance[username].toFixed(1))
  })).sort((a, b) => b.hours - a.hours);

  const teamProductivityData = performanceArray.map(item => ({
    name: item.username,
    Hours: item.hours
  }));

  // 10. Chronological Recent Activities dynamically aggregated from existing tables
  const activities = [];

  timeLogs.forEach(log => {
    const name = log.username || (log.Users && log.Users.username) || 'Someone';
    activities.push({
      type: 'time',
      user: name,
      text: `logged ${(log.duration_seconds / 3600).toFixed(1)} hours on "${log.task_title || log.project_name || 'Task'}"`,
      desc: log.description || '',
      time: new Date(log.logged_at || Date.now())
    });
  });

  attendance.forEach(log => {
    const name = log.username || (log.Users && log.Users.username) || 'Someone';
    activities.push({
      type: 'attendance',
      user: name,
      text: `checked in today`,
      desc: log.check_out ? `checked out at ${log.check_out}` : 'active session',
      time: new Date(log.date)
    });
  });

  projects.forEach(p => {
    const managerName = (p.Users && p.Users.username) || 'Manager';
    activities.push({
      type: 'project_create',
      user: managerName,
      text: `created project "${p.name}"`,
      desc: p.description || '',
      time: new Date(p.created_at || Date.now())
    });
  });

  tasks.forEach(t => {
    const assignedName = (t.Users && t.Users.username) || 'Unassigned';
    activities.push({
      type: 'task_assign',
      user: 'System',
      text: `assigned task "${t.title}" to ${assignedName}`,
      desc: t.description || '',
      time: new Date(t.created_at || Date.now())
    });
  });

  teamMembers.forEach(member => {
    activities.push({
      type: 'member_add',
      user: member.username,
      text: `joined the team as ${member.role.replace('_', ' ')}`,
      desc: member.email || '',
      time: new Date(member.created_at || Date.now())
    });
  });

  activities.sort((a, b) => b.time - a.time);
  const activeFeed = activities.slice(0, 6);

  // 11. Filter Upcoming Deadlines
  const upcomingDeadlines = tasks
    .filter(t => t.due_date && t.status !== 'completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 4);

  const canManageProjects = user && ['admin', 'project_manager'].includes(user.role);
  const canCreateTask = user && ['admin', 'project_manager', 'team_member', 'member'].includes(user.role);

  return (
    <div style={{ textAlign: 'left' }}>
      
      {/* Welcome Banner Card */}
      <div className="glass-panel" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, hsla(190, 90%, 50%, 0.08), hsla(220, 20%, 25%, 0.15))',
        borderRadius: '16px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid hsla(190, 90%, 50%, 0.15)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', marginBottom: '6px' }}>
            Welcome Back, {user?.username || 'Guest'}!
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', maxWidth: '600px', lineHeight: '1.5' }}>
            Track project deliverables, verify workflow metrics, log stopwatch slots, and message team members in real-time.
          </p>
        </div>
        <div style={{
          padding: '12px 20px',
          background: 'hsla(0, 0%, 100%, 0.03)',
          borderRadius: '10px',
          border: '1px solid hsl(var(--border-glass))',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'hsl(var(--accent-cyan))', fontWeight: '800', letterSpacing: '0.5px' }}>
            Database Integrity
          </span>
          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>Operational</div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>

        {/* Pending Tasks */}
        <button
          id="quick-action-pending-tasks"
          onClick={() => navigate('/tasks/pending')}
          style={{
            background: 'linear-gradient(135deg, hsla(40, 90%, 55%, 0.12), hsla(40, 90%, 55%, 0.04))',
            border: '1px solid hsla(40, 90%, 55%, 0.25)',
            borderRadius: '14px',
            padding: '18px 16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '10px',
            transition: 'all 0.25s ease',
            textAlign: 'left',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 24px hsla(40, 90%, 55%, 0.2)';
            e.currentTarget.style.borderColor = 'hsla(40, 90%, 55%, 0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'hsla(40, 90%, 55%, 0.25)';
          }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'hsla(40, 90%, 55%, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ListTodo size={20} style={{ color: 'hsl(40, 90%, 55%)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Pending Tasks</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'hsl(40, 90%, 55%)', lineHeight: 1.2, marginTop: '2px' }}>
              {pendingTasksCount}
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'hsla(40, 90%, 55%, 0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <ArrowUpRight size={12} />
          </div>
        </button>

        {/* Create Project */}
        {canManageProjects && (
          <button
            id="quick-action-create-project"
            onClick={() => navigate('/projects/create')}
            style={{
              background: 'linear-gradient(135deg, hsla(215, 90%, 55%, 0.12), hsla(215, 90%, 55%, 0.04))',
              border: '1px solid hsla(215, 90%, 55%, 0.25)',
              borderRadius: '14px',
              padding: '18px 16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '10px',
              transition: 'all 0.25s ease',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 24px hsla(215, 90%, 55%, 0.2)';
              e.currentTarget.style.borderColor = 'hsla(215, 90%, 55%, 0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'hsla(215, 90%, 55%, 0.25)';
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'hsla(215, 90%, 55%, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FolderPlus size={20} style={{ color: 'hsl(215, 90%, 65%)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Create Project</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'hsl(215, 90%, 65%)', lineHeight: 1.2, marginTop: '2px' }}>New Project</div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'hsla(215, 90%, 65%, 0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Go to Projects <ArrowUpRight size={12} />
            </div>
          </button>
        )}

        {/* Running Projects */}
        <button
          id="quick-action-running-projects"
          onClick={() => navigate('/projects')}
          style={{
            background: 'linear-gradient(135deg, hsla(145, 75%, 45%, 0.12), hsla(145, 75%, 45%, 0.04))',
            border: '1px solid hsla(145, 75%, 45%, 0.25)',
            borderRadius: '14px',
            padding: '18px 16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '10px',
            transition: 'all 0.25s ease',
            textAlign: 'left',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 24px hsla(145, 75%, 45%, 0.25)';
            e.currentTarget.style.borderColor = 'hsla(145, 75%, 45%, 0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'hsla(145, 75%, 45%, 0.25)';
          }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'hsla(145, 75%, 45%, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Play size={20} style={{ color: 'hsl(145, 75%, 55%)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Running Projects</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'hsl(145, 75%, 55%)', lineHeight: 1.2, marginTop: '2px' }}>
              {projects.filter(p => p.status === 'in_progress').length}
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'hsla(145, 75%, 55%, 0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View Projects <ArrowUpRight size={12} />
          </div>
        </button>

        {/* Create Task */}
        {canCreateTask && (
          <button
            id="quick-action-create-task"
            onClick={() => navigate('/tasks/create')}
            style={{
              background: 'linear-gradient(135deg, hsla(260, 80%, 65%, 0.12), hsla(260, 80%, 65%, 0.04))',
              border: '1px solid hsla(260, 80%, 65%, 0.25)',
              borderRadius: '14px',
              padding: '18px 16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '10px',
              transition: 'all 0.25s ease',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 24px hsla(260, 80%, 65%, 0.2)';
              e.currentTarget.style.borderColor = 'hsla(260, 80%, 65%, 0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'hsla(260, 80%, 65%, 0.25)';
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'hsla(260, 80%, 65%, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <PlusCircle size={20} style={{ color: 'hsl(260, 80%, 75%)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Create Task</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'hsl(260, 80%, 75%)', lineHeight: 1.2, marginTop: '2px' }}>New Task</div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'hsla(260, 80%, 75%, 0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Go to Tasks <ArrowUpRight size={12} />
            </div>
          </button>
        )}

      </div>

      {/* Numerical Counter Metric Cards */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>

        {/* Total Projects Card */}
        <div
          id="metric-total-projects"
          className="glass-panel metric-card"
          onClick={() => navigate('/projects')}
          style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 30px hsla(215, 90%, 55%, 0.25)';
            e.currentTarget.style.borderColor = 'hsla(215, 90%, 55%, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '';
            e.currentTarget.style.borderColor = '';
          }}
        >
          <div className="metric-icon" style={{ background: 'hsla(215, 90%, 55%, 0.1)', color: 'hsl(var(--accent-blue))' }}>
            <Folder size={20} />
          </div>
          <div className="metric-info">
            <h3>Total Projects</h3>
            <p>{totalProjects}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--accent-cyan))', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              Active: {activeProjects} | Done: {completedProjects}
            </span>
          </div>
        </div>

        {/* Completed Tasks Card */}
        <div
          id="metric-completed-tasks"
          className="glass-panel metric-card"
          onClick={() => navigate('/tasks')}
          style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 30px hsla(145, 75%, 45%, 0.25)';
            e.currentTarget.style.borderColor = 'hsla(145, 75%, 45%, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '';
            e.currentTarget.style.borderColor = '';
          }}
        >
          <div className="metric-icon" style={{ background: 'hsla(145, 75%, 45%, 0.1)', color: 'hsl(var(--status-complete))' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="metric-info">
            <h3>Completed Tasks</h3>
            <p>{completedTasksCount}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--accent-cyan))', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
              Total Tasks: {totalTasks}
            </span>
          </div>
        </div>

        {/* Running Tasks Card */}
        <div
          id="metric-running-tasks"
          className="glass-panel metric-card"
          onClick={() => navigate('/tasks')}
          style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 30px hsla(40, 90%, 55%, 0.25)';
            e.currentTarget.style.borderColor = 'hsla(40, 90%, 55%, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '';
            e.currentTarget.style.borderColor = '';
          }}
        >
          <div className="metric-icon" style={{ background: 'hsla(40, 90%, 55%, 0.1)', color: 'hsl(var(--status-pending))' }}>
            <Clock size={20} />
          </div>
          <div className="metric-info">
            <h3>Running Tasks</h3>
            <p>{inProgressTasksCount}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--status-pending))', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
              Pending: {pendingTasksCount}
            </span>
          </div>
        </div>

        {/* Team Members Card */}
        <div
          id="metric-team-members"
          className="glass-panel metric-card"
          onClick={() => navigate('/team')}
          style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 30px hsla(260, 80%, 65%, 0.25)';
            e.currentTarget.style.borderColor = 'hsla(260, 80%, 65%, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '';
            e.currentTarget.style.borderColor = '';
          }}
        >
          <div className="metric-icon" style={{ background: 'hsla(260, 80%, 65%, 0.1)', color: 'hsl(var(--accent-purple))' }}>
            <Users size={20} />
          </div>
          <div className="metric-info">
            <h3>Team Members</h3>
            <p>{totalTeamMembers}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--accent-purple))', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
              Click to view all
            </span>
          </div>
        </div>

      </div>



      {/* Main Row: Project Overview Line/Area Chart & Tasks Status Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Project Overview Line/Area Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'hsl(var(--accent-cyan))' }} /> Project Overview
          </h3>
          
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent-cyan))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--accent-cyan))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="hsl(var(--text-muted))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--text-muted))" fontSize={11} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'hsl(var(--bg-secondary))', borderColor: 'hsl(var(--border-glass))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--text-main))', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="hsl(var(--accent-cyan))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProjects)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks Status Donut chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '16px' }}>
            Tasks Status
          </h3>

          <div style={{ width: '100%', height: '160px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Absolute center number */}
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>{tasks.length}</span>
              <p style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '-2px' }}>Total</p>
            </div>
          </div>

          {/* Donut Labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {donutData.map((d, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                  <span style={{ color: 'hsl(var(--text-muted))' }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: '700', color: 'hsl(var(--text-main))' }}>
                  {d.value} ({tasks.length > 0 ? Math.round((d.value / tasks.length) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Productivity & Status Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Team Productivity Summary (BarChart showing total hours logged per user) */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '20px' }}>
            Team Productivity Summary (Hours Logged)
          </h3>
          {teamProductivityData.length === 0 ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
              No logged time recorded.
            </div>
          ) : (
            <div style={{ width: '100%', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamProductivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--text-muted))" fontSize={10} tickLine={false} />
                  <YAxis stroke="hsl(var(--text-muted))" fontSize={10} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'hsl(var(--bg-secondary))', borderColor: 'hsl(var(--border-glass))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--text-main))', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Hours" fill="hsl(var(--accent-cyan))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Project Status Distribution Donut Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '16px' }}>
            Projects Status Distribution
          </h3>

          <div style={{ width: '100%', height: '120px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={55}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>{totalProjects}</span>
              <p style={{ fontSize: '0.6rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '-2px' }}>Total</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', gap: '8px', marginTop: '12px' }}>
            {projectStatusData.map((d, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.color }} />
                  <span style={{ color: 'hsl(var(--text-muted))' }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: '700', color: 'hsl(var(--text-main))' }}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Row: Recent Activities, Assignments & Upcoming Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Left Column: Recent Activities */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'hsl(var(--accent-cyan))' }} /> Recent Activities
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
            {activeFeed.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', fontStyle: 'italic', padding: '20px 0' }}>
                No recent actions recorded.
              </p>
            ) : (
              activeFeed.map((act, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  paddingBottom: '10px',
                  borderBottom: index !== activeFeed.length - 1 ? '1px solid hsl(var(--border-glass))' : 'none'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: act.type === 'time' ? 'hsl(var(--accent-cyan))' : 'hsl(var(--status-complete))',
                    marginTop: '6px',
                    boxShadow: act.type === 'time' ? '0 0 6px hsl(var(--accent-cyan))' : 'none'
                  }} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-main))', lineHeight: 1.3, margin: 0 }}>
                        <strong>{act.user}</strong> {act.text}
                      </p>
                      <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginLeft: '8px', flexShrink: 0 }}>
                        {(() => {
                          try {
                            const d = new Date(act.time);
                            const todayStr = new Date().toDateString();
                            if (d.toDateString() === todayStr) {
                              return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            }
                            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                          } catch {
                            return 'recent';
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle Column: Recent Task Assignments */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListTodo size={16} style={{ color: 'hsl(var(--accent-cyan))' }} /> Recent Assignments
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
            {recentAssignments.length === 0 ? (
              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
                No recent task assignments.
              </div>
            ) : (
              recentAssignments.map((task) => (
                <div 
                  key={task.id} 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'hsla(220, 20%, 25%, 0.15)',
                    border: '1px solid hsl(var(--border-glass))',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--text-main))', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                      {task.title}
                    </h4>
                    <span className={`task-priority-badge priority-${task.priority}`} style={{ fontSize: '0.55rem', padding: '1px 5px', display: 'inline-block', lineHeight: 1 }}>
                      {task.priority}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'hsl(var(--text-muted))' }}>
                    <span>Project: {task.project_name || `ID ${task.project_id}`}</span>
                    <span>
                      {(() => {
                        try {
                          const d = new Date(task.created_at || Date.now());
                          const todayStr = new Date().toDateString();
                          if (d.toDateString() === todayStr) {
                            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }
                          return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        } catch {
                          return 'recent';
                        }
                      })()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Deadlines */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: 'hsl(var(--accent-cyan))' }} /> Upcoming Deadlines
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
            {upcomingDeadlines.length === 0 ? (
              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
                No active tasks due. Keep it up!
              </div>
            ) : (
              upcomingDeadlines.map((task) => (
                <div 
                  key={task.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'hsla(220, 20%, 25%, 0.15)',
                    border: '1px solid hsl(var(--border-glass))',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--text-main))', margin: 0 }}>
                      {task.title}
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                      Project: {task.project_name || `ID ${task.project_id}`}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`task-priority-badge priority-${task.priority}`} style={{ fontSize: '0.55rem', padding: '2px 6px', display: 'inline-block', marginBottom: '4px' }}>
                      {task.priority}
                    </span>
                    <p style={{ fontSize: '0.68rem', color: 'hsl(var(--status-pending))', fontWeight: '600', margin: 0 }}>
                      Due: {(() => {
                        try {
                          const d = new Date(task.due_date);
                          return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        } catch {
                          return task.due_date;
                        }
                      })()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── Team Members Modal ── */}
      {showTeamModal && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setShowTeamModal(false); }}
          style={{ zIndex: 1000 }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '700px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid hsla(260, 80%, 65%, 0.3)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px hsla(260,80%,65%,0.1)',
              animation: 'fadeIn 0.25s ease'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '22px 28px',
              borderBottom: '1px solid hsl(var(--border-glass))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'hsla(260, 80%, 65%, 0.06)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'hsla(260, 80%, 65%, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Users size={20} style={{ color: 'hsl(260, 80%, 75%)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>Team Members</h3>
                  <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', margin: 0, marginTop: '2px' }}>
                    {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} in workspace
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTeamModal(false)}
                style={{
                  background: 'hsla(0,0%,100%,0.05)', border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'hsl(var(--text-muted))', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'hsla(0,85%,60%,0.15)'; e.currentTarget.style.color = 'hsl(0,85%,65%)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'hsla(0,0%,100%,0.05)'; e.currentTarget.style.color = 'hsl(var(--text-muted))'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Members List */}
            <div style={{ overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {teamMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No team members found.
                </div>
              ) : (
                teamMembers.map((member, index) => {
                  const initial = member.username ? member.username.charAt(0).toUpperCase() : '?';
                  const roleConfig = {
                    admin:           { label: 'Admin',           bg: 'hsla(0,85%,60%,0.12)',   color: 'hsl(0,85%,65%)',   border: 'hsla(0,85%,60%,0.3)' },
                    project_manager: { label: 'Project Manager', bg: 'hsla(260,80%,65%,0.12)', color: 'hsl(260,80%,70%)', border: 'hsla(260,80%,65%,0.3)' },
                    team_member:     { label: 'Team Member',     bg: 'hsla(190,90%,50%,0.12)', color: 'hsl(190,90%,55%)', border: 'hsla(190,90%,50%,0.3)' },
                    client:          { label: 'Client',          bg: 'hsla(40,90%,55%,0.12)',  color: 'hsl(40,90%,60%)',  border: 'hsla(40,90%,55%,0.3)' },
                  };
                  const rc = roleConfig[member.role] || roleConfig.team_member;
                  const avatarColors = [
                    ['hsl(215,90%,55%)', 'hsl(190,90%,50%)'],
                    ['hsl(260,80%,65%)', 'hsl(215,90%,55%)'],
                    ['hsl(145,75%,45%)', 'hsl(190,90%,50%)'],
                    ['hsl(40,90%,55%)',  'hsl(0,85%,60%)'],
                  ];
                  const [c1, c2] = avatarColors[index % avatarColors.length];

                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        background: 'hsla(220, 20%, 16%, 0.5)',
                        border: '1px solid hsl(var(--border-glass))',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'hsla(260,80%,65%,0.06)';
                        e.currentTarget.style.borderColor = 'hsla(260,80%,65%,0.25)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'hsla(220, 20%, 16%, 0.5)';
                        e.currentTarget.style.borderColor = 'hsl(var(--border-glass))';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {/* Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '50%',
                          background: `linear-gradient(135deg, ${c1}, ${c2})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.1rem', fontWeight: '800', color: '#0c0e14'
                        }}>
                          {initial}
                        </div>
                        {/* Online dot */}
                        <div style={{
                          position: 'absolute', bottom: '2px', right: '2px',
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: 'hsl(145,75%,50%)',
                          border: '2px solid hsl(var(--bg-secondary))',
                          boxShadow: '0 0 6px hsla(145,75%,50%,0.6)'
                        }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'hsl(var(--text-main))' }}>
                            {member.username}
                          </span>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                            letterSpacing: '0.05em', padding: '2px 8px', borderRadius: '20px',
                            background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`
                          }}>
                            {rc.label}
                          </span>
                        </div>
                        {member.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={11} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {member.email}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Member number badge */}
                      <div style={{
                        flexShrink: 0,
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'hsla(260,80%,65%,0.1)',
                        border: '1px solid hsla(260,80%,65%,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: '700', color: 'hsl(260,80%,70%)'
                      }}>
                        #{index + 1}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 28px',
              borderTop: '1px solid hsl(var(--border-glass))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              background: 'hsla(220,20%,12%,0.3)'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                Showing all {teamMembers.length} workspace members
              </span>
              <button
                onClick={() => { setShowTeamModal(false); navigate('/team'); }}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.8rem', color: '#000', gap: '6px' }}
              >
                <Users size={13} /> Manage Team
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
