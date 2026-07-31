import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { io } from 'socket.io-client';


const CalendarPage = () => {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (token) {
      fetchData();
      
      const socket = io(import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);
      
      socket.on('project_created', () => fetchData());
      socket.on('project_deleted', () => fetchData());
      socket.on('task_created', () => fetchData());
      socket.on('task_deleted', () => fetchData());
      socket.on('meeting_created', () => fetchData());
      socket.on('meeting_deleted', () => fetchData());

      return () => {
        socket.disconnect();
      };
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resTasks, resProj, resMeetings] = await Promise.all([
        fetch('/api/tasks', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/meetings', { headers })
      ]);
      if (resTasks.ok) {
        setTasks(await resTasks.json());
      }
      if (resProj.ok) {
        setProjects(await resProj.json());
      }
      if (resMeetings.ok) {
        setMeetings(await resMeetings.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isSameDay = (dateVal, year, month, day) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    return (
      d.getFullYear() === year &&
      d.getMonth() === month &&
      d.getDate() === day
    );
  };

  const getEventsForDate = (year, month, day) => {
    const dayEvents = [];

    // 1. Projects Created
    projects.forEach(p => {
      if (isSameDay(p.created_at, year, month, day)) {
        dayEvents.push({
          id: `proj-create-${p.id}`,
          type: 'project_created',
          title: `Project Created: ${p.name}`,
          description: p.description,
          color: 'hsl(var(--accent-blue))',
          badgeText: 'Project Created',
          badgeClass: 'priority-low',
          original: p
        });
      }
    });

    // 2. Projects Completed
    projects.forEach(p => {
      if (p.completed_at && isSameDay(p.completed_at, year, month, day)) {
        dayEvents.push({
          id: `proj-complete-${p.id}`,
          type: 'project_completed',
          title: `Project Completed: ${p.name}`,
          description: p.description,
          color: 'hsl(var(--status-complete))',
          badgeText: 'Project Completed',
          badgeClass: 'priority-high',
          original: p
        });
      }
    });

    // 3. Tasks Created
    tasks.forEach(t => {
      if (isSameDay(t.created_at, year, month, day)) {
        dayEvents.push({
          id: `task-create-${t.id}`,
          type: 'task_created',
          title: `Task Created: ${t.title}`,
          description: t.description,
          color: 'hsl(var(--accent-purple))',
          badgeText: 'Task Created',
          badgeClass: 'priority-medium',
          original: t
        });
      }
    });

    // 4. Tasks Due (Deadline)
    tasks.forEach(t => {
      if (isSameDay(t.due_date, year, month, day)) {
        dayEvents.push({
          id: `task-due-${t.id}`,
          type: 'task_due',
          title: `Task Due: ${t.title}`,
          description: t.description,
          color: t.priority === 'high' 
            ? 'hsl(var(--status-high))' 
            : t.priority === 'medium' 
              ? 'hsl(var(--status-progress))' 
              : 'hsl(var(--accent-cyan))',
          badgeText: `Task Due (${t.priority} priority)`,
          badgeClass: `priority-${t.priority}`,
          original: t
        });
      }
    });

    // 5. Meetings Scheduled
    meetings.forEach(m => {
      if (isSameDay(m.start_time, year, month, day)) {
        dayEvents.push({
          id: `meeting-${m.id}`,
          type: 'meeting',
          title: `Meeting: ${m.title}`,
          description: m.agenda || 'No agenda specified',
          color: 'hsl(var(--accent-cyan))',
          badgeText: `Meeting (${new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          badgeClass: 'priority-low',
          original: m
        });
      }
    });

    return dayEvents;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedDateEvents = getEventsForDate(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );

  return (
    <div style={{ textAlign: 'left' }}>
      <h1 className="page-title">Workspace Calendar</h1>
      <p className="page-subtitle">Track project release schedules, active sprints, and task milestones.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr', gap: '24px', minHeight: '520px', alignItems: 'stretch' }}>
        
        {/* Left Column: Calendar grid */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Calendar Header controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={20} style={{ color: 'hsl(var(--accent-cyan))' }} /> 
              {monthsList[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '8px' }} title="Previous Month">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '8px' }} title="Next Month">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            textAlign: 'center',
            fontSize: '0.8rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: 'hsl(var(--text-muted))',
            letterSpacing: '0.5px',
            marginBottom: '12px'
          }}>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            flexGrow: 1
          }}>
            {/* Blank cells before start of month */}
            {blankDays.map(b => (
              <div key={`blank-${b}`} style={{ background: 'transparent' }} />
            ))}

            {/* Monthly Days cells */}
            {daysArray.map(day => {
              const dayEvents = getEventsForDate(currentDate.getFullYear(), currentDate.getMonth(), day);
              
              return (
                <div 
                  key={day}
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  className={`calendar-day-cell ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
                  style={{
                    minHeight: '70px',
                    padding: '8px',
                    borderRadius: '10px',
                    border: '1px solid hsl(var(--border-glass))',
                    background: isSelected(day) 
                      ? 'linear-gradient(135deg, hsla(190, 90%, 50%, 0.15), hsla(215, 90%, 55%, 0.15))' 
                      : isToday(day) 
                        ? 'hsla(190, 90%, 50%, 0.05)' 
                        : 'hsla(220, 20%, 25%, 0.15)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected(day) ? '0 0 12px hsla(190, 90%, 50%, 0.2)' : 'none'
                  }}
                >
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: isToday(day) || isSelected(day) ? '800' : '500',
                    color: isToday(day) ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-main))'
                  }}>
                    {day}
                  </span>

                  {/* Event Indicators */}
                  {dayEvents.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', width: '100%', flexWrap: 'wrap', marginTop: '4px' }}>
                      {dayEvents.slice(0, 3).map(event => (
                        <div 
                          key={event.id} 
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: event.color
                          }} 
                          title={event.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: '0.6rem', color: 'hsl(var(--text-muted))', lineHeight: 1 }}>+</span>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Events summary for selected date */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', borderBottom: '1px solid hsl(var(--border-glass))', paddingBottom: '12px' }}>
            Day Milestones
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'hsl(var(--accent-cyan))', fontWeight: '700', textTransform: 'uppercase' }}>
            {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, overflowY: 'auto' }}>
            {selectedDateEvents.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--text-muted))', opacity: 0.5, gap: '8px' }}>
                <Clock size={36} />
                <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>No milestones today</p>
              </div>
            ) : (
              selectedDateEvents.map(event => (
                <div 
                  key={event.id} 
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${event.color}`,
                    background: 'hsla(220, 20%, 25%, 0.25)',
                    borderTop: '1px solid hsl(var(--border-glass))',
                    borderBottom: '1px solid hsl(var(--border-glass))',
                    borderRight: '1px solid hsl(var(--border-glass))',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span className={`task-priority-badge ${event.badgeClass}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                      {event.badgeText}
                    </span>
                    {event.type.startsWith('task') && (
                      <span className={`status-badge status-${event.original.status}`} style={{ fontSize: '0.65rem' }}>
                        {event.original.status.replace('_', ' ')}
                      </span>
                    )}
                    {event.type.startsWith('project') && (
                      <span className={`status-badge status-${event.original.status}`} style={{ fontSize: '0.65rem' }}>
                        {event.original.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'hsl(var(--text-main))', marginBottom: '4px' }}>
                    {event.title}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.description || 'No description provided'}
                  </p>
                  {event.type.startsWith('task') && (
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--accent-blue))', display: 'block', marginTop: '6px', fontWeight: '600' }}>
                      Project: {event.original.project_name || `ID ${event.original.project_id}`}
                    </span>
                  )}
                  {event.type === 'meeting' && event.original.project_name && (
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--accent-cyan))', display: 'block', marginTop: '6px', fontWeight: '600' }}>
                      Project: {event.original.project_name}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarPage;
