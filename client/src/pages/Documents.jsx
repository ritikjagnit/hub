import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Folder, File, Upload, Plus, FolderPlus, History, Eye, Download, X } from 'lucide-react';

const Documents = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState(['General', 'Designs', 'Requirements', 'Invoices', 'Contracts']);
  const [activeFolder, setActiveFolder] = useState('General');
  const [newFolderName, setNewFolderName] = useState('');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFolder, setUploadFolder] = useState('General');

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  useEffect(() => {
    if (selectedProject) {
      fetchDocuments(selectedProject);
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
        if (data.length > 0) setSelectedProject(data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDocuments = async (projId) => {
    try {
      const res = await fetch(`/api/projects/${projId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setFolders(prev => [...prev, newFolderName.trim()]);
    setActiveFolder(newFolderName.trim());
    setNewFolderName('');
    setIsFolderModalOpen(false);
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedProject) return alert('Select file and project first');

    const formData = new FormData();
    formData.append('document', uploadFile);
    formData.append('folder_name', uploadFolder);

    try {
      const res = await fetch(`/api/projects/${selectedProject}/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        fetchDocuments(selectedProject);
      } else {
        alert('File upload failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDocs = documents.filter(doc => (doc.folder_name || 'General') === activeFolder);

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Document Management</h1>
          <p className="page-subtitle">Securely host assets, compile folders, preview file contents, and track version histories.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{ padding: '10px 16px', background: 'hsl(222, 22%, 13%)', border: '1px solid hsl(var(--border-glass))', color: '#fff', borderRadius: '8px' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => setIsUploadModalOpen(true)} className="btn btn-primary" style={{ color: '#000' }}>
            <Upload size={16} /> Upload Document
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
        {/* Sidebar Folder list */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', fontWeight: '800' }}>Folders</span>
            <button onClick={() => setIsFolderModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--accent-cyan))' }} title="Create Folder">
              <FolderPlus size={16} />
            </button>
          </div>
          {folders.map(f => (
            <button 
              key={f}
              onClick={() => setActiveFolder(f)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeFolder === f ? 'hsla(190, 90%, 55%, 0.1)' : 'transparent',
                color: activeFolder === f ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.85rem',
                fontWeight: activeFolder === f ? '700' : '400',
                transition: 'all 0.2s'
              }}
            >
              <Folder size={16} />
              <span>{f}</span>
            </button>
          ))}
        </div>

        {/* Documents Grid */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>Folder: {activeFolder}</h3>
          
          {filteredDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'hsl(var(--text-muted))' }}>
              <File size={40} style={{ color: 'hsl(var(--accent-cyan))', marginBottom: '12px' }} />
              <p>No documents stored in this folder yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {filteredDocs.map(doc => (
                <div 
                  key={doc.id}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'center',
                    background: 'hsla(220, 20%, 15%, 0.4)',
                    border: '1px solid hsl(var(--border-glass))',
                    borderRadius: '12px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'hsla(190, 90%, 55%, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--accent-cyan))' }}>
                    <File size={24} />
                  </div>
                  <div style={{ flex: 1, width: '100%' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }} title={doc.file_name}>
                      {doc.file_name}
                    </h4>
                    <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                      Uploaded by: {doc.uploader_name || 'Member'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '6px' }}>
                    <a 
                      href={doc.file_path} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}
                    >
                      <Eye size={12} /> Preview
                    </a>
                    <a 
                      href={doc.file_path} 
                      download 
                      className="btn btn-secondary" 
                      style={{ padding: '6px', fontSize: '0.75rem' }}
                    >
                      <Download size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE FOLDER MODAL */}
      {isFolderModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Create Folder</h3>
              <button onClick={() => setIsFolderModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateFolder}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Folder Name</label>
                <input type="text" placeholder="e.g. Layout Specifications" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>
                Add Folder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Upload Document</h3>
              <button onClick={() => setIsUploadModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUploadFile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Choose File</label>
                <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} required />
              </div>
              <div className="form-group">
                <label className="form-label">Target Folder</label>
                <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)}>
                  {folders.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000' }}>
                Upload & Register
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
