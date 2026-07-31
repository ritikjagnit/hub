import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Clock, User, Plus, X, BookOpen, Edit2, List, FileText } from 'lucide-react';

const Meetings = () => {
  const { token, user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [projectId, setProjectId] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState([]);

  useEffect(() => {
    if (token) {
      fetchMeetings();
      fetchProjects();
      fetchEmployees();
    }
  }, [token]);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setMeetings(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProjects(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/workspace/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setEmployees(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return alert('Title, start, and end times are required');

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          agenda,
          notes,
          action_items: actionItems,
          start_time: startTime,
          end_time: endTime,
          project_id: projectId ? parseInt(projectId) : null,
          attendee_ids: selectedAttendees.map(id => parseInt(id))
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchMeetings();
      } else {
        alert('Failed to schedule meeting');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAgenda('');
    setNotes('');
    setActionItems('');
    setStartTime('');
    setEndTime('');
    setProjectId('');
    setSelectedAttendees([]);
  };

  const toggleAttendee = (id) => {
    if (selectedAttendees.includes(id)) {
      setSelectedAttendees(prev => prev.filter(a => a !== id));
    } else {
      setSelectedAttendees(prev => [...prev, id]);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Meetings & Schedule</h1>
          <p className="page-subtitle">Schedule discussions, take real-time minutes, track action items, and log summaries.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="btn btn-primary" style={{ color: '#000' }}>
          <Plus size={16} /> Schedule Meeting
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {meetings.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            <CalendarIcon size={40} style={{ marginBottom: '12px', color: 'hsl(var(--accent-cyan))' }} />
            <p>No meetings scheduled yet. Click "Schedule Meeting" to get started.</p>
          </div>
        ) : (
          meetings.map(meeting => (
            <div key={meeting.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{meeting.title}</h3>
                <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'hsla(190, 90%, 50%, 0.1)', border: '1px solid hsl(var(--border-glass))', borderRadius: '20px', color: 'hsl(var(--accent-cyan))', fontWeight: '700' }}>
                  {meeting.project_name || 'General'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} style={{ color: 'hsl(var(--accent-cyan))' }} />
                  <span>
                    {new Date(meeting.start_time).toLocaleString()} - {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={14} style={{ color: 'hsl(var(--accent-cyan))' }} />
                  <span>Hosted by: {meeting.creator_name || 'System'}</span>
                </div>
              </div>

              {meeting.agenda && (
                <div style={{ borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--accent-cyan))', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    <BookOpen size={10} style={{ marginRight: '4px' }} /> Agenda
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-main))', lineHeight: 1.4 }}>{meeting.agenda}</p>
                </div>
              )}

              {(meeting.notes || meeting.action_items) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '12px' }}>
                  {meeting.notes && (
                    <div>
                      <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', marginBottom: '2px' }}>Notes</h4>
                      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-main))', lineHeight: 1.4 }}>{meeting.notes}</p>
                    </div>
                  )}
                  {meeting.action_items && (
                    <div>
                      <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', marginBottom: '2px' }}>Action Items</h4>
                      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-main))', lineHeight: 1.4 }}>{meeting.action_items}</p>
                    </div>
                  )}
                </div>
              )}

              {meeting.attendees && meeting.attendees.length > 0 && (
                <div style={{ borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', marginBottom: '6px' }}>Attendees</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {meeting.attendees.map(a => (
                      <span key={a.id} style={{ fontSize: '0.7rem', background: 'hsla(220, 20%, 20%, 0.5)', padding: '2px 8px', borderRadius: '4px', border: '1px solid hsl(var(--border-glass))' }}>
                        {a.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SCHEDULE MEETING MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Schedule New Meeting</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleScheduleMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Meeting Title</label>
                <input type="text" placeholder="Weekly Sync, Brainstorming, etc." value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Related Project (Optional)</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">General Meeting (No Project)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Meeting Agenda</label>
                <textarea rows={2} placeholder="What will be discussed?" value={agenda} onChange={(e) => setAgenda(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Notes / Minutes (Optional)</label>
                  <textarea rows={3} placeholder="Discussion notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Action Items (Optional)</label>
                  <textarea rows={3} placeholder="Assigned actions..." value={actionItems} onChange={(e) => setActionItems(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Invite Attendees</label>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid hsl(var(--border-glass))', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {employees.map(emp => (
                    <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedAttendees.includes(emp.id)} onChange={() => toggleAttendee(emp.id)} />
                      <span>{emp.username} ({emp.role.replace('_', ' ')})</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000', marginTop: '10px' }}>
                Schedule & Broadcast
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
