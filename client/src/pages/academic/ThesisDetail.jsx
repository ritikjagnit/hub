import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, FileText, Send, Sparkles, AlertCircle, RefreshCw, CheckCircle, Database, HelpCircle, UserCheck } from 'lucide-react';

const ThesisDetail = () => {
  const { token, user } = useAuth();

  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [objectives, setObjectives] = useState('');
  const [literatureReview, setLiteratureReview] = useState('');
  const [methodology, setMethodology] = useState('');

  // Version Upload
  const [uploadFile, setUploadFile] = useState(null);
  const [versionDesc, setVersionDesc] = useState('');
  const [uploadingVersion, setUploadingVersion] = useState(false);

  // Comments state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // AI Assistant Panel State
  const [aiOperation, setAiOperation] = useState('thesis_reviewer');
  const [aiInputText, setAiInputText] = useState('');
  const [aiOutputText, setAiOutputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'

  useEffect(() => {
    if (token) {
      fetchThesisData();
    }
  }, [token]);

  const fetchThesisData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/academic/thesis', { headers });

      if (res.ok) {
        const data = await res.json();
        if (data) {
          setThesis(data);
          setTitle(data.title || '');
          setAbstract(data.abstract || '');
          setProblemStatement(data.problem_statement || '');
          setObjectives(data.objectives || '');
          setLiteratureReview(data.literature_review || '');
          setMethodology(data.methodology || '');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-Save Drafts on field blur
  const triggerAutoSave = async () => {
    setAutoSaveStatus('saving');
    try {
      const body = {
        title,
        abstract,
        problem_statement: problemStatement,
        objectives,
        literature_review: literatureReview,
        methodology
      };

      const res = await fetch('/api/academic/thesis/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setAutoSaveStatus('saved');
        const updated = await res.json();
        setThesis(prev => ({ ...prev, ...updated.thesis }));
      } else {
        setAutoSaveStatus('error');
      }
    } catch (err) {
      console.error('AutoSave failed:', err);
      setAutoSaveStatus('error');
    }
  };

  // Submit revision version
  const handleVersionSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('description', versionDesc);

      const res = await fetch('/api/academic/thesis/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setUploadFile(null);
        setVersionDesc('');
        fetchThesisData(); // Refresh history
        alert('Thesis version submitted successfully!');
      } else {
        alert('Failed to upload file.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingVersion(false);
    }
  };

  // Add guide comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText || !thesis) return;

    setSubmittingComment(true);
    try {
      const res = await fetch('/api/academic/thesis/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ thesis_id: thesis.id, comment: commentText })
      });

      if (res.ok) {
        setCommentText('');
        fetchThesisData(); // Refresh comment log
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Call academic AI endpoints
  const handleCallAI = async () => {
    setAiLoading(true);
    setAiOutputText('');
    try {
      // Gather relevant text field based on selected operation
      let targetText = aiInputText;
      if (!targetText) {
        if (aiOperation === 'grammar_checker' || aiOperation === 'formatting_suggestions') {
          targetText = abstract || title;
        } else if (aiOperation === 'thesis_reviewer') {
          targetText = `Title: ${title}\nAbstract: ${abstract}\nObjectives: ${objectives}`;
        } else if (aiOperation === 'chapter_summary') {
          targetText = literatureReview || methodology;
        }
      }

      const res = await fetch('/api/ai/academic-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operation: aiOperation,
          text: targetText,
          context: {
            title,
            abstract
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiOutputText(data.response);
      } else {
        setAiOutputText('Failed to query the AI assistant. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setAiOutputText('Server connectivity lost.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading thesis editor workspace...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', textAlign: 'left' }}>
      
      {/* Left Column: Thesis Document Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Document Editor glass panel */}
        <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <BookOpen size={20} style={{ color: 'hsl(var(--accent-cyan))' }} /> Interactive Thesis Draft Editor
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '12px',
                background: autoSaveStatus === 'saved' ? 'hsla(145,75%,45%,0.15)' : 'hsla(40,90%,55%,0.15)',
                color: autoSaveStatus === 'saved' ? 'hsl(var(--status-complete))' : 'hsl(40,90%,55%)',
                fontWeight: '700'
              }}>
                {autoSaveStatus === 'saving' ? 'Auto-saving...' : autoSaveStatus === 'saved' ? 'All changes saved' : 'Save Error'}
              </span>
            </div>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>Thesis Title</label>
              <input
                type="text"
                placeholder="e.g. Multi-agent Task Allocation in SASE Networks"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={triggerAutoSave}
                style={{
                  background: 'hsla(0,0%,0%,0.2)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Abstract */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>Abstract</label>
              <textarea
                placeholder="Write a clear academic abstract..."
                value={abstract}
                onChange={e => setAbstract(e.target.value)}
                onBlur={triggerAutoSave}
                style={{
                  background: 'hsla(0,0%,0%,0.2)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  minHeight: '110px'
                }}
              />
            </div>

            {/* Problem Statement */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>Problem Statement</label>
              <textarea
                placeholder="Detail the gaps in existing research and what this project addresses..."
                value={problemStatement}
                onChange={e => setProblemStatement(e.target.value)}
                onBlur={triggerAutoSave}
                style={{
                  background: 'hsla(0,0%,0%,0.2)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  minHeight: '90px'
                }}
              />
            </div>

            {/* Objectives */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>Project Objectives</label>
              <textarea
                placeholder="Enumerate project objectives (e.g. 1. Build low latency nodes...)"
                value={objectives}
                onChange={e => setObjectives(e.target.value)}
                onBlur={triggerAutoSave}
                style={{
                  background: 'hsla(0,0%,0%,0.2)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  minHeight: '90px'
                }}
              />
            </div>

            {/* Literature Review */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>Literature Review</label>
              <textarea
                placeholder="Examine prior methodologies and cite notable publications..."
                value={literatureReview}
                onChange={e => setLiteratureReview(e.target.value)}
                onBlur={triggerAutoSave}
                style={{
                  background: 'hsla(0,0%,0%,0.2)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  minHeight: '120px'
                }}
              />
            </div>

            {/* Methodology */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>Methodology</label>
              <textarea
                placeholder="Explain systems architecture, algorithm pipelines, and SQLite storage diagrams..."
                value={methodology}
                onChange={e => setMethodology(e.target.value)}
                onBlur={triggerAutoSave}
                style={{
                  background: 'hsla(0,0%,0%,0.2)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  minHeight: '120px'
                }}
              />
            </div>

          </form>
        </div>

        {/* Revision Version uploads & PDF link history */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px' }}>Version History / Deliverable Uploads</h3>
          
          <form onSubmit={handleVersionSubmit} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr auto',
            gap: '12px',
            alignItems: 'end',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid hsl(var(--border-glass))'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Select Document (PDF/DOCX/ZIP)</label>
              <input
                type="file"
                required
                onChange={e => setUploadFile(e.target.files[0])}
                style={{ color: '#fff', fontSize: '0.8rem' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Revision Description</label>
              <input
                type="text"
                placeholder="e.g. Chapter 2 draft with guide comments integrated"
                value={versionDesc}
                onChange={e => setVersionDesc(e.target.value)}
                style={{
                  background: 'hsla(0,0%,0%,0.2)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: '0.8rem'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={uploadingVersion}
              style={{
                background: 'hsl(var(--accent-purple))',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {uploadingVersion ? 'Uploading...' : 'Submit Version'}
            </button>
          </form>

          {/* Versions Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {thesis?.ThesisVersion?.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', fontStyle: 'italic' }}>
                No artifact versions uploaded. Submit files to track revisions.
              </p>
            ) : (
              thesis?.ThesisVersion?.map((v, i) => (
                <div key={v.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsl(var(--border-glass))',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ color: '#fff' }}>Version {i + 1} - Rev {v.version}</strong>
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.72rem', marginTop: '2px' }}>{v.description}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                    <a
                      href={v.file_path}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: 'none',
                        border: '1px solid hsl(var(--border-glass))',
                        color: 'hsl(var(--accent-cyan))',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '0.7rem'
                      }}
                    >
                      Download File
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column: AI Assistant Panel & Comments Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* AI Assistant Panel */}
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid hsla(260, 90%, 55%, 0.25)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'hsl(var(--accent-purple))' }} /> AI Academic Helper
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Operation selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>AI Operation</label>
              <select
                value={aiOperation}
                onChange={e => setAiOperation(e.target.value)}
                style={{
                  background: 'hsla(0,0%,0%,0.2)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '6px',
                  padding: '8px',
                  color: '#fff',
                  fontSize: '0.8rem'
                }}
              >
                <option value="thesis_reviewer">Structural Thesis Reviewer</option>
                <option value="grammar_checker">Grammar & Subject-Verb Check</option>
                <option value="formatting_suggestions">Academic Style formatting</option>
                <option value="reference_suggestions">Suggest Citation Reference</option>
                <option value="chapter_summary">Generate Chapter Summary</option>
                <option value="viva_question_generator">Mock Viva Question Prep</option>
                <option value="resume_builder">Resume Highlight Builder</option>
                <option value="task_breakdown">AI Task Breakdown</option>
              </select>
            </div>

            {/* Custom context input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Target Text (Optional)</label>
              <textarea
                placeholder="Paste target sentences here or leave blank to evaluate current draft..."
                value={aiInputText}
                onChange={e => setAiInputText(e.target.value)}
                style={{
                  background: 'hsla(0,0%,0%,0.2)',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: '6px',
                  padding: '8px',
                  color: '#fff',
                  fontSize: '0.78rem',
                  minHeight: '60px'
                }}
              />
            </div>

            <button
              onClick={handleCallAI}
              disabled={aiLoading}
              style={{
                background: 'hsl(var(--accent-purple))',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {aiLoading ? 'AI is thinking...' : 'Analyze Section'}
            </button>

            {/* AI Output Card */}
            {aiOutputText && (
              <div style={{
                background: 'hsla(0,0%,0%,0.25)',
                border: '1px solid hsl(var(--border-glass))',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.78rem',
                color: '#fff',
                textAlign: 'left',
                maxHeight: '260px',
                overflowY: 'auto',
                whiteSpace: 'pre-line',
                lineHeight: 1.4
              }}>
                {aiOutputText}
              </div>
            )}

          </div>
        </div>

        {/* Comments Feed Thread */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px' }}>Mentor Collaboration Logs</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', flexGrow: 1, marginBottom: '16px' }}>
            {thesis?.ThesisComment?.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.78rem', fontStyle: 'italic' }}>
                No messages logged yet. Use comments to ask questions about drafts.
              </p>
            ) : (
              thesis?.ThesisComment?.map(c => {
                const isMyMessage = c.user_id === user.id;

                return (
                  <div key={c.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMyMessage ? 'flex-end' : 'flex-start',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isMyMessage ? 'hsl(var(--accent-purple))' : 'hsla(0, 0%, 100%, 0.05)',
                      color: '#fff',
                      maxWidth: '85%',
                      textAlign: 'left'
                    }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'hsla(0,0%,100%,0.7)', marginBottom: '3px' }}>
                        {c.User?.username} ({c.User?.role})
                      </div>
                      {c.comment}
                    </div>
                    <span style={{ fontSize: '0.62rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              required
              placeholder="Ask a question or log feedback..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              style={{
                flex: 1,
                background: 'hsla(0,0%,0%,0.2)',
                border: '1px solid hsl(var(--border-glass))',
                borderRadius: '6px',
                padding: '8px',
                color: '#fff',
                fontSize: '0.8rem'
              }}
            />
            <button
              type="submit"
              disabled={submittingComment}
              style={{
                background: 'hsl(var(--accent-cyan))',
                color: '#000',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default ThesisDetail;
