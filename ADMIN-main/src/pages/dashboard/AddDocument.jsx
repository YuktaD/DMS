import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadDocument, clearErrors, clearMessage, handleDuplicateDocument, clearDuplicatePrompt } from '../../store/slices/documentSlice2';

const CATEGORIES = ['General', 'Legal', 'Finance', 'HR', 'Technical', 'Other'];

export function AddDocument() {
  const dispatch = useDispatch();
  const { loading, error, message, duplicateDocument, showDuplicatePrompt } = useSelector(s => s.document2);
  const fileRef = useRef();

  const [formData, setFormData] = useState({ title: '', description: '', category: 'General', tags: '', pdfFile: null });
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearErrors()); setUploadProgress(0); }
    if (message) { toast.success(message); dispatch(clearMessage()); setUploadProgress(0); handleCancel(); }
  }, [error, message, dispatch]);

  useEffect(() => {
    if (loading) {
      const t = setInterval(() => setUploadProgress(p => p < 90 ? p + Math.random() * 15 : p), 300);
      return () => clearInterval(t);
    } else setUploadProgress(0);
  }, [loading]);

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.includes('pdf')) { toast.error('Please select a PDF file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File size must be less than 10MB'); return; }
    const nameNoExt = file.name.replace(/\.pdf$/i, '');
    setFileName(file.name);
    setFormData(p => ({ ...p, pdfFile: file, title: p.title || nameNoExt }));
  };

  const handleFileChange = e => processFile(e.target.files[0]);

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!formData.pdfFile) { toast.error('Please select a PDF file'); return; }
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('description', formData.description);
    fd.append('category', formData.category);
    fd.append('tags', formData.tags);
    fd.append('singleDocument', formData.pdfFile);
    dispatch(uploadDocument(fd));
  };

  const handleDuplicateAction = action => {
    if (!duplicateDocument || !formData.pdfFile) return;
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('description', formData.description);
    fd.append('category', formData.category);
    fd.append('singleDocument', formData.pdfFile);
    dispatch(handleDuplicateDocument(duplicateDocument.id, fd, action));
  };

  const handleCancel = () => {
    setFormData({ title: '', description: '', category: 'General', tags: '', pdfFile: null });
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const s = {
    page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif", padding: '32px 28px' },
    label: { display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.01em' },
    input: { width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.9rem', color: '#0f172a', background: '#f8fafc', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' },
  };

  return (
    <div style={s.page}>
      <ToastContainer position="top-right" />
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.12em', marginBottom: 6 }}>ADMIN PANEL</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Upload New Document</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Add a new PDF document to the library for users to access.</p>
        </div>

        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* Top gradient bar */}
          <div style={{ height: 5, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }} />

          <div style={{ padding: '32px 32px' }}>
            <form onSubmit={handleSubmit}>
              {/* Drop Zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragOver ? '#6366f1' : formData.pdfFile ? '#10b981' : '#cbd5e1'}`,
                  borderRadius: 16,
                  padding: '36px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? '#f0f4ff' : formData.pdfFile ? '#f0fdf4' : '#f8fafc',
                  transition: 'all 0.2s',
                  marginBottom: 24,
                }}>
                <input ref={fileRef} type="file" id="pdfFile" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                {formData.pdfFile ? (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>{fileName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>{(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    <button type="button" onClick={e => { e.stopPropagation(); setFormData(p => ({ ...p, pdfFile: null })); setFileName(''); if (fileRef.current) fileRef.current.value = ''; }}
                      style={{ marginTop: 12, padding: '6px 14px', border: '1.5px solid #fca5a5', borderRadius: 8, background: '#fef2f2', color: '#ef4444', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                      Remove File
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Upload size={26} color="#6366f1" />
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: 6 }}>
                      {dragOver ? 'Drop your PDF here!' : 'Drag & drop PDF here'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>or <span style={{ color: '#6366f1', fontWeight: 600 }}>browse files</span> · Max 10MB</div>
                  </>
                )}
              </div>

              {/* Title */}
              <div style={{ marginBottom: 18 }}>
                <label style={s.label}>Document Title *</label>
                <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Employee Handbook 2024" required
                  style={s.input} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 18 }}>
                <label style={s.label}>Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Brief description of the document content..." required rows={3}
                  style={{ ...s.input, resize: 'vertical', minHeight: 80 }} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              {/* Category + Tags Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={s.label}>Category</label>
                  <select name="category" value={formData.category} onChange={handleChange}
                    style={{ ...s.input, cursor: 'pointer' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Tags <span style={{ color: '#94a3b8', fontWeight: 400 }}>(comma separated)</span></label>
                  <input name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g. policy, hr, 2024"
                    style={s.input} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
              </div>

              {/* Upload Progress */}
              {loading && (
                <div style={{ marginBottom: 20, background: '#f0f4ff', borderRadius: 12, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4f46e5' }}>Uploading document...</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5' }}>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div style={{ height: 8, background: '#e0e7ff', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 99, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={handleCancel} disabled={loading}
                  style={{ flex: 1, padding: '13px', border: '1.5px solid #e2e8f0', borderRadius: 12, background: 'white', color: '#64748b', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  Clear Form
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 2, padding: '13px', border: 'none', borderRadius: 12, background: loading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.45)', fontFamily: 'inherit' }}>
                  {loading ? '⏳ Uploading...' : '🚀 Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Duplicate Dialog */}
      {showDuplicatePrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 30px 80px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontWeight: 700 }}>⚠️ Duplicate Document Found</span>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 16 }}>
                A document titled <strong style={{ color: '#0f172a' }}>"{duplicateDocument?.title}"</strong> already exists. How would you like to proceed?
              </p>
              <div style={{ background: '#fffbeb', borderRadius: 10, padding: '12px 14px', marginBottom: 20, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 600, marginBottom: 4 }}>Existing Document</div>
                <div style={{ fontSize: '0.82rem', color: '#78350f' }}>Uploaded: {duplicateDocument && new Date(duplicateDocument.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => handleDuplicateAction('replace')} style={{ padding: '12px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  🔄 Replace Existing Document
                </button>
                <button onClick={() => handleDuplicateAction('version')} style={{ padding: '12px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  📌 Save as New Version
                </button>
                <button onClick={() => dispatch(clearDuplicatePrompt())} style={{ padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddDocument;
