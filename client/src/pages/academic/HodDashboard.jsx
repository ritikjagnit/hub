import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, BookOpen, Award, FileText, CheckCircle, Search, Sparkles, PieChartIcon, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const HodDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Certificate Issuance State
  const [issuingCert, setIssuingCert] = useState(false);

  useEffect(() => {
    if (token) {
      fetchHodOverview();
    }
  }, [token]);

  const fetchHodOverview = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/academic/overview/hod', { headers });

      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error('Error fetching HOD overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (studentId) => {
    if (!window.confirm('Are you sure you want to issue a Completion Certificate for this student?')) return;

    setIssuingCert(true);
    try {
      const res = await fetch('/api/academic/certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ student_id: studentId, certificate_type: 'completion' })
      });

      if (res.ok) {
        alert('Certificate generated successfully!');
        fetchHodOverview(); // Refresh HOD state
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to generate certificate. Ensure student has passing grades published.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIssuingCert(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading Department analytics panel...</div>;
  }

  // Filter students based on search
  const filteredStudents = stats?.students?.filter(s =>
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Prepare chart data (Grade range distribution)
  const gradeDistribution = [
    { range: 'Under Review', Count: stats?.students?.filter(s => s.EvaluationMarks?.length === 0).length || 0 },
    { range: 'Passed (40+)', Count: stats?.students?.filter(s => s.EvaluationMarks?.[0]?.final_marks >= 40).length || 0 },
    { range: 'First Class (30-39)', Count: stats?.students?.filter(s => s.EvaluationMarks?.[0]?.final_marks >= 30 && s.EvaluationMarks?.[0]?.final_marks < 40).length || 0 },
    { range: 'Second Class (20-29)', Count: stats?.students?.filter(s => s.EvaluationMarks?.[0]?.final_marks >= 20 && s.EvaluationMarks?.[0]?.final_marks < 30).length || 0 },
    { range: 'Needs Improvement (<20)', Count: stats?.students?.filter(s => s.EvaluationMarks?.[0]?.final_marks > 0 && s.EvaluationMarks?.[0]?.final_marks < 20).length || 0 }
  ];

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
            Department Board (HOD)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', maxWidth: '600px', lineHeight: '1.5' }}>
            Monitor academic progress statistics across all capstone categories, inspect guides workload, and release credentials.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'hsla(190, 90%, 50%, 0.1)', color: 'hsl(var(--accent-cyan))' }}>
            <Users size={20} />
          </div>
          <div className="metric-info">
            <h3>Total Mentors</h3>
            <p>{stats?.total_guides || 0}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>Active Academic Advisors</span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'hsla(260, 90%, 55%, 0.1)', color: 'hsl(var(--accent-purple))' }}>
            <BookOpen size={20} />
          </div>
          <div className="metric-info">
            <h3>Thesis Status</h3>
            <p>{stats?.total_thesis || 0}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>Submitted drafts: {stats?.approved_thesis || 0} approved</span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'hsla(145, 75%, 45%, 0.1)', color: 'hsl(var(--status-complete))' }}>
            <Award size={20} />
          </div>
          <div className="metric-info">
            <h3>Issued Credentials</h3>
            <p>{stats?.total_certificates || 0}</p>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>QR-Verified certificates issued</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Bar Chart & Search Board */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Grading Distribution Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChartIcon size={18} style={{ color: 'hsl(var(--accent-cyan))' }} /> Department Performance Curve
          </h3>
          <div style={{ width: '100%', height: '230px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="range" stroke="hsl(var(--text-muted))" fontSize={10} tickLine={false} />
                <YAxis stroke="hsl(var(--text-muted))" fontSize={10} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--bg-secondary))', borderColor: 'hsl(var(--border-glass))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--text-main))', fontWeight: 'bold' }}
                />
                <Bar dataKey="Count" fill="hsl(var(--accent-purple))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Guides Overview / Load Summary */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px' }}>Guide Faculty Workloads</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '230px', overflowY: 'auto' }}>
            {stats?.guides?.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No advisors registered.</p>
            ) : (
              stats?.guides?.map(g => (
                <div key={g.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsl(var(--border-glass))',
                  fontSize: '0.8rem',
                  color: '#fff'
                }}>
                  <div>
                    <strong>{g.username}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>{g.email}</div>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    background: 'hsla(190, 90%, 50%, 0.15)',
                    color: 'hsl(var(--accent-cyan))',
                    fontWeight: '700'
                  }}>
                    {g.GuidedThesis?.length || 0} Students
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Student Audit Board */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Student Academic Auditing</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'hsl(var(--text-muted))' }} />
            <input
              type="text"
              placeholder="Search student or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'hsla(0,0%,0%,0.2)',
                border: '1px solid hsl(var(--border-glass))',
                borderRadius: '8px',
                padding: '6px 10px 6px 30px',
                color: '#fff',
                fontSize: '0.8rem',
                width: '200px'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border-glass))', color: 'hsl(var(--text-muted))', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Student</th>
                <th style={{ padding: '12px' }}>Thesis</th>
                <th style={{ padding: '12px' }}>Guide</th>
                <th style={{ padding: '12px' }}>Grade</th>
                <th style={{ padding: '12px' }}>Credentials</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-muted))' }}>
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(s => {
                  const studentThesis = s.Thesis?.[0];
                  const hasCert = s.AcademicCertificate?.length > 0;
                  const finalMarks = s.EvaluationMarks?.[0]?.final_marks;

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid hsla(0,0%,100%,0.02)', color: '#fff' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{s.username}</td>
                      <td style={{ padding: '12px', color: 'hsl(var(--text-muted))', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {studentThesis ? studentThesis.title : 'Not Started'}
                      </td>
                      <td style={{ padding: '12px', color: 'hsl(var(--text-muted))' }}>
                        {studentThesis?.Guide?.username || 'Unassigned'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700' }}>
                        {finalMarks !== undefined ? `${finalMarks}/50` : 'Pending'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          background: hasCert ? 'hsla(145, 75%, 45%, 0.15)' : 'hsla(0,0%,100%,0.05)',
                          color: hasCert ? 'hsl(var(--status-complete))' : 'hsl(var(--text-muted))'
                        }}>
                          {hasCert ? 'Issued' : 'Unissued'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleIssueCertificate(s.id)}
                          disabled={hasCert || finalMarks === undefined || finalMarks < 20 || issuingCert}
                          style={{
                            background: hasCert ? 'none' : 'hsl(var(--accent-purple))',
                            border: hasCert ? '1px solid hsl(var(--border-glass))' : 'none',
                            color: hasCert ? 'hsl(var(--text-muted))' : '#fff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: hasCert ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          {hasCert ? 'Certificate Ready' : 'Issue Certificate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default HodDashboard;
