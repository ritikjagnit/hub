import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, Send, Sparkles, AlertTriangle, FileText, Calendar, Plus, List } from 'lucide-react';

const AIAssistant = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am Ascent AI. Select a project and ask me to generate tasks, outline timelines, or audit delivery risks.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Tab controls
  const [activeTool, setActiveTool] = useState('chat'); // chat, task_gen, plan, risk, summary, report
  
  // Tool output states
  const [taskGenPrompt, setTaskGenPrompt] = useState('');
  const [toolOutput, setToolOutput] = useState(null);

  // Meeting notes summary input
  const [meetingNotes, setMeetingNotes] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) setSelectedProject(data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    const prompt = chatInput;
    setChatInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: prompt,
          project_id: selectedProject ? parseInt(selectedProject) : null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an issue processing that query.' }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runAITool = async (toolType) => {
    setLoading(true);
    setToolOutput(null);
    let url = '';
    let body = {};

    if (toolType === 'task_gen') {
      url = '/api/ai/generate-tasks';
      body = { project_id: parseInt(selectedProject), description: taskGenPrompt };
    } else if (toolType === 'plan') {
      url = '/api/ai/project-plan';
      body = { project_id: parseInt(selectedProject) };
    } else if (toolType === 'risk') {
      url = `/api/ai/detect-risks/${selectedProject}`;
    } else if (toolType === 'report') {
      url = `/api/ai/generate-report/${selectedProject}`;
    } else if (toolType === 'summary') {
      url = '/api/ai/summarize-meeting';
      body = { notes: meetingNotes };
    }

    try {
      const isGet = toolType === 'risk' || toolType === 'report';
      const config = {
        method: isGet ? 'GET' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      if (!isGet) {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(body);
      }

      const res = await fetch(url, config);
      if (res.ok) {
        setToolOutput(await res.json());
      } else {
        setToolOutput({ error: 'Failed to run tool operations.' });
      }
    } catch (err) {
      console.error(err);
      setToolOutput({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Ascent AI Core</h1>
          <p className="page-subtitle">Leverage local predictive logic and LLMs to structure planning, scan deliverables, and summarize discussions.</p>
        </div>
        <div>
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{ padding: '10px 16px', minWidth: '220px', background: 'hsl(222, 22%, 13%)', border: '1px solid hsl(var(--border-glass))', color: '#fff', borderRadius: '8px' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
        {/* Left Menu / Tools Selection */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', fontWeight: '800', marginBottom: '8px' }}>AI Skill Sets</span>
          {[
            { id: 'chat', label: 'AI Chat Assistant', icon: Bot },
            { id: 'task_gen', label: 'AI Task Generator', icon: Plus },
            { id: 'plan', label: 'Project Planner', icon: Calendar },
            { id: 'risk', label: 'Risk Scanner', icon: AlertTriangle },
            { id: 'summary', label: 'Meeting Summarizer', icon: List },
            { id: 'report', label: 'Analytical Reports', icon: FileText }
          ].map(tool => {
            const Icon = tool.icon;
            return (
              <button 
                key={tool.id}
                onClick={() => { setActiveTool(tool.id); setToolOutput(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTool === tool.id ? 'hsla(190, 90%, 55%, 0.1)' : 'transparent',
                  color: activeTool === tool.id ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: activeTool === tool.id ? '700' : '400',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Tool Interface Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
          {activeTool === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Chat Messages */}
              <div style={{ flex: 1, maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px', marginBottom: '16px' }}>
                {messages.map((m, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}>
                    {m.sender === 'ai' && (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsla(190, 90%, 50%, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--accent-cyan))', flexShrink: 0 }}>
                        <Bot size={16} />
                      </div>
                    )}
                    <div style={{ 
                      padding: '10px 14px', 
                      borderRadius: m.sender === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                      background: m.sender === 'user' ? 'hsla(190, 90%, 55%, 0.1)' : 'hsla(220, 20%, 20%, 0.4)',
                      border: m.sender === 'user' ? '1px solid hsla(190, 90%, 55%, 0.3)' : '1px solid hsl(var(--border-glass))',
                      fontSize: '0.85rem',
                      lineHeight: 1.4
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsla(190, 90%, 50%, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--accent-cyan))', flexShrink: 0 }}>
                      <Sparkles size={14} className="stopwatch-active" />
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: '0 12px 12px 12px', background: 'hsla(220, 20%, 20%, 0.4)', border: '1px solid hsl(var(--border-glass))', fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
                      Processing Query...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              {/* Message Input */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Ask something about this workspace..." 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  style={{ flex: 1, padding: '10px 16px', fontSize: '0.88rem', background: 'hsla(220, 20%, 20%, 0.6)' }}
                />
                <button type="submit" className="btn btn-primary" style={{ color: '#000', padding: '10px 18px' }}>
                  <Send size={16} /> Send
                </button>
              </form>
            </div>
          )}

          {activeTool === 'task_gen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>AI Task Generator</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Type custom project goals and target endpoints, and Ascent AI will map tasks automatically.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="e.g. Integrate email verification templates and Razorpay checkouts" 
                  value={taskGenPrompt} 
                  onChange={(e) => setTaskGenPrompt(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
                />
                <button onClick={() => runAITool('task_gen')} className="btn btn-primary" style={{ color: '#000' }}>
                  Generate Tasks
                </button>
              </div>

              {toolOutput && toolOutput.tasks && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--accent-cyan))', marginBottom: '10px' }}>Suggested Deliverables:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {toolOutput.tasks.map((t, idx) => (
                      <div key={idx} className="glass-panel" style={{ padding: '12px 14px', background: 'hsla(220, 20%, 20%, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h5 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{t.title}</h5>
                          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{t.description}</p>
                        </div>
                        <span className={`task-priority-badge priority-${t.priority}`} style={{ margin: 0 }}>
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTool === 'plan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>Project Planner & Roadmap</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Outlines standard development roadmaps and highlights critical path phases.</p>
              <button onClick={() => runAITool('plan')} className="btn btn-primary" style={{ alignSelf: 'flex-start', color: '#000' }}>
                Calculate Roadmap
              </button>

              {toolOutput && toolOutput.phases && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--accent-cyan))', marginBottom: '10px' }}>Roadmap Phases:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {toolOutput.phases.map((ph, idx) => (
                      <div key={idx} className="glass-panel" style={{ padding: '14px', background: 'hsla(220, 20%, 15%, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.85rem', color: '#fff' }}>
                          <span>Phase: {ph.phase}</span>
                          <span style={{ color: 'hsl(var(--accent-cyan))' }}>{ph.duration}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                          {ph.milestones.map((mil, mIdx) => (
                            <span key={mIdx} style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'hsla(220,20%,20%,0.6)', border: '1px solid hsl(var(--border-glass))', borderRadius: '4px' }}>
                              Milestone: {mil}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTool === 'risk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>Delivery Risk Scanner</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Scans current task lists, budget structures, and timelines to flag delivery risk factors.</p>
              <button onClick={() => runAITool('risk')} className="btn btn-primary" style={{ alignSelf: 'flex-start', color: '#000' }}>
                Scan Risks
              </button>

              {toolOutput && toolOutput.risks && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {toolOutput.risks.map((risk, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', background: 'hsla(220, 20%, 20%, 0.2)', borderLeft: `4px solid ${risk.level === 'critical' ? 'hsl(var(--status-high))' : risk.level === 'high' ? 'orange' : 'hsl(var(--status-complete))'}` }}>
                      <AlertTriangle size={20} style={{ color: risk.level === 'critical' ? 'hsl(var(--status-high))' : 'orange' }} />
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>{risk.title}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{risk.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTool === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>Meeting Summarizer</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Paste discussions or agendas below to extract summaries and compile action items.</p>
              <textarea 
                rows={4} 
                placeholder="Paste meeting discussion transcripts or notes here..." 
                value={meetingNotes} 
                onChange={(e) => setMeetingNotes(e.target.value)}
                style={{ background: 'hsla(220, 20%, 20%, 0.5)' }}
              />
              <button onClick={() => runAITool('summary')} className="btn btn-primary" style={{ alignSelf: 'flex-start', color: '#000' }}>
                Summarize Notes
              </button>

              {toolOutput && toolOutput.summary && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="glass-panel" style={{ padding: '14px', background: 'hsla(220, 20%, 15%, 0.4)' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'hsl(var(--accent-cyan))', marginBottom: '6px' }}>AI Summary:</h4>
                    <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-main))', lineHeight: 1.5 }}>{toolOutput.summary}</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '14px', background: 'hsla(220, 20%, 15%, 0.4)' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'hsl(var(--status-pending))', marginBottom: '6px' }}>Action Items:</h4>
                    <ul style={{ paddingLeft: '16px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {toolOutput.action_items.map((item, idx) => (
                        <li key={idx} style={{ color: 'hsl(var(--text-main))' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTool === 'report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>AI Analytical Reports</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Compiles detailed project progress, cost tracking and resource allocation reports.</p>
              <button onClick={() => runAITool('report')} className="btn btn-primary" style={{ alignSelf: 'flex-start', color: '#000' }}>
                Generate PDF/Text Report
              </button>

              {toolOutput && toolOutput.report && (
                <div className="glass-panel" style={{ marginTop: '16px', padding: '16px', background: 'hsla(220, 20%, 12%, 0.5)', overflowX: 'auto' }}>
                  <pre style={{ 
                    fontFamily: 'Courier New, Courier, monospace', 
                    fontSize: '0.8rem', 
                    color: 'hsl(var(--text-main))',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {toolOutput.report}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
