import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, FileText, Clock, Upload, Eye, History, Trash2, X, Maximize2, Minimize2, TrendingUp, Users, FolderOpen, Plus } from 'lucide-react';
import { getAllDocuments } from '../../store/slices/documentSlice';
import { getDocumentVersions, createNewVersion, updateDocument, clearErrors, clearMessage } from '../../store/slices/documentVersoningAndReplace';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div style={{ background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 180 }}>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={24} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 3, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
);

export function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { documents, loading } = useSelector((state) => state.document);
  const { loading: versionLoading, error: versionError, message: versionMessage, documentVersions } = useSelector((state) => state.documentVersioning);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('title');
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [versionsModalOpen, setVersionsModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [fullView, setFullView] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);
  const [stats, setStats] = useState({ totalDocs: 0, totalUsers: 0, categories: [] });

  useEffect(() => {
    dispatch(getAllDocuments());
    fetchStats();
  }, [dispatch]);

  useEffect(() => {
    if (versionError) { toast.error(versionError); dispatch(clearErrors()); }
    if (versionMessage) { toast.success(versionMessage); dispatch(clearMessage()); }
  }, [versionError, versionMessage, dispatch]);

  const fetchStats = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('AdminAuthorization='))?.split('=')?.[1] || '';
      const { data } = await axios.get(`${API}/documents/stats`, { withCredentials: true });
      if (data.success) setStats(data.stats);
    } catch {}
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const { data } = await axios.delete(`${API}/documents/delete/${id}`, { withCredentials: true });
      if (data.success) {
        toast.success('Document deleted successfully');
        dispatch(getAllDocuments());
        fetchStats();
      } else toast.error(data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const val = searchQuery.toLowerCase();
    if (searchField === 'title') return doc.title?.toLowerCase().includes(val);
    if (searchField === 'description') return doc.description?.toLowerCase().includes(val);
    if (searchField === 'fileName') return doc.fileName?.toLowerCase().includes(val);
    return true;
  });

  const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);
  const paginatedDocs = filteredDocuments.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleViewVersions = async (doc) => {
    setSelectedDocument(doc);
    await dispatch(getDocumentVersions(doc._id));
    setVersionsModalOpen(true);
  };

  const handleEdit = (doc) => {
    setSelectedDocument(doc);
    setEditForm({ title: doc.title, description: doc.description });
    setEditModalOpen(true);
  };

  const handleUpdateDocument = async () => {
    if (!editForm.title.trim() || !editForm.description.trim()) { toast.error('Title and description are required'); return; }
    const fd = new FormData();
    if (file) fd.append('document', file);
    fd.append('title', editForm.title);
    fd.append('description', editForm.description);
    const res = await dispatch(updateDocument(selectedDocument._id, fd));
    if (res) { toast.success('Document updated!'); setEditModalOpen(false); setFile(null); dispatch(getAllDocuments()); }
  };

  const handleCreateVersion = async () => {
    if (!file) { toast.error('Please select a file'); return; }
    const fd = new FormData();
    fd.append('document', file);
    fd.append('title', editForm.title);
    fd.append('description', editForm.description);
    const res = await dispatch(createNewVersion(selectedDocument._id, fd));
    if (res) { toast.success('New version created!'); setEditModalOpen(false); setFile(null); }
  };

  const s = {
    page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif" },
    topbar: { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50 },
    modal: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' },
    modalBox: { background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 30px 80px rgba(0,0,0,0.3)', overflow: 'hidden' },
    input: { width: '100%', boxSizing: 'border-box', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', color: '#0f172a', background: '#f8fafc', outline: 'none', fontFamily: 'inherit', marginBottom: 14 },
    btn: (bg, color = 'white') => ({ padding: '10px 20px', border: 'none', borderRadius: 10, background: bg, color, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }),
  };

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📄</div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.3px' }}>Document Dashboard</span>
        </div>
        <div style={{ flex: 1 }} />
        {/* Search */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={searchField} onChange={e => { setSearchField(e.target.value); setSearchQuery(''); setPage(1); }}
            style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.85rem', color: '#374151', background: 'white', cursor: 'pointer', outline: 'none' }}>
            <option value="title">Title</option>
            <option value="description">Description</option>
            <option value="fileName">File Name</option>
          </select>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder={`Search by ${searchField}...`}
              style={{ padding: '9px 14px 9px 34px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.85rem', color: '#0f172a', outline: 'none', width: 220, fontFamily: 'inherit' }} />
          </div>
          <button onClick={() => navigate('/dashboard/upload')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
            <Plus size={16} /> Upload Doc
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 28px 40px' }}>
        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatCard icon={FileText} label="Total Documents" value={stats.totalDocs || documents.length} color="#6366f1" sub="All uploaded files" />
          <StatCard icon={Users} label="Registered Users" value={stats.totalUsers || 0} color="#10b981" sub="Active users" />
          <StatCard icon={FolderOpen} label="Categories" value={stats.categories?.length || 1} color="#f59e0b" sub="Document types" />
          <StatCard icon={TrendingUp} label="Recent Uploads" value={documents.slice(0, 5).length} color="#3b82f6" sub="Last 5 docs" />
        </div>

        {/* Table Card */}
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid #e2e8f0', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>All Documents</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>{filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['all', 'All'], ['recent', 'Recent']].map(([k, l]) => (
                <button key={k} style={{ padding: '6px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, background: 'white', color: '#64748b', cursor: 'pointer' }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, #0f172a, #1e3a5f)' }}>
                  {['#', 'Title', 'Description', 'File Name', 'Uploaded', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '13px 18px', textAlign: 'left', color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <div style={{ width: 32, height: 32, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    Loading documents...
                  </td></tr>
                ) : paginatedDocs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                    <div style={{ fontWeight: 700, color: '#475569' }}>No documents found</div>
                  </td></tr>
                ) : paginatedDocs.map((doc, i) => (
                  <tr key={doc._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>{(page - 1) * rowsPerPage + i + 1}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📄</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.83rem', maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.description}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>{doc.fileName}</span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      📅 {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[
                          { icon: <Eye size={15} />, title: 'View', bg: '#eff6ff', color: '#3b82f6', onClick: () => { setViewingDocument(doc); setViewerOpen(true); } },
                          { icon: <History size={15} />, title: 'Versions', bg: '#f0fdf4', color: '#10b981', onClick: () => handleViewVersions(doc) },
                          { icon: <Trash2 size={15} />, title: 'Delete', bg: '#fef2f2', color: '#ef4444', onClick: () => setDeleteConfirmId(doc._id) },
                        ].map((btn, bi) => (
                          <button key={bi} title={btn.title} onClick={btn.onClick}
                            style={{ width: 32, height: 32, borderRadius: 8, background: btn.bg, border: 'none', color: btn.color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', gap: 6 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', background: page === p ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f1f5f9', color: page === p ? 'white' : '#64748b' }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      {viewerOpen && viewingDocument && (
        <div style={s.modal} onClick={() => { setViewerOpen(false); setFullView(false); }}>
          <div style={{ background: 'white', borderRadius: fullView ? 0 : 20, width: fullView ? '100vw' : '85vw', height: fullView ? '100vh' : '85vh', maxWidth: fullView ? 'none' : 1100, display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.4)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{viewingDocument.title}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setFullView(p => !p)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {fullView ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button onClick={() => { setViewerOpen(false); setFullView(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <iframe src={viewingDocument.pdfUrl?.url} title={viewingDocument.title} style={{ flex: 1, border: 'none', background: '#f5f5f5' }} />
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div style={s.modal}>
          <div style={{ ...s.modalBox, maxWidth: 380 }}>
            <div style={{ padding: '28px 28px 24px', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🗑️</div>
              <h3 style={{ color: '#0f172a', margin: '0 0 8px', fontWeight: 800, fontSize: '1.1rem' }}>Delete Document?</h3>
              <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: '0.9rem' }}>This action cannot be undone. The document will be permanently removed.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteConfirmId(null)} style={{ ...s.btn('#f1f5f9', '#374151'), flex: 1 }}>Cancel</button>
                <button onClick={() => handleDelete(deleteConfirmId)} disabled={deleting}
                  style={{ ...s.btn(deleting ? '#fca5a5' : 'linear-gradient(135deg, #ef4444, #dc2626)'), flex: 1 }}>
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div style={s.modal}>
          <div style={s.modalBox}>
            <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontWeight: 700 }}>✏️ Edit Document</span>
              <button onClick={() => { setEditModalOpen(false); setFile(null); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Title</label>
              <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} style={s.input} />
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ ...s.input, resize: 'vertical', height: 80 }} />
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Replace PDF (optional)</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={{ marginBottom: 20 }} />
              {file && <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: 16, fontWeight: 600 }}>✅ {file.name}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setEditModalOpen(false); setFile(null); }} style={{ ...s.btn('#f1f5f9', '#374151'), flex: 1 }}>Cancel</button>
                <button onClick={handleCreateVersion} style={{ ...s.btn('#f0fdf4', '#10b981'), flex: 1, border: '1.5px solid #86efac' }}>+ New Version</button>
                <button onClick={handleUpdateDocument} style={{ ...s.btn('linear-gradient(135deg, #6366f1, #8b5cf6)'), flex: 1 }}>Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Versions Modal */}
      {versionsModalOpen && (
        <div style={s.modal}>
          <div style={{ ...s.modalBox, maxWidth: 600 }}>
            <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontWeight: 700 }}>🕐 Document Versions — {selectedDocument?.title}</span>
              <button onClick={() => setVersionsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              {versionLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Loading versions...</div>
              ) : documentVersions?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No versions found</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {documentVersions?.map((v, i) => (
                    <div key={v._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Version {documentVersions.length - i}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>{format(new Date(v.createdAt), 'MMM dd, yyyy HH:mm')}</div>
                      </div>
                      <button onClick={() => { setViewingDocument(v); setVersionsModalOpen(false); setViewerOpen(true); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', borderRadius: 8, background: '#eff6ff', color: '#3b82f6', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                        <Eye size={14} /> View
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setVersionsModalOpen(false)} style={{ ...s.btn('#f1f5f9', '#374151'), width: '100%', marginTop: 16 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Home;
