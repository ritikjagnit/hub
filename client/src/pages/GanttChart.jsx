import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, BarChart, AlertTriangle, Milestone, Link2 } from 'lucide-react';

const GanttChart = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectTasks(selectedProject);
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProject(data[0].id.toString());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjectTasks = async (projId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?project_id=${projId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTasks(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate date columns for timeline header (next 30 days)
  const getTimelineDays = () => {
    const days = [];
    const today = new Date();
    // Start timeline 3 days ago for context
    const start = new Date(today);
    start.setDate(today.getDate() - 3);

    for (let i = 0; i < 30; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      days.push(current);
    }
    return days;
  };

  const timelineDays = getTimelineDays();
  const startTimelineDate = timelineDays[0];
  const endTimelineDate = timelineDays[timelineDays.length - 1];

  // Helper to calculate task position on grid
  const getTaskGridPosition = (task) => {
    const taskStart = task.start_date ? new Date(task.start_date) : (task.created_at ? new Date(task.created_at) : new Date());
    const taskDue = task.due_date ? new Date(task.due_date) : new Date(taskStart);
    
    // Normalize times
    taskStart.setHours(0,0,0,0);
    taskDue.setHours(0,0,0,0);
    
    const timelineStart = new Date(startTimelineDate);
    timelineStart.setHours(0,0,0,0);

    const msPerDay = 24 * 60 * 60 * 1000;
    
    let startIndex = Math.round((taskStart - timelineStart) / msPerDay);
    let endIndex = Math.round((taskDue - timelineStart) / msPerDay);

    // Bound indices to visible columns
    if (startIndex < 0) startIndex = 0;
    if (endIndex >= 30) endIndex = 29;
    if (startIndex >= 30) startIndex = 29;
    if (endIndex < 0) endIndex = 0;

    const span = Math.max(endIndex - startIndex + 1, 1);
    
    return {
      gridColumnStart: startIndex + 2, // account for task name column
      gridColumnEnd: startIndex + 2 + span
    };
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Gantt Chart & Timelines</h1>
          <p className="page-subtitle">Map work progressions, set start-end cycles, track critical paths, and register milestones.</p>
        </div>
        <div>
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{ padding: '10px 16px', minWidth: '220px', background: 'hsl(222, 22%, 13%)', border: '1px solid hsl(var(--border-glass))', color: '#fff', borderRadius: '8px' }}
          >
            <option value="">Select Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <div className="stopwatch-circle stopwatch-active">
            <span className="stopwatch-time" style={{ fontSize: '1rem' }}>Loading</span>
          </div>
        </div>
      ) : !selectedProject ? (
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          <BarChart size={40} style={{ color: 'hsl(var(--accent-cyan))', marginBottom: '12px' }} />
          <p>Please select a project to view its Gantt timeline.</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          <Milestone size={40} style={{ color: 'hsl(var(--accent-cyan))', marginBottom: '12px' }} />
          <p>No tasks configured in this project yet.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(30, 40px)', gap: '1px', background: 'hsl(var(--border-glass))', minWidth: '1420px', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Header row 1: Month/Year */}
            <div style={{ background: 'hsla(222, 22%, 10%, 0.9)', padding: '12px 16px', fontWeight: '700', fontSize: '0.8rem', color: 'hsl(var(--accent-cyan))' }}>
              Tasks Timeline
            </div>
            <div style={{ background: 'hsla(222, 22%, 10%, 0.9)', gridColumn: '2 / -1', padding: '12px', fontSize: '0.8rem', fontWeight: '700', textAlign: 'center' }}>
              {timelineDays[0].toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>

            {/* Header row 2: Day Numbers */}
            <div style={{ background: 'hsla(222, 22%, 12%, 0.8)', padding: '10px 16px' }} />
            {timelineDays.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={idx} style={{ 
                  background: isToday ? 'hsla(190, 90%, 55%, 0.15)' : 'hsla(222, 22%, 12%, 0.8)', 
                  padding: '10px 2px', 
                  textAlign: 'center', 
                  fontSize: '0.75rem', 
                  fontWeight: isToday ? '900' : '400',
                  color: isToday ? 'hsl(var(--accent-cyan))' : 'inherit'
                }}>
                  <div>{day.getDate()}</div>
                  <div style={{ fontSize: '0.55rem', opacity: 0.6 }}>{day.toLocaleString('default', { weekday: 'narrow' })}</div>
                </div>
              );
            })}

            {/* Tasks Gantt Rows */}
            {tasks.map(task => {
              const pos = getTaskGridPosition(task);
              return (
                <React.Fragment key={task.id}>
                  {/* Task label column */}
                  <div style={{ background: 'hsla(222, 22%, 12%, 0.4)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid hsl(var(--border-glass))' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>
                      {task.assigned_to_name || 'Unassigned'}
                    </span>
                  </div>

                  {/* Empty cell row background */}
                  {timelineDays.map((day, idx) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <div key={idx} style={{ 
                        background: isToday ? 'hsla(190, 90%, 55%, 0.04)' : 'hsla(222, 22%, 13%, 0.25)', 
                        height: '100%' 
                      }} />
                    );
                  })}

                  {/* Absolute task block overlay spanning columns */}
                  <div style={{
                    gridColumnStart: pos.gridColumnStart,
                    gridColumnEnd: pos.gridColumnEnd,
                    background: task.status === 'completed' ? 'linear-gradient(90deg, hsla(145, 75%, 45%, 0.8), hsla(145, 75%, 55%, 0.9))' :
                                task.priority === 'high' ? 'linear-gradient(90deg, hsla(355, 80%, 55%, 0.8), hsla(355, 80%, 65%, 0.9))' :
                                'linear-gradient(90deg, hsla(195, 90%, 50%, 0.8), hsla(250, 80%, 60%, 0.9))',
                    borderRadius: '4px',
                    height: '24px',
                    alignSelf: 'center',
                    margin: '0 2px',
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: '#000',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                  title={`${task.title} (${task.status})`}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {task.milestone && <Milestone size={10} />}
                      {task.subtasks && <Link2 size={10} />}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'hsl(var(--status-complete))' }} />
              <span>Completed Tasks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'hsl(var(--status-high, 0, 90%, 60%))' }} />
              <span>High Priority Tasks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'hsl(var(--accent-blue))' }} />
              <span>Standard Active Tasks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Milestone size={12} style={{ color: 'hsl(var(--accent-cyan))' }} />
              <span>Milestones</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
