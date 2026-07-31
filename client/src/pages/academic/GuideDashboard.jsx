import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, FileText, CheckCircle, XCircle, Award, Calendar, Sparkles, AlertCircle, Play, Check } from 'lucide-react';

const GuideDashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [students, setStudents] = useState([]);
  const [pendingLogs, setPendingLogs] = useState([]);
  const [pendingThesis, setPendingThesis] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grading Modal fields
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [guideMarks, setGuideMarks] = useState('');
  const [presentationMarks, setPresentationMarks] = useState('');
  const [documentationMarks, setDocumentationMarks] = useState('');
  const [codingMarks, setCodingMarks] = useState('');
  const [attendanceMarks, setAttendanceMarks] = useState('');
  const [marksComments, setMarksComments] = useState('');
  const [submittingMarks, setSubmittingMarks] = useState(false);

  // Review Modal (Log / Thesis)
  const [reviewType, setReviewType] = useState(''); // 'log' or 'thesis'
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (token) {
      fetchGuideOverview();
    }
  }, [token]);

  const fetchGuideOverview = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/academic/overview/guide', { headers });

      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setPendingLogs(data.pending_logs || []);
        setPendingThesis(data.pending_thesis || []);
      }
    } catch (err) {
      console.error('Error fetching guide overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmittingReview(true);
    try {
      const url = reviewType === 'thesis' ? '/api/academic/thesis/status' : '/api/academic/dailylog/review';
      const body = {
        id: selectedItem.id,
        status: reviewStatus,
        feedback: reviewFeedback
      };

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setSelectedItem(null);
        setReviewFeedback('');
        fetchGuideOverview(); // reload
      } else {
        alert('Failed to submit review decisions.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleGradingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSubmittingMarks(true);
    try {
      const body = {
        student_id: selectedStudent.id,
        guide_marks: guideMarks,
        presentation_marks: presentationMarks,
        documentation_marks: documentationMarks,
        coding_marks: codingMarks,
        attendance_marks: attendanceMarks,
        comments: marksComments
      };

      const res = await fetch('/api/academic/marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowGradingModal(false);
        setGuideMarks('');
        setPresentationMarks('');
        setDocumentationMarks('');
        setCodingMarks('');
        setAttendanceMarks('');
        setMarksComments('');
        alert('Marks published successfully!');
      } else {
        alert('Failed to submit marks.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingMarks(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading Guide Panel...</div>;
  }

  return (
    <div style={{ textAlign: 'left' }}>
      
      {/* Header Banner */}
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
            Mentor Dashboard
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', maxWidth: '600px', lineHeight: '1.5' }}>
            Evaluate student deliverables, authorize daily work submissions, manage grading boards, and review code plans.
          </p>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'hsla(190, 90%, 50%, 0.1)', color: 'hsl(var(--accent-cyan))' }}>
            <Users size={20} />
          </div>
          <div className="metric-info">
            <h3>Assigned Students</h3>
            <p>{students.length}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>Active Capstone Researchers</span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'hsla(40, 90%, 55%, 0.1)', color: 'hsl(40, 90%, 55%)' }}>
            <FileText size={20} />
          </div>
          <div className="metric-info">
            <h3>Thesis Submissions</h3>
            <p>{pendingThesis.length}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>Pending Review/Revision</span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'hsla(260, 90%, 55%, 0.1)', color: 'hsl(var(--accent-purple))' }}>
            <Calendar size={20} />
          </div>
          <div className="metric-info">
            <h3>Pending Logs</h3>
            <p>{pendingLogs.length}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>Daily Progress Reviews</span>
          </div>
        </div>
      </div>

      {/* Main Review Section Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Thesis Pending Reviews List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'hsl(var(--accent-cyan))' }} /> Pending Thesis Submissions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
            {pendingThesis.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', padding: '20px 0' }}>No pending thesis submissions.</p>
            ) : (
              pendingThesis.map(t => (
                <div key={t.id} style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'hsla(0, 0%, 100%, 0.02)',
                  border: '1px solid hsl(var(--border-glass))',
                  fontSize: '0.8rem',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: '#fff' }}>{t.title}</strong>
                    <span style={{ color: 'hsl(var(--accent-cyan))', fontSize: '0.72rem' }}>Student: {t.Student?.username}</span>
                  </div>
                  <p style={{ color: 'hsl(var(--text-muted))', margin: '4px 0 10px 0', fontSize: '0.75rem', lineHeight: 1.4 }}>
                    {t.abstract ? t.abstract.substring(0, 140) + '...' : 'No abstract provided.'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setReviewType('thesis');
                        setSelectedItem(t);
                        setReviewStatus('approved');
                      }}
                      style={{
                        background: 'hsla(145, 75%, 45%, 0.15)',
                        border: '1px solid hsla(145, 75%, 45%, 0.3)',
                        color: 'hsl(var(--status-complete))',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                    >
                      Review Deliverable
                    </button>
                    <button
                      onClick={() => navigate('/academic/thesis')}
                      style={{
                        background: 'hsla(0,0%,100%,0.05)',
                        border: '1px solid hsl(var(--border-glass))',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                    >
                      View Full Document
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Daily Logs Approvals */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'hsl(var(--accent-purple))' }} /> Student Daily Logs Approvals
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
            {pendingLogs.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', padding: '20px 0' }}>No pending daily logs.</p>
            ) : (
              pendingLogs.map(l => (
                <div key={l.id} style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'hsla(0, 0%, 100%, 0.02)',
                  border: '1px solid hsl(var(--border-glass))',
                  fontSize: '0.8rem',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#fff' }}>{l.Student?.username}</strong>
                    <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>
                      {new Date(l.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: 'hsl(var(--text-muted))', margin: '4px 0 8px 0', fontSize: '0.75rem', lineHeight: 1.4 }}>
                    {l.today_work}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                    <span>Hours: {l.hours_worked} hrs</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setReviewType('log');
                          setSelectedItem(l);
                          setReviewStatus('approved');
                        }}
                        style={{
                          background: 'hsla(145, 75%, 45%, 0.15)',
                          border: 'none',
                          color: 'hsl(var(--status-complete))',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setReviewType('log');
                          setSelectedItem(l);
                          setReviewStatus('rejected');
                        }}
                        style={{
                          background: 'hsla(0, 80%, 60%, 0.15)',
                          border: 'none',
                          color: 'hsl(0, 80%, 60%)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Student List & Grade Actions */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px' }}>Assigned Students Evaluations Board</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border-glass))', color: 'hsl(var(--text-muted))', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Department</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-muted))' }}>
                    No students assigned to your projects.
                  </td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid hsla(0,0%,100%,0.02)', color: '#fff' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{s.username}</td>
                    <td style={{ padding: '12px', color: 'hsl(var(--text-muted))' }}>{s.email}</td>
                    <td style={{ padding: '12px', color: 'hsl(var(--text-muted))' }}>Computer Science</td>
                    <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          setSelectedStudent(s);
                          setShowGradingModal(true);
                        }}
                        style={{
                          background: 'hsl(var(--accent-purple))',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.75rem'
                        }}
                      >
                        Publish Marks
                      </button>
                      <button
                        onClick={() => navigate(`/academic/marks?studentId=${s.id}`)}
                        style={{
                          background: 'none',
                          border: '1px solid hsl(var(--border-glass))',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        View Marksheet
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVIEW DECISION MODAL */}
      {selectedItem && (
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
          <div className="glass-panel" style={{ width: '90%', maxWidth: '450px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', marginTop: 0, marginBottom: '14px' }}>
              Submit Review Decisions ({reviewType.toUpperCase()})
            </h3>
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Review Outcome</label>
                <select
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value)}
                  style={{
                    background: 'hsla(0,0%,0%,0.2)',
                    border: '1px solid hsl(var(--border-glass))',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.85rem'
                  }}
                >
                  {reviewType === 'thesis' ? (
                    <>
                      <option value="approved">Approved</option>
                      <option value="revision_required">Revision Required</option>
                      <option value="under_review">Under Review</option>
                      <option value="rejected">Rejected</option>
                    </>
                  ) : (
                    <>
                      <option value="approved">Approve & Log Hours</option>
                      <option value="rejected">Reject Log</option>
                    </>
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Feedback Comments</label>
                <textarea
                  required
                  placeholder="Provide structured suggestions or reasons..."
                  value={reviewFeedback}
                  onChange={e => setReviewFeedback(e.target.value)}
                  style={{
                    background: 'hsla(0,0%,0%,0.2)',
                    border: '1px solid hsl(var(--border-glass))',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '0.85rem',
                    minHeight: '80px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={submittingReview}
                  style={{
                    flex: 1,
                    background: 'hsl(var(--accent-cyan))',
                    color: '#000',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Evaluation'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{
                    flex: 0.5,
                    background: 'none',
                    border: '1px solid hsl(var(--border-glass))',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADING BOARD MODAL */}
      {showGradingModal && selectedStudent && (
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
            width: '95%',
            maxWidth: '500px',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginTop: 0, marginBottom: '14px', textAlign: 'left' }}>
              Rubric Grading Board: {selectedStudent.username}
            </h3>
            
            <form onSubmit={handleGradingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>Guide Marks (Max 10)</label>
                  <input
                    type="number"
                    min="0" max="10"
                    required
                    value={guideMarks}
                    onChange={e => setGuideMarks(e.target.value)}
                    style={{
                      background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                      color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', width: '100%'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>Presentation (Max 10)</label>
                  <input
                    type="number"
                    min="0" max="10"
                    required
                    value={presentationMarks}
                    onChange={e => setPresentationMarks(e.target.value)}
                    style={{
                      background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                      color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', width: '100%'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>Documentation (Max 10)</label>
                  <input
                    type="number"
                    min="0" max="10"
                    required
                    value={documentationMarks}
                    onChange={e => setDocumentationMarks(e.target.value)}
                    style={{
                      background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                      color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', width: '100%'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>Coding Standards (Max 10)</label>
                  <input
                    type="number"
                    min="0" max="10"
                    required
                    value={codingMarks}
                    onChange={e => setCodingMarks(e.target.value)}
                    style={{
                      background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                      color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', width: '100%'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>Attendance Marks (Max 10)</label>
                <input
                  type="number"
                  min="0" max="10"
                  required
                  value={attendanceMarks}
                  onChange={e => setAttendanceMarks(e.target.value)}
                  style={{
                    background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                    color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>Overall Evaluative Comments</label>
                <textarea
                  placeholder="Summarize project quality, team collaboration, and defense readiness..."
                  value={marksComments}
                  onChange={e => setMarksComments(e.target.value)}
                  style={{
                    background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                    color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', minHeight: '60px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={submittingMarks}
                  style={{
                    flex: 1,
                    background: 'hsl(var(--accent-purple))',
                    color: '#fff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {submittingMarks ? 'Publishing Marks...' : 'Publish Evaluation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
                  style={{
                    flex: 0.5,
                    background: 'none',
                    border: '1px solid hsl(var(--border-glass))',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GuideDashboard;
