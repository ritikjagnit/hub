import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Download, Printer, Users, FolderKanban, CheckSquare, Clock, Plus, X, FolderPlus, Play, Square, Timer } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const Reports = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Project Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDeadline, setProjDeadline] = useState('');
  const [projStatus, setProjStatus] = useState('pending');
  const [creating, setCreating] = useState(false);

  // Attendance Timer state
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const timerRef = useRef(null);

  // Find today's attendance record for the logged-in user
  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayLog = attendance.find(l => {
    const logDate = l.date ? (l.date.includes('T') ? l.date.split('T')[0] : l.date) : '';
    return logDate === todayStr && l.username === user?.username;
  });
  const isCheckedIn = !!(myTodayLog?.check_in);
  const isCheckedOut = !!(myTodayLog?.check_out);
  const isActiveSession = isCheckedIn && !isCheckedOut;

  useEffect(() => {
    if (token) {
      fetchReportData();
    }
  }, [token]);

  // Live timer tick every second when session is active
  useEffect(() => {
    if (isActiveSession && myTodayLog?.check_in) {
      const parseCheckIn = (t) => {
        if (!t) return null;
        if (t.includes('T')) return new Date(t);
        const d = new Date().toISOString().split('T')[0];
        return new Date(`${d}T${t.split(' ')[0]}`);
      };
      const startTime = parseCheckIn(myTodayLog.check_in);
      const tick = () => {
        const diffSec = Math.floor((new Date() - startTime) / 1000);
        setLiveSeconds(Math.max(0, diffSec));
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(timerRef.current);
      setLiveSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isActiveSession, myTodayLog?.check_in]);

  const formatLiveTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const res = await fetch('/api/team/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'check_in' })
      });
      if (res.ok) { fetchReportData(); }
      else { alert('Check-in failed'); }
    } catch (err) { console.error(err); }
    finally { setCheckInLoading(false); }
  };

  const handleCheckOut = async () => {
    setCheckInLoading(true);
    try {
      const res = await fetch('/api/team/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'check_out' })
      });
      if (res.ok) { fetchReportData(); }
      else { alert('Check-out failed'); }
    } catch (err) { console.error(err); }
    finally { setCheckInLoading(false); }
  };

  const fetchReportData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resProj, resTasks, resTime, resAttend] = await Promise.all([
        fetch('/api/projects', { headers }),
        fetch('/api/tasks', { headers }),
        fetch('/api/team/time', { headers }),
        fetch('/api/team/attendance', { headers })
      ]);

      if (resProj.ok) setProjects(await resProj.json());
      if (resTasks.ok) setTasks(await resTasks.json());
      if (resTime.ok) setTimeLogs(await resTime.json());
      if (resAttend.ok) setAttendance(await resAttend.json());
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreating(true);
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
        setProjName(''); setProjDesc(''); setProjDeadline(''); setProjStatus('pending');
        fetchReportData();
      } else {
        alert('Failed to create project');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating project');
    } finally {
      setCreating(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // ── Sheet 1: Projects ──────────────────────────────────────
      const projectsData = projects.map(proj => {
        const projTasks = tasks.filter(t => t.project_id === proj.id);
        const total = projTasks.length;
        const completed = projTasks.filter(t => t.status === 'completed').length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          'Project Name': proj.name,
          'Description': proj.description || '',
          'Status': proj.status || '',
          'Deadline': proj.deadline || '',
          'Total Tasks': total,
          'Completed Tasks': completed,
          'Progress (%)': percent
        };
      });
      const projectsSheet = XLSX.utils.json_to_sheet(
        projectsData.length > 0 ? projectsData : [{ 'Project Name': 'No projects found', 'Description': '', 'Status': '', 'Deadline': '', 'Total Tasks': 0, 'Completed Tasks': 0, 'Progress (%)': 0 }]
      );
      projectsSheet['!cols'] = [{ wch: 28 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 14 }, { wch: 17 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');

      // ── Sheet 2: Tasks ─────────────────────────────────────────
      const tasksData = tasks.map(task => ({
        'Task Title': task.title || '',
        'Project': task.project_name || '',
        'Assigned To': task.assigned_to || '',
        'Status': task.status || '',
        'Priority': task.priority || '',
        'Due Date': task.due_date || '',
        'Description': task.description || ''
      }));
      const tasksSheet = XLSX.utils.json_to_sheet(
        tasksData.length > 0 ? tasksData : [{ 'Task Title': 'No tasks found', 'Project': '', 'Assigned To': '', 'Status': '', 'Priority': '', 'Due Date': '', 'Description': '' }]
      );
      tasksSheet['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 35 }];
      XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

      // ── Sheet 3: Time Logs ─────────────────────────────────────
      const timeLogsData = timeLogs.map(log => ({
        'Employee': log.username || '',
        'Project': log.project_name || '',
        'Task': log.task_title || 'General Tasks',
        'Duration (Hours)': parseFloat((log.duration_seconds / 3600).toFixed(2)),
        'Work Note': log.description || '',
        'Logged At': log.logged_at ? new Date(log.logged_at).toLocaleString() : ''
      }));
      const timeLogsSheet = XLSX.utils.json_to_sheet(
        timeLogsData.length > 0 ? timeLogsData : [{ 'Employee': 'No time logs found', 'Project': '', 'Task': '', 'Duration (Hours)': 0, 'Work Note': '', 'Logged At': '' }]
      );
      timeLogsSheet['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 28 }, { wch: 18 }, { wch: 35 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(workbook, timeLogsSheet, 'Time Logs');

      // ── Sheet 4: Attendance ────────────────────────────────────
      const attendanceData = attendance.map(log => {
        const sessionHrs = calcSessionHours(log.check_in, log.check_out);
        const status = log.check_in && !log.check_out ? 'Active' : log.check_in ? 'Present' : 'Absent';
        return {
          'Employee': log.username || '',
          'Date': log.date ? new Date(log.date).toLocaleDateString() : '',
          'Check In': log.check_in || '—',
          'Check Out': log.check_out || '—',
          'Session Duration (hrs)': parseFloat(sessionHrs.toFixed(2)),
          'Status': status
        };
      });
      const attendanceSheet = XLSX.utils.json_to_sheet(
        attendanceData.length > 0 ? attendanceData : [{ 'Employee': 'No attendance found', 'Date': '', 'Check In': '', 'Check Out': '', 'Session Duration (hrs)': 0, 'Status': '' }]
      );
      attendanceSheet['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');

      // ── Download ──────────────────────────────────────────────
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `project_hub_report_${today}.xlsx`);
    } catch (err) {
      console.error('Excel export error:', err);
      alert('Excel export failed. Please try again.');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportAttendancePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Document title and headers
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("EMPLOYEE ATTENDANCE REPORT", 14, 22);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Project Management System Workspace", 14, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 33);
      doc.text("Period: Last 30 Days", 14, 38);
      
      // Draw a line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 42, 196, 42);
      
      // Filter last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredLogs = attendance.filter(log => {
        if (!log.date) return false;
        const logDate = new Date(log.date);
        return logDate >= thirtyDaysAgo;
      });
      
      // Sort by date descending
      filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Table Header
      let y = 50;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Employee", 14, y);
      doc.text("Date", 60, y);
      doc.text("Check In", 95, y);
      doc.text("Check Out", 130, y);
      doc.text("Duration (hrs)", 165, y);
      
      // Draw header underline
      doc.line(14, y + 3, 196, y + 3);
      
      // Table Rows
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      y += 8;
      
      if (filteredLogs.length === 0) {
        doc.text("No attendance records found for the last 30 days.", 14, y);
      } else {
        filteredLogs.forEach((log) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
            // Draw table header again on new page
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(10);
            doc.text("Employee", 14, y);
            doc.text("Date", 60, y);
            doc.text("Check In", 95, y);
            doc.text("Check Out", 130, y);
            doc.text("Duration (hrs)", 165, y);
            doc.line(14, y + 3, 196, y + 3);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(9);
            y += 8;
          }
          
          const sessionHrs = calcSessionHours(log.check_in, log.check_out);
          const dateStr = log.date ? new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
          const checkOutVal = log.check_out || (log.check_in ? 'Active' : '—');
          
          doc.text(log.username || '—', 14, y);
          doc.text(dateStr, 60, y);
          doc.text(log.check_in || '—', 95, y);
          doc.text(checkOutVal, 130, y);
          doc.text(sessionHrs > 0 ? `${sessionHrs.toFixed(2)}h` : '0.00h', 165, y);
          
          // Draw subtle row separator line
          doc.setDrawColor(240, 240, 240);
          doc.line(14, y + 2, 196, y + 2);
          
          y += 7;
        });
      }
      
      // Save PDF
      doc.save(`Attendance_Report_30_Days_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Could not generate PDF. Please try again.');
    }
  };

  if (loading) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading reports database...</div>;
  }

  // Statistics
  const canManageProjects = user && ['admin', 'project_manager'].includes(user.role);
  const totalProjects = projects.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalHours = (timeLogs.reduce((acc, curr) => acc + curr.duration_seconds, 0) / 3600).toFixed(0);
  const teamMemberCount = 5;

  // Calculate project-specific progress rates
  const projectProgress = projects.map(proj => {
    const projTasks = tasks.filter(t => t.project_id === proj.id);
    const total = projTasks.length;
    const completed = projTasks.filter(t => t.status === 'completed').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      ...proj,
      totalTasks: total,
      completedTasks: completed,
      progressPercent: percent
    };
  });

  // Recharts: Tasks by Status donut
  const progressCount = tasks.filter(t => t.status === 'in_progress' || t.status === 'testing').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  // ── Attendance Hour Calculations ──────────────────────────────
  const STANDARD_WORK_HOURS = 8;

  const parseTime = (rawTime) => {
    if (!rawTime) return null;
    try {
      if (rawTime.includes('T')) return new Date(rawTime);
      // "HH:mm:ss" or "HH:mm:ss am/pm" format
      const today = new Date().toISOString().split('T')[0];
      return new Date(`${today}T${rawTime.split(' ')[0]}`);
    } catch { return null; }
  };

  const calcSessionHours = (checkIn, checkOut) => {
    const inTime = parseTime(checkIn);
    const outTime = parseTime(checkOut);
    if (!inTime) return 0;
    const end = outTime || new Date(); // if still active, use current time
    const diffMs = end - inTime;
    return Math.max(0, diffMs / 3600000);
  };

  // Sum logged task hours per user per date
  const loggedHoursByUserDate = {};
  timeLogs.forEach(log => {
    const dateKey = new Date(log.logged_at).toISOString().split('T')[0];
    const key = `${log.username}_${dateKey}`;
    if (!loggedHoursByUserDate[key]) loggedHoursByUserDate[key] = 0;
    loggedHoursByUserDate[key] += log.duration_seconds / 3600;
  });

  const formatHours = (hrs) => {
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const donutData = [
    { name: 'Completed', value: completedTasks, color: 'hsl(var(--status-complete))' },
    { name: 'In Progress', value: progressCount, color: 'hsl(var(--status-progress))' },
    { name: 'Pending', value: pendingCount, color: 'hsl(var(--status-pending))' }
  ];

  return (
    <div style={{ textAlign: 'left' }} className="reports-print-container">
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="no-print">
        <div>
          <h1 className="page-title">Workspace Reports</h1>
          <p className="page-subtitle">Export time log audits, review progress ratios, and track daily attendance.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {canManageProjects && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-secondary"
              id="reports-create-project-btn"
            >
              <FolderPlus size={16} /> Create Project
            </button>
          )}
          <button onClick={handleExportExcel} className="btn btn-secondary" id="reports-download-excel-btn">
            <Download size={16} /> Download Excel
          </button>
          <button onClick={handlePrintPDF} className="btn btn-primary" style={{ color: '#000' }}>
            <Printer size={16} /> Save PDF
          </button>
        </div>
      </div>

      {/* Printable Heading */}
      <div className="only-print" style={{ display: 'none', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
        <h1 style={{ color: '#000', fontSize: '2rem' }}>PROJECT HUB - EXECUTIVE AUDIT REPORT</h1>
        <p style={{ color: '#555' }}>Generated on: {new Date().toLocaleString()}</p>
      </div>

      {/* Metric Cards Header */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="glass-panel metric-card" style={{ padding: '16px 20px' }}>
          <div className="metric-icon" style={{ background: 'hsla(215, 90%, 55%, 0.1)', color: 'hsl(var(--accent-blue))' }}>
            <FolderKanban size={18} />
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: '0.75rem' }}>Total Projects</h3>
            <p style={{ fontSize: '1.25rem' }}>{totalProjects}</p>
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ padding: '16px 20px' }}>
          <div className="metric-icon" style={{ background: 'hsla(145, 75%, 45%, 0.1)', color: 'hsl(var(--status-complete))' }}>
            <CheckSquare size={18} />
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: '0.75rem' }}>Completed Tasks</h3>
            <p style={{ fontSize: '1.25rem' }}>{completedTasks}</p>
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ padding: '16px 20px' }}>
          <div className="metric-icon" style={{ background: 'hsla(260, 80%, 65%, 0.1)', color: 'hsl(var(--accent-purple))' }}>
            <Clock size={18} />
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: '0.75rem' }}>Total Hours</h3>
            <p style={{ fontSize: '1.25rem' }}>{totalHours}h</p>
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ padding: '16px 20px' }}>
          <div className="metric-icon" style={{ background: 'hsla(190, 90%, 50%, 0.1)', color: 'hsl(var(--accent-cyan))' }}>
            <Users size={18} />
          </div>
          <div className="metric-info">
            <h3 style={{ fontSize: '0.75rem' }}>Team Members</h3>
            <p style={{ fontSize: '1.25rem' }}>{teamMemberCount}</p>
          </div>
        </div>
      </div>

      {/* Grid: Project Progress Audits + Tasks by Status Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left Column: Progress Bars */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={18} style={{ color: 'hsl(var(--accent-cyan))' }} /> Project Progress
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {projectProgress.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No projects recorded.</p>
            ) : (
              projectProgress.map(proj => (
                <div key={proj.id} style={{ paddingBottom: '12px', borderBottom: '1px solid hsl(var(--border-glass))', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'hsl(var(--text-main))' }}>{proj.name}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Deadline: {proj.deadline}</span>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                      <span style={{ color: 'hsl(var(--accent-cyan))', fontWeight: '700' }}>{proj.progressPercent}%</span> Completed
                    </div>
                  </div>
                  {/* Progress bar line */}
                  <div style={{ width: '100%', height: '6px', background: 'hsla(220, 20%, 25%, 0.4)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${proj.progressPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, hsl(var(--accent-blue)), hsl(var(--accent-cyan)))',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Donut Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '16px' }}>
            Tasks by Status
          </h3>

          <div style={{ width: '100%', height: '140px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>{tasks.length}</span>
              <p style={{ fontSize: '0.6rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tasks</p>
            </div>
          </div>

          {/* Donut Labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
            {donutData.map((d, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.color }} />
                  <span style={{ color: 'hsl(var(--text-muted))' }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: '700', color: 'hsl(var(--text-main))' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Daily Attendance Reports - Enhanced */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>

          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Users size={16} style={{ color: 'hsl(var(--accent-cyan))' }} /> Daily Attendance & Work Hours
            </h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} className="no-print">
              <button 
                onClick={handleExportAttendancePDF} 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> Export Attendance PDF (Last 30 Days)
              </button>
              <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', background: 'hsla(220,20%,25%,0.4)', padding: '4px 10px', borderRadius: '20px', border: '1px solid hsl(var(--border-glass))' }}>
                Standard: {STANDARD_WORK_HOURS}h / day
              </span>
            </div>
          </div>

          {/* Summary stat row */}
          {attendance.length > 0 && (() => {
            const totalWorkedHrs = attendance.reduce((acc, log) => acc + calcSessionHours(log.check_in, log.check_out), 0);
            const presentCount = attendance.filter(l => l.check_in).length;
            const absentCount = attendance.filter(l => !l.check_in).length;
            const avgHrs = presentCount > 0 ? totalWorkedHrs / presentCount : 0;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Total Sessions', value: attendance.length, color: 'hsl(var(--accent-cyan))', bg: 'hsla(190,90%,50%,0.08)' },
                  { label: 'Present Today', value: presentCount, color: 'hsl(var(--status-complete))', bg: 'hsla(145,75%,45%,0.08)' },
                  { label: 'Avg Hours/Person', value: formatHours(avgHrs), color: 'hsl(var(--accent-blue))', bg: 'hsla(215,90%,55%,0.08)' },
                  { label: 'Absent/No Record', value: absentCount, color: 'hsl(var(--status-high))', bg: 'hsla(0,85%,60%,0.08)' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderRadius: '10px', background: s.bg, border: `1px solid ${s.color}30`, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {attendance.length === 0 ? (
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No attendance tracked.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th style={{ minWidth: '120px' }}>Session Duration</th>
                  <th style={{ minWidth: '110px' }}>Logged Task Hrs</th>
                  <th style={{ minWidth: '150px' }}>Work Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((log, idx) => {
                  const sessionHrs = calcSessionHours(log.check_in, log.check_out);
                  const dateKey = log.date ? (log.date.includes('T') ? log.date.split('T')[0] : log.date) : '';
                  const logKey = `${log.username}_${dateKey}`;
                  const loggedHrs = loggedHoursByUserDate[logKey] || 0;
                  const remainingHrs = Math.max(0, STANDARD_WORK_HOURS - sessionHrs);
                  const progressPct = Math.min(100, (sessionHrs / STANDARD_WORK_HOURS) * 100);
                  const isActive = log.check_in && !log.check_out;
                  const isPresent = !!log.check_in;

                  const statusConfig = isActive
                    ? { label: 'Active', bg: 'hsla(190,90%,50%,0.12)', color: 'hsl(190,90%,55%)', border: 'hsla(190,90%,50%,0.3)' }
                    : isPresent
                    ? { label: 'Present', bg: 'hsla(145,75%,45%,0.12)', color: 'hsl(145,75%,55%)', border: 'hsla(145,75%,45%,0.3)' }
                    : { label: 'Absent', bg: 'hsla(0,85%,60%,0.12)', color: 'hsl(0,85%,65%)', border: 'hsla(0,85%,60%,0.3)' };

                  const barColor = progressPct >= 100
                    ? 'hsl(145,75%,50%)'
                    : progressPct >= 50
                    ? 'hsl(var(--accent-cyan))'
                    : 'hsl(40,90%,55%)';

                  return (
                    <tr key={log.id || idx}>
                      {/* Employee */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-cyan)))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: '800', color: '#0c0e14'
                          }}>
                            {log.username ? log.username.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>{log.username}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ color: 'hsl(var(--text-muted))', fontSize: '0.82rem' }}>
                        {log.date ? new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>

                      {/* Check In */}
                      <td style={{ color: 'hsl(var(--status-complete))', fontWeight: '600', fontSize: '0.85rem' }}>
                        {log.check_in || <span style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>—</span>}
                      </td>

                      {/* Check Out */}
                      <td style={{ fontSize: '0.85rem' }}>
                        {log.check_out
                          ? <span style={{ color: 'hsl(var(--status-pending))', fontWeight: '600' }}>{log.check_out}</span>
                          : isActive
                          ? <span style={{ color: 'hsl(190,90%,55%)', fontStyle: 'italic', fontSize: '0.78rem' }}>● Still Active</span>
                          : <span style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>—</span>
                        }
                      </td>

                      {/* Session Duration */}
                      <td>
                        {isPresent ? (
                          <div>
                            <span style={{ fontWeight: '700', color: sessionHrs >= STANDARD_WORK_HOURS ? 'hsl(145,75%,55%)' : 'hsl(var(--accent-cyan))', fontSize: '0.88rem' }}>
                              {formatHours(sessionHrs)}
                            </span>
                            {remainingHrs > 0 && (
                              <div style={{ fontSize: '0.68rem', color: 'hsl(var(--status-high))', marginTop: '1px' }}>
                                {formatHours(remainingHrs)} remaining
                              </div>
                            )}
                            {sessionHrs >= STANDARD_WORK_HOURS && (
                              <div style={{ fontSize: '0.68rem', color: 'hsl(145,75%,55%)', marginTop: '1px' }}>✓ Full day</div>
                            )}
                          </div>
                        ) : <span style={{ color: 'hsl(var(--text-muted))' }}>—</span>}
                      </td>

                      {/* Logged Task Hours */}
                      <td>
                        {loggedHrs > 0 ? (
                          <span style={{ fontWeight: '700', color: 'hsl(var(--accent-purple))', fontSize: '0.88rem' }}>
                            {formatHours(loggedHrs)}
                          </span>
                        ) : (
                          <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', fontStyle: 'italic' }}>No logs</span>
                        )}
                      </td>

                      {/* Work Progress Bar */}
                      <td style={{ minWidth: '140px' }}>
                        {isPresent ? (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginBottom: '4px' }}>
                              <span>{Math.round(progressPct)}%</span>
                              <span>{STANDARD_WORK_HOURS}h goal</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'hsla(220,20%,25%,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${progressPct}%`,
                                height: '100%',
                                background: barColor,
                                borderRadius: '3px',
                                transition: 'width 0.6s ease',
                                boxShadow: `0 0 6px ${barColor}80`
                              }} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--status-high))', fontWeight: '600' }}>Not checked in</div>
                        )}
                      </td>

                      {/* Status / Check-In Button */}
                      <td>
                        {(() => {
                          const isMyRow = log.username === user?.username;
                          const isToday = dateKey === todayStr;

                          if (isMyRow && isToday) {
                            // Active session — show live timer + Stop button
                            if (isActiveSession) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                  {/* Live ticking timer */}
                                  <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '4px 10px', borderRadius: '8px',
                                    background: 'hsla(190,90%,50%,0.12)',
                                    border: '1px solid hsla(190,90%,50%,0.3)',
                                  }}>
                                    <div style={{
                                      width: '7px', height: '7px', borderRadius: '50%',
                                      background: 'hsl(145,75%,50%)',
                                      boxShadow: '0 0 8px hsla(145,75%,50%,0.9)',
                                      animation: 'pulse 1.5s infinite'
                                    }} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'hsl(190,90%,55%)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                      {formatLiveTime(liveSeconds)}
                                    </span>
                                  </div>
                                  {/* Stop button */}
                                  <button
                                    onClick={handleCheckOut}
                                    disabled={checkInLoading}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '5px',
                                      padding: '4px 10px', borderRadius: '8px',
                                      background: 'hsla(0,85%,60%,0.12)',
                                      border: '1px solid hsla(0,85%,60%,0.35)',
                                      color: 'hsl(0,85%,65%)', fontSize: '0.7rem',
                                      fontWeight: '700', cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'hsla(0,85%,60%,0.22)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'hsla(0,85%,60%,0.12)'}
                                  >
                                    <Square size={10} fill="currentColor" />
                                    {checkInLoading ? 'Stopping...' : 'Check Out'}
                                  </button>
                                </div>
                              );
                            }

                            // Already checked out today
                            if (isCheckedIn && isCheckedOut) {
                              return (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem',
                                  fontWeight: '700', textTransform: 'uppercase',
                                  background: 'hsla(145,75%,45%,0.12)', color: 'hsl(145,75%,55%)',
                                  border: '1px solid hsla(145,75%,45%,0.3)'
                                }}>
                                  ✓ Done Today
                                </span>
                              );
                            }

                            // Not checked in yet — show Active button
                            return (
                              <button
                                onClick={handleCheckIn}
                                disabled={checkInLoading}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  padding: '6px 14px', borderRadius: '8px',
                                  background: 'linear-gradient(135deg, hsla(145,75%,45%,0.2), hsla(190,90%,50%,0.15))',
                                  border: '1px solid hsla(145,75%,45%,0.4)',
                                  color: 'hsl(145,75%,55%)', fontSize: '0.75rem',
                                  fontWeight: '800', cursor: 'pointer',
                                  boxShadow: '0 0 12px hsla(145,75%,45%,0.2)',
                                  transition: 'all 0.2s',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, hsla(145,75%,45%,0.35), hsla(190,90%,50%,0.25))';
                                  e.currentTarget.style.boxShadow = '0 0 20px hsla(145,75%,45%,0.4)';
                                  e.currentTarget.style.transform = 'scale(1.03)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, hsla(145,75%,45%,0.2), hsla(190,90%,50%,0.15))';
                                  e.currentTarget.style.boxShadow = '0 0 12px hsla(145,75%,45%,0.2)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <Play size={11} fill="currentColor" />
                                {checkInLoading ? 'Starting...' : 'Active'}
                              </button>
                            );
                          }

                          // Other users — static badge
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem',
                              fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em',
                              background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}`
                            }}>
                              {statusConfig.label}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Logged Work Time Reports */}
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'hsl(var(--accent-cyan))' }} /> Detailed Developer Work Hours
          </h3>
          {timeLogs.length === 0 ? (
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No task hours logged.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Project Name</th>
                  <th>Task Title</th>
                  <th>Logged Duration</th>
                  <th>Work Note</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {timeLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: '600' }}>{log.username}</td>
                    <td>{log.project_name}</td>
                    <td>{log.task_title || 'General Tasks'}</td>
                    <td style={{ color: 'hsl(var(--accent-cyan))', fontWeight: '700' }}>
                      {(log.duration_seconds / 3600).toFixed(2)} hrs
                    </td>
                    <td style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>{log.description}</td>
                    <td>{new Date(log.logged_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      <style>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          .only-print {
            display: block !important;
          }
          .glass-panel {
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin-bottom: 30px !important;
          }
          th {
            color: #333 !important;
            border-bottom: 2px solid #333 !important;
          }
          td {
            border-bottom: 1px solid #ddd !important;
            color: #000 !important;
          }
          .status-badge {
            background: none !important;
            border: 1px solid #555 !important;
            color: #000 !important;
            padding: 2px 6px !important;
          }
        }
      `}</style>

      {/* ── Create Project Modal ── */}
      {canManageProjects && isCreateModalOpen && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setIsCreateModalOpen(false); }}
        >
          <div className="glass-panel modal-content" style={{
            border: '1px solid hsla(215, 90%, 55%, 0.3)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.25s ease'
          }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'hsla(215, 90%, 55%, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FolderPlus size={18} style={{ color: 'hsl(215, 90%, 65%)' }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: '800', margin: 0 }}>Create New Project</h3>
                  <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', margin: 0 }}>Fill in project details below</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  background: 'hsla(0,0%,100%,0.05)', border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px', width: '34px', height: '34px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'hsl(var(--text-muted))'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Website Redesign Q3"
                  value={projName}
                  onChange={e => setProjName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief project scope and objectives..."
                  value={projDesc}
                  onChange={e => setProjDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Deadline *</label>
                  <input
                    type="date"
                    value={projDeadline}
                    onChange={e => setProjDeadline(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={projStatus} onChange={e => setProjStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="testing">Testing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', color: '#000' }}
                  disabled={creating}
                >
                  <Plus size={14} /> {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
