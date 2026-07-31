import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, FileText, CheckSquare, Clock, Award, AwardIcon, Compass, Sparkles, Brain, PlusCircle, ExternalLink, Calendar, GitCommit } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [thesis, setThesis] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [marks, setMarks] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daily log modal fields
  const [showLogModal, setShowLogModal] = useState(false);
  const [todayWork, setTodayWork] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [problemsFaced, setProblemsFaced] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [submittingLog, setSubmittingLog] = useState(false);

  useEffect(() => {
    if (token) {
      fetchStudentData();
    }
  }, [token]);

  const fetchStudentData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resThesis, resTasks, resLogs, resMarks, resCerts] = await Promise.all([
        fetch('/api/academic/thesis', { headers }),
        fetch('/api/tasks', { headers }), // Fetch normal tasks, we will look up academic details if needed
        fetch('/api/academic/dailylog/my', { headers }),
        fetch('/api/academic/marks', { headers }),
        fetch('/api/academic/certificate', { headers })
      ]);

      if (resThesis.ok) setThesis(await resThesis.json());
      if (resTasks.ok) {
        const allTasks = await resTasks.json();
        // Filter tasks assigned to this student
        setTasks(allTasks.filter(t => t.assigned_to === user.id));
      }
      if (resLogs.ok) setLogs(await resLogs.json());
      if (resMarks.ok) setMarks(await resMarks.json());
      if (resCerts.ok) setCertificates(await resCerts.json());
    } catch (err) {
      console.error('Error fetching academic student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!todayWork || !hoursWorked) return;

    setSubmittingLog(true);
    try {
      const formData = new FormData();
      formData.add = (key, val) => formData.append(key, val);
      formData.add('today_work', todayWork);
      formData.add('hours_worked', hoursWorked);
      formData.add('problems_faced', problemsFaced);
      formData.add('tomorrow_plan', tomorrowPlan);
      formData.add('github_link', githubLink);
      if (thesis && thesis.project_id) {
        formData.add('project_id', thesis.project_id);
      }
      if (screenshotFile) {
        formData.append('file', screenshotFile);
      }

      const res = await fetch('/api/academic/dailylog', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setTodayWork('');
        setHoursWorked('');
        setProblemsFaced('');
        setTomorrowPlan('');
        setGithubLink('');
        setScreenshotFile(null);
        setShowLogModal(false);
        fetchStudentData(); // Refresh log table
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to submit daily log');
      }
    } catch (err) {
      console.error('Daily log submission error:', err);
    } finally {
      setSubmittingLog(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading student academic workspace...</div>;
  }

  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalHoursLogged = logs.reduce((acc, curr) => acc + curr.hours_worked, 0);

  // Prepare chart data (cumulative hours)
  const logChartData = [...logs].reverse().map(l => ({
    date: new Date(l.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    hours: l.hours_worked
  }));

  return (
    <div style={{ textAlign: 'left' }}>
      
      {/* Page Header */}
      <div className="glass-panel" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, hsla(260, 90%, 55%, 0.08), hsla(220, 20%, 25%, 0.15))',
        borderRadius: '16px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid hsla(260, 90%, 55%, 0.15)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', marginBottom: '6px' }}>
            Academic Thesis Workspace
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', maxWidth: '600px', lineHeight: '1.5' }}>
            Manage drafts, log project updates, view guide evaluations, and review literature indexes.
          </p>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'hsl(var(--accent-purple))',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <PlusCircle size={16} /> Submit Daily Log
        </button>
      </div>

      {/* Numerical Metrics Cards */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'hsla(260, 90%, 55%, 0.1)', color: 'hsl(var(--accent-purple))' }}>
            <BookOpen size={20} />
          </div>
          <div className="metric-info">
            <h3>Thesis Status</h3>
            <p style={{ fontSize: '1.15rem', fontWeight: '800', textTransform: 'capitalize', color: 'hsl(var(--status-progress))' }}>
              {thesis ? thesis.status.replace('_', ' ') : 'Not Started'}
            </p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>
              Guide: {thesis?.Guide?.username || 'Unassigned'}
            </span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'hsla(145, 75%, 45%, 0.1)', color: 'hsl(var(--status-complete))' }}>
            <CheckSquare size={20} />
          </div>
          <div className="metric-info">
            <h3>Assigned Tasks</h3>
            <p>{tasks.length}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>
              Done: {completedTasks} | Pending: {tasks.length - completedTasks}
            </span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'hsla(190, 90%, 50%, 0.1)', color: 'hsl(var(--accent-cyan))' }}>
            <Clock size={20} />
          </div>
          <div className="metric-info">
            <h3>Hours Worked</h3>
            <p>{totalHoursLogged.toFixed(1)} hrs</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>
              From {logs.length} logged days
            </span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'hsla(40, 90%, 55%, 0.1)', color: 'hsl(var(--status-pending))' }}>
            <Award size={20} />
          </div>
          <div className="metric-info">
            <h3>Final Marks</h3>
            <p>{marks[0]?.final_marks !== undefined ? `${marks[0].final_marks}/50` : 'Not Evaluated'}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>
              {marks[0] ? `Graded by ${marks[0].Teacher?.username || 'Guide'}` : 'Evaluation pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Daily Logs Timeline Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} style={{ color: 'hsl(var(--accent-cyan))' }} /> Daily Progress Tracking
          </h3>
          {logChartData.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))' }}>
              No progress logs recorded. Submit logs to see weekly velocity.
            </div>
          ) : (
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={logChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent-purple))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--accent-purple))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="hsl(var(--text-muted))" fontSize={11} tickLine={false} />
                  <YAxis stroke="hsl(var(--text-muted))" fontSize={11} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--bg-secondary))', borderColor: 'hsl(var(--border-glass))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--text-main))', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    name="Hours Worked"
                    stroke="hsl(var(--accent-purple))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Academic Action Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Thesis Editor Quick Link */}
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'left', border: '1px solid hsl(var(--border-glass))' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>Thesis Drafting</h4>
            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginBottom: '14px', lineHeight: 1.4 }}>
              Compose sections (Abstract, Methodology, Future Scope), auto-save draft variations, and upload revision artifacts.
            </p>
            <button
              onClick={() => navigate('/academic/thesis')}
              className="quick-action-btn"
              style={{
                background: 'linear-gradient(135deg, hsla(260, 80%, 65%, 0.15), hsla(260, 80%, 65%, 0.05))',
                border: '1px solid hsla(260, 80%, 65%, 0.3)',
                color: 'hsl(var(--accent-purple))',
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              Draft & Upload <ExternalLink size={14} />
            </button>
          </div>

          {/* Research Papers Quick Link */}
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'left', border: '1px solid hsl(var(--border-glass))' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>Research Repository</h4>
            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginBottom: '14px', lineHeight: 1.4 }}>
              Browse verified papers, upload references, bookmark studies, and check department categorizations.
            </p>
            <button
              onClick={() => navigate('/academic/research')}
              style={{
                background: 'linear-gradient(135deg, hsla(190, 90%, 50%, 0.15), hsla(190, 90%, 50%, 0.05))',
                border: '1px solid hsla(190, 90%, 50%, 0.3)',
                color: 'hsl(var(--accent-cyan))',
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              Browse Library <ExternalLink size={14} />
            </button>
          </div>

        </div>

      </div>

      {/* Detailed Sections Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Daily Log Feed */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCommit size={18} style={{ color: 'hsl(var(--accent-purple))' }} /> Recent Progress Submissions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', padding: '20px 0' }}>No logs submitted yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'hsla(0, 0%, 100%, 0.02)',
                  border: '1px solid hsl(var(--border-glass))',
                  fontSize: '0.8rem',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: '#fff' }}>{new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      background: log.status === 'approved' ? 'hsla(145, 75%, 45%, 0.15)' : log.status === 'rejected' ? 'hsla(0, 80%, 60%, 0.15)' : 'hsla(40, 90%, 55%, 0.15)',
                      color: log.status === 'approved' ? 'hsl(var(--status-complete))' : log.status === 'rejected' ? 'hsl(var(--status-pending))' : 'hsl(40, 90%, 55%)'
                    }}>
                      {log.status}
                    </span>
                  </div>
                  <p style={{ color: 'hsl(var(--text-muted))', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                    {log.today_work}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                    <span>Hours: {log.hours_worked} hrs</span>
                    {log.github_link && (
                      <a href={log.github_link} target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--accent-cyan))', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        GitHub <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  {log.feedback && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'hsla(0, 0%, 100%, 0.04)',
                      borderLeft: '3px solid hsl(var(--accent-purple))',
                      fontSize: '0.75rem',
                      color: 'hsl(var(--text-main))'
                    }}>
                      <strong>Guide Feedback:</strong> {log.feedback}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Tasks & Rubrics */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'hsl(var(--status-complete))' }} /> Assigned Tasks & Rubrics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
            {tasks.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', padding: '20px 0' }}>No tasks assigned.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'hsla(0, 0%, 100%, 0.02)',
                  border: '1px solid hsl(var(--border-glass))',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  cursor: 'pointer'
                }} onClick={() => navigate(`/tasks/${task.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: '#fff' }}>{task.title}</strong>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      background: task.status === 'completed' ? 'hsla(145, 75%, 45%, 0.15)' : 'hsla(40, 90%, 55%, 0.15)',
                      color: task.status === 'completed' ? 'hsl(var(--status-complete))' : 'hsl(40, 90%, 55%)'
                    }}>
                      {task.status}
                    </span>
                  </div>
                  <p style={{ color: 'hsl(var(--text-muted))', margin: '4px 0 8px 0', fontSize: '0.75rem' }}>
                    {task.description || 'No description provided.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                    <span>Priority: <span style={{ color: task.priority === 'high' ? 'hsl(0, 80%, 60%)' : '#fff' }}>{task.priority}</span></span>
                    {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* DAILY LOG SUBMISSION MODAL */}
      {showLogModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '550px',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', margin: 0 }}>Log Daily Academic Progress</h3>
              <button onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Today's Work *</label>
                <textarea
                  required
                  placeholder="Outline the modules written, code changes, chapters compiled..."
                  value={todayWork}
                  onChange={e => setTodayWork(e.target.value)}
                  style={{
                    background: 'hsla(0,0%,0%,0.2)',
                    border: '1px solid hsl(var(--border-glass))',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '0.85rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Hours Worked *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 4.5"
                    value={hoursWorked}
                    onChange={e => setHoursWorked(e.target.value)}
                    style={{
                      background: 'hsla(0,0%,0%,0.2)',
                      border: '1px solid hsl(var(--border-glass))',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>GitHub Link</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={githubLink}
                    onChange={e => setGithubLink(e.target.value)}
                    style={{
                      background: 'hsla(0,0%,0%,0.2)',
                      border: '1px solid hsl(var(--border-glass))',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Problems Faced</label>
                <input
                  type="text"
                  placeholder="Bugs encountered, design conflicts..."
                  value={problemsFaced}
                  onChange={e => setProblemsFaced(e.target.value)}
                  style={{
                    background: 'hsla(0,0%,0%,0.2)',
                    border: '1px solid hsl(var(--border-glass))',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Tomorrow's Plan</label>
                <input
                  type="text"
                  placeholder="Task goals for the next session..."
                  value={tomorrowPlan}
                  onChange={e => setTomorrowPlan(e.target.value)}
                  style={{
                    background: 'hsla(0,0%,0%,0.2)',
                    border: '1px solid hsl(var(--border-glass))',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Attach Screenshot (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setScreenshotFile(e.target.files[0])}
                  style={{
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingLog}
                style={{
                  background: 'hsl(var(--accent-purple))',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                {submittingLog ? 'Submitting log...' : 'Submit Log'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentDashboard;
