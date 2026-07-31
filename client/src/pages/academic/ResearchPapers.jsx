import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Bookmark, BookmarkCheck, FileText, Upload, PlusCircle, Check, X, ExternalLink, Library } from 'lucide-react';

const ResearchPapers = () => {
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState('approved'); // 'approved', 'my_uploads', 'bookmarks', 'pending_reviews'
  const [papers, setPapers] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Upload modal fields
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [journal, setJournal] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [abstract, setAbstract] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isReviewer = ['admin', 'guide', 'hod'].includes(user?.role);

  useEffect(() => {
    if (token) {
      fetchPapersData();
    }
  }, [token, activeTab]);

  const fetchPapersData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch matching tab data
      let url = '/api/academic/research/approved';
      if (activeTab === 'my_uploads') url = '/api/academic/research/my';
      else if (activeTab === 'bookmarks') url = '/api/academic/research/bookmarks';
      else if (activeTab === 'pending_reviews') url = '/api/academic/research/pending';

      const res = await fetch(url, { headers });
      if (res.ok) {
        setPapers(await res.json());
      }

      // Sync bookmarks ids list
      const resB = await fetch('/api/academic/research/bookmarks', { headers });
      if (resB.ok) {
        const list = await resB.json();
        setBookmarks(new Set(list.map(p => p.id)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (paperId) => {
    try {
      const res = await fetch('/api/academic/research/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paper_id: paperId })
      });

      if (res.ok) {
        const next = new Set(bookmarks);
        if (next.has(paperId)) next.delete(paperId);
        else next.add(paperId);
        setBookmarks(next);
        
        if (activeTab === 'bookmarks') {
          fetchPapersData(); // Reload list if currently viewing bookmarks tab
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!title || !authors || !pdfFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('authors', authors);
      formData.append('journal', journal);
      formData.append('year', year);
      formData.append('abstract', abstract);
      formData.append('file', pdfFile);

      const res = await fetch('/api/academic/research/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setTitle('');
        setAuthors('');
        setJournal('');
        setYear(new Date().getFullYear());
        setAbstract('');
        setPdfFile(null);
        setShowUploadModal(false);
        fetchPapersData();
        alert('Research paper uploaded successfully! It is now pending advisor verification.');
      } else {
        alert('Failed to upload research paper.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleReviewAction = async (paperId, status) => {
    if (!window.confirm(`Are you sure you want to mark this paper as ${status}?`)) return;

    try {
      const res = await fetch('/api/academic/research/review', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: paperId, status })
      });

      if (res.ok) {
        fetchPapersData();
      } else {
        alert('Review update action failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPapers = papers.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.abstract?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '45px', height: '45px', borderRadius: '12px',
            background: 'hsla(190, 90%, 50%, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Library size={24} style={{ color: 'hsl(var(--accent-cyan))' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'Outfit', color: '#fff', margin: 0 }}>
              Research & Literature Library
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '3px' }}>
              Explore verified studies, archive primary references, and bookmark papers for literature drafts.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
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
          <Upload size={16} /> Add Publication
        </button>
      </div>

      {/* Tabs list & Search bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        
        {/* Navigation tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('approved')}
            className={`tab-btn ${activeTab === 'approved' ? 'active-tab' : ''}`}
            style={{
              background: activeTab === 'approved' ? 'hsl(var(--accent-cyan))' : 'hsla(0,0%,100%,0.03)',
              color: activeTab === 'approved' ? '#000' : '#fff',
              border: '1px solid hsl(var(--border-glass))',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.8rem'
            }}
          >
            Approved Library
          </button>
          <button
            onClick={() => setActiveTab('my_uploads')}
            style={{
              background: activeTab === 'my_uploads' ? 'hsl(var(--accent-cyan))' : 'hsla(0,0%,100%,0.03)',
              color: activeTab === 'my_uploads' ? '#000' : '#fff',
              border: '1px solid hsl(var(--border-glass))',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.8rem'
            }}
          >
            My Contributions
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            style={{
              background: activeTab === 'bookmarks' ? 'hsl(var(--accent-cyan))' : 'hsla(0,0%,100%,0.03)',
              color: activeTab === 'bookmarks' ? '#000' : '#fff',
              border: '1px solid hsl(var(--border-glass))',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.8rem'
            }}
          >
            Bookmarked
          </button>
          {isReviewer && (
            <button
              onClick={() => setActiveTab('pending_reviews')}
              style={{
                background: activeTab === 'pending_reviews' ? 'hsl(var(--accent-cyan))' : 'hsla(0,0%,100%,0.03)',
                color: activeTab === 'pending_reviews' ? '#000' : '#fff',
                border: '1px solid hsla(40, 90%, 55%, 0.3)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.8rem'
              }}
            >
              Pending Reviews
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: 'hsl(var(--text-muted))' }} />
          <input
            type="text"
            placeholder="Search papers/authors..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'hsla(0,0%,0%,0.2)',
              border: '1px solid hsl(var(--border-glass))',
              borderRadius: '8px',
              padding: '8px 10px 8px 30px',
              color: '#fff',
              fontSize: '0.8rem',
              width: '240px'
            }}
          />
        </div>
      </div>

      {/* Loading state / Cards Grid */}
      {loading ? (
        <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading publications...</div>
      ) : filteredPapers.length === 0 ? (
        <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '60px' }}>
          No papers found in this category.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredPapers.map(paper => (
            <div key={paper.id} className="glass-panel" style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid hsl(var(--border-glass))',
              textAlign: 'left'
            }}>
              <div>
                
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    color: 'hsl(var(--accent-cyan))',
                    background: 'hsla(190, 90%, 50%, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: '700'
                  }}>
                    {paper.year}
                  </span>
                  
                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleToggleBookmark(paper.id)}
                    style={{ background: 'none', border: 'none', color: bookmarks.has(paper.id) ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))', cursor: 'pointer' }}
                  >
                    {bookmarks.has(paper.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                </div>

                <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#fff', marginBottom: '6px', lineHeight: 1.3 }}>
                  {paper.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', fontWeight: '600', marginBottom: '8px' }}>
                  By: {paper.authors}
                </p>
                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic', marginBottom: '12px' }}>
                  Journal: {paper.journal || 'Academic Research Archive'}
                </div>
                <p style={{
                  fontSize: '0.76rem',
                  color: 'hsl(var(--text-muted))',
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}>
                  {paper.abstract}
                </p>
              </div>

              {/* Actions footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid hsla(0,0%,100%,0.04)'
              }}>
                <a
                  href={paper.file_path}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'hsl(var(--accent-cyan))',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  View Publication <ExternalLink size={12} />
                </a>

                {/* Supervisor Review Action */}
                {activeTab === 'pending_reviews' && isReviewer && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleReviewAction(paper.id, 'approved')}
                      style={{
                        background: 'hsla(145, 75%, 45%, 0.15)',
                        border: 'none',
                        color: 'hsl(var(--status-complete))',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: '700'
                      }}
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleReviewAction(paper.id, 'rejected')}
                      style={{
                        background: 'hsla(0, 80%, 60%, 0.15)',
                        border: 'none',
                        color: 'hsl(0, 80%, 60%)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: '700'
                      }}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD PUBLICATION MODAL */}
      {showUploadModal && (
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
            maxWidth: '520px',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', margin: 0 }}>Add Reference Publication</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Paper Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robust State Estimation in Distributed Power Grids"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{
                    background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                    color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Authors (Comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe, Sarah Conner"
                  value={authors}
                  onChange={e => setAuthors(e.target.value)}
                  style={{
                    background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                    color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Journal / Conference</label>
                  <input
                    type="text"
                    placeholder="e.g. IEEE Transactions"
                    value={journal}
                    onChange={e => setJournal(e.target.value)}
                    style={{
                      background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                      color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', width: '100%'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Publication Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    style={{
                      background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                      color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', width: '100%'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Abstract / Summary</label>
                <textarea
                  placeholder="Outline results, methodologies, and limitations described in the publication..."
                  value={abstract}
                  onChange={e => setAbstract(e.target.value)}
                  style={{
                    background: 'hsla(0,0%,0%,0.2)', border: '1px solid hsl(var(--border-glass))',
                    color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', minHeight: '70px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Attach PDF File *</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={e => setPdfFile(e.target.files[0])}
                  style={{ color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                style={{
                  background: 'hsl(var(--accent-purple))',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                {uploading ? 'Uploading publication...' : 'Add Publication'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResearchPapers;
