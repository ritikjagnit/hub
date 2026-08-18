import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Calendar, Bell, Send, Users, AlertTriangle, Pencil, Trash2, Check, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../config/socket';

// Returns a friendly label for a given date
const getDateLabel = (dateStr) => {
  const msgDate = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(msgDate, today)) return 'Today';
  if (isSameDay(msgDate, yesterday)) return 'Yesterday';
  return msgDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// Returns date key for grouping
const getDateKey = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const Chat = () => {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [tasksAlerts, setTasksAlerts] = useState([]);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Delete confirm modal
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState(null); // { msgId, x, y }

  // Close context menu on any left-click or Escape
  useEffect(() => {
    const close = () => setContextMenu(null);
    const onKey = (e) => { if (e.key === 'Escape') setContextMenu(null); };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(getSocketUrl());
    socketRef.current.on('receive_message', () => fetchMessages());
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useEffect(() => {
    if (token) { fetchProjects(); fetchDeadlineAlerts(); }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchMessages();
    if (socketRef.current) {
      const roomName = selectedProjectId ? `project_${selectedProjectId}` : 'global_chat';
      socketRef.current.emit('join_room', roomName);
    }
  }, [token, selectedProjectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus edit input when edit mode activates
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setProjects(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async () => {
    try {
      let url = '/api/chat';
      if (selectedProjectId) url += `?project_id=${selectedProjectId}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setMessages(await res.json());
    } catch (err) { console.error('Error fetching chat messages:', err); }
  };

  const fetchDeadlineAlerts = async () => {
    try {
      const res = await fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const allTasks = await res.json();
        const today = new Date();
        const alerts = allTasks.filter(task => {
          if (!task.due_date || task.status === 'completed') return false;
          const dueDate = new Date(task.due_date);
          const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 3;
        }).map(task => {
          const diffDays = Math.ceil((new Date(task.due_date) - today) / (1000 * 60 * 60 * 24));
          return { ...task, daysLeft: diffDays };
        });
        setTasksAlerts(alerts);
      }
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ project_id: selectedProjectId ? parseInt(selectedProjectId) : null, content: typedMessage })
      });
      if (res.ok) {
        const roomName = selectedProjectId ? `project_${selectedProjectId}` : 'global_chat';
        if (socketRef.current) socketRef.current.emit('send_message', { room: roomName });
        setTypedMessage('');
        fetchMessages();
      }
    } catch (err) { console.error(err); }
  };

  // ── Edit ──────────────────────────────────────────────
  const startEditing = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.content);
  };

  const cancelEditing = () => { setEditingId(null); setEditText(''); };

  const handleEditSubmit = async (msgId) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`/api/chat/${msgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: editText.trim() })
      });
      if (res.ok) {
        const roomName = selectedProjectId ? `project_${selectedProjectId}` : 'global_chat';
        if (socketRef.current) socketRef.current.emit('send_message', { room: roomName });
        cancelEditing();
        fetchMessages();
      }
    } catch (err) { console.error(err); }
  };

  // ── Delete ────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch(`/api/chat/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const roomName = selectedProjectId ? `project_${selectedProjectId}` : 'global_chat';
        if (socketRef.current) socketRef.current.emit('send_message', { room: roomName });
        setDeleteConfirmId(null);
        fetchMessages();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <h1 className="page-title">Team Discussions</h1>
      <p className="page-subtitle">Post global announcements, review deadline alerts, or chat in specific project channels in real-time.</p>

      {/* ── Right-click Context Menu ── */}
      {contextMenu && (() => {
        const targetMsg = messages.find(m => m.id === contextMenu.msgId);
        return (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 99999,
              background: 'hsla(222, 28%, 10%, 0.97)',
              border: '1px solid hsl(var(--border-glass))',
              borderRadius: '10px',
              padding: '6px',
              minWidth: '160px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px hsla(215,90%,55%,0.08)',
              backdropFilter: 'blur(12px)',
              animation: 'fadeIn 0.12s ease'
            }}
          >
            {/* Preview snippet */}
            {targetMsg && (
              <div style={{
                padding: '6px 10px 8px',
                fontSize: '0.7rem',
                color: 'hsl(var(--text-muted))',
                borderBottom: '1px solid hsl(var(--border-glass))',
                marginBottom: '4px',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                "{targetMsg.content}"
              </div>
            )}

            {/* Edit option */}
            <button
              onClick={() => { startEditing(targetMsg); setContextMenu(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', background: 'transparent', border: 'none',
                color: '#fff', padding: '9px 12px', borderRadius: '6px',
                cursor: 'pointer', fontSize: '0.82rem', textAlign: 'left',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'hsla(190, 90%, 50%, 0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Pencil size={14} style={{ color: 'hsl(var(--accent-cyan))' }} />
              Edit Message
            </button>

            {/* Divider */}
            <div style={{ height: '1px', background: 'hsl(var(--border-glass))', margin: '4px 0' }} />

            {/* Delete option */}
            <button
              onClick={() => { setDeleteConfirmId(contextMenu.msgId); setContextMenu(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', background: 'transparent', border: 'none',
                color: 'hsl(var(--status-high))', padding: '9px 12px', borderRadius: '6px',
                cursor: 'pointer', fontSize: '0.82rem', textAlign: 'left',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'hsla(0, 85%, 60%, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Trash2 size={14} />
              Delete Message
            </button>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '380px', width: '90%', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'hsla(0, 85%, 60%, 0.15)', border: '1px solid hsla(0, 85%, 60%, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <Trash2 size={24} style={{ color: 'hsl(var(--status-high))' }} />
            </div>
            <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Delete Message?</h3>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', marginBottom: '24px' }}>
              This action cannot be undone. The message will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn" onClick={() => setDeleteConfirmId(null)}
                style={{ border: '1px solid hsl(var(--border-glass))', color: '#fff', padding: '10px 24px' }}>
                Cancel
              </button>
              <button className="btn" onClick={handleDeleteConfirm}
                style={{ background: 'hsla(0, 85%, 60%, 0.85)', color: '#fff', padding: '10px 24px', border: 'none' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 3fr 1.2fr', gap: '24px', height: '640px', alignItems: 'stretch' }}>

        {/* Left: Channel selector */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Channels
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setSelectedProjectId('')} className="btn" style={{
              width: '100%', justifyContent: 'flex-start',
              background: selectedProjectId === '' ? 'linear-gradient(135deg, hsla(215, 90%, 55%, 0.2), hsla(190, 90%, 50%, 0.2))' : 'transparent',
              borderColor: selectedProjectId === '' ? 'hsl(var(--accent-cyan))' : 'hsl(var(--border-glass))',
              borderWidth: '1px', borderStyle: 'solid', color: '#fff'
            }}>
              <Users size={16} style={{ color: 'hsl(var(--accent-cyan))' }} /> Global Team Chat
            </button>
            {projects.map(proj => (
              <button key={proj.id} onClick={() => setSelectedProjectId(proj.id.toString())} className="btn" style={{
                width: '100%', justifyContent: 'flex-start',
                background: selectedProjectId === proj.id.toString() ? 'linear-gradient(135deg, hsla(215, 90%, 55%, 0.2), hsla(190, 90%, 50%, 0.2))' : 'transparent',
                borderColor: selectedProjectId === proj.id.toString() ? 'hsl(var(--accent-cyan))' : 'hsl(var(--border-glass))',
                borderWidth: '1px', borderStyle: 'solid', color: '#fff'
              }}>
                <MessageSquare size={16} style={{ color: 'hsl(var(--accent-blue))' }} /> {proj.name}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Chat feed */}
        <div className="glass-panel chat-container">
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border-glass))', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(var(--status-complete))' }} />
            <strong style={{ fontSize: '1rem' }}>
              {selectedProjectId === '' ? 'Global Team Discussion Board' : projects.find(p => p.id === parseInt(selectedProjectId))?.name}
            </strong>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                <MessageSquare size={48} style={{ marginBottom: '12px', opacity: 0.2, margin: '0 auto' }} />
                <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>No discussion started here yet.</p>
              </div>
            ) : (() => {
              let lastDateKey = null;
              return messages.map(msg => {
                const isMine = user && msg.sender_id === user.id;
                const dateKey = getDateKey(msg.created_at);
                const showSeparator = dateKey !== lastDateKey;
                lastDateKey = dateKey;
                const isEditing = editingId === msg.id;

                return (
                  <React.Fragment key={msg.id}>
                    {/* Date Separator */}
                    {showSeparator && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 12px', padding: '0 4px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, hsl(var(--border-glass)))' }} />
                        <span style={{
                          fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: 'hsl(var(--text-muted))', background: 'hsla(215, 90%, 55%, 0.1)',
                          border: '1px solid hsl(var(--border-glass))', borderRadius: '20px', padding: '3px 12px',
                          whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px'
                        }}>
                          <Calendar size={10} style={{ color: 'hsl(var(--accent-cyan))' }} />
                          {getDateLabel(msg.created_at)}
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, hsl(var(--border-glass)))' }} />
                      </div>
                    )}

                    {/* Message Row */}
                    <div
                      className={`message-row ${isMine ? 'mine' : ''}`}
                      style={{ position: 'relative' }}
                      onContextMenu={isMine && !isEditing ? (e) => {
                        e.preventDefault();
                        // Keep menu inside viewport
                        const menuW = 160, menuH = 90;
                        const x = Math.min(e.clientX, window.innerWidth - menuW - 8);
                        const y = Math.min(e.clientY, window.innerHeight - menuH - 8);
                        setContextMenu({ msgId: msg.id, x, y });
                      } : undefined}
                    >
                      {/* no inline menu — handled via fixed context menu below */}

                      {/* Message bubble — normal or edit mode */}
                      <div
                        className="message-bubble"
                        style={{ minWidth: isEditing ? '280px' : 'auto' }}
                      >
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <textarea
                              ref={editInputRef}
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(msg.id); }
                                if (e.key === 'Escape') cancelEditing();
                              }}
                              style={{
                                width: '100%', background: 'hsla(220, 30%, 8%, 0.8)',
                                border: '1px solid hsl(var(--accent-cyan))', borderRadius: '6px',
                                color: '#fff', padding: '8px 10px', fontSize: '0.85rem',
                                resize: 'none', minHeight: '60px', outline: 'none',
                                fontFamily: 'inherit', lineHeight: '1.4'
                              }}
                            />
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', alignSelf: 'center' }}>
                                Enter to save • Esc to cancel
                              </span>
                              <button onClick={cancelEditing} style={{
                                background: 'transparent', border: '1px solid hsl(var(--border-glass))',
                                color: 'hsl(var(--text-muted))', padding: '4px 10px', borderRadius: '5px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem'
                              }}>
                                <X size={12} /> Cancel
                              </button>
                              <button onClick={() => handleEditSubmit(msg.id)} style={{
                                background: 'hsl(var(--accent-cyan))', border: 'none', color: '#000',
                                padding: '4px 10px', borderRadius: '5px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '600'
                              }}>
                                <Check size={12} /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.85rem' }}>{msg.content}</p>
                        )}
                      </div>

                      <div className="message-meta">
                        <span style={{ fontWeight: '600', color: 'hsl(var(--accent-cyan))' }}>{msg.username}</span>
                        <span>•</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <form onSubmit={handleSendMessage} className="chat-input-bar">
            <input
              type="text"
              placeholder="Post a message to the team..."
              value={typedMessage}
              onChange={e => setTypedMessage(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ color: '#000', padding: '12px 20px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Right: Notifications + Deadline Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={14} style={{ color: 'hsl(var(--accent-cyan))' }} /> Activity Notices
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'hsla(190, 90%, 50%, 0.05)', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid hsla(190, 90%, 50%, 0.1)' }}>
                <strong>Check-In system operational!</strong> Remember to check in when commencing your workday.
              </div>
              <div style={{ padding: '8px', background: 'hsla(190, 90%, 50%, 0.05)', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid hsla(190, 90%, 50%, 0.1)' }}>
                <strong>Database Backup:</strong> Automatic SQLite database seeding is completed successfully.
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', flex: 1.2, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} style={{ color: 'hsl(var(--status-high))' }} /> Deadline Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasksAlerts.length === 0 ? (
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', fontStyle: 'italic' }}>
                  No tasks due in the next 3 days! Keep it up.
                </p>
              ) : (
                tasksAlerts.map(task => (
                  <div key={task.id} style={{
                    padding: '10px', background: 'hsla(0, 85%, 60%, 0.15)', borderRadius: '8px',
                    fontSize: '0.75rem', border: '1px solid hsla(0, 85%, 60%, 0.3)', textAlign: 'left'
                  }}>
                    <strong style={{ color: 'hsl(var(--status-high))' }}>DUE SOON:</strong> {task.title}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                      <span>Due: {task.due_date}</span>
                      <span style={{ color: 'hsl(var(--status-high))', fontWeight: '700' }}>
                        ({task.daysLeft === 0 ? 'Due today!' : `${task.daysLeft} days left`})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Chat;
