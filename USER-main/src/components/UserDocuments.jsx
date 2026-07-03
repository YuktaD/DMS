import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";
const CATEGORIES = ["All", "General", "Legal", "Finance", "HR", "Technical", "Other"];
const SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
];
const ACCENTS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#06b6d4"];

const UserDocuments = ({ onViewPdf, token, darkMode }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "bookmarks"

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams({ query: search, category, sortBy });
      const { data } = await axios.get(`${API}/documents/search?${params}`);
      if (data.success) setDocuments(data.documents);
    } catch {
      const { data } = await axios.get(`${API}/documents/getAll`);
      setDocuments(data.documents || []);
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy]);

  const fetchBookmarks = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API}/users/bookmarks`, {
        headers: { Authorization: "Bearer " + token }, withCredentials: true
      });
      if (data.success) setBookmarks(data.bookmarks.map(b => b._id || b));
    } catch {}
  }, [token]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);
  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const toggleBookmark = async (e, docId) => {
    e.stopPropagation();
    if (!token) { alert("Please login to bookmark documents"); return; }
    try {
      const { data } = await axios.post(`${API}/users/bookmark/${docId}`, {}, {
        headers: { Authorization: "Bearer " + token }, withCredentials: true
      });
      if (data.success) {
        setBookmarks(data.bookmarks.map(b => b._id || b));
      }
    } catch {}
  };

  const bg = darkMode ? "#1e293b" : "white";
  const border = darkMode ? "#334155" : "#e2e8f0";
  const textMain = darkMode ? "#f1f5f9" : "#0f172a";
  const textSub = darkMode ? "#94a3b8" : "#64748b";
  const inputBg = darkMode ? "rgba(255,255,255,0.05)" : "#f8fafc";
  const filterBg = darkMode ? "#0f172a" : "#f1f5f9";

  const visibleDocs = activeTab === "bookmarks"
    ? documents.filter(d => bookmarks.includes(d._id))
    : documents;

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
      <p style={{ color: textSub, fontSize: "0.9rem" }}>Loading documents...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      {/* Search + Filter Bar */}
      <div style={{ background: filterBg, borderRadius: 16, padding: "20px 20px 16px", marginBottom: 24, border: `1px solid ${border}` }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, description or tag..."
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 40px", border: `1.5px solid ${border}`, borderRadius: 12, fontSize: "0.9rem", color: textMain, background: bg, outline: "none", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Category Filter */}
          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{ padding: "9px 14px", border: `1.5px solid ${border}`, borderRadius: 10, fontSize: "0.85rem", color: textMain, background: bg, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: "9px 14px", border: `1.5px solid ${border}`, borderRadius: 10, fontSize: "0.85rem", color: textMain, background: bg, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {["all", "bookmarks"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "9px 16px", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit",
                  background: activeTab === tab ? "#6366f1" : "transparent", color: activeTab === tab ? "white" : textSub }}>
                {tab === "all" ? `📄 All (${documents.length})` : `❤️ Saved (${bookmarks.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Document Grid */}
      {visibleDocs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{activeTab === "bookmarks" ? "❤️" : "📭"}</div>
          <p style={{ color: textMain, fontWeight: 700, fontSize: "1.1rem" }}>{activeTab === "bookmarks" ? "No bookmarks yet" : "No documents found"}</p>
          <p style={{ color: textSub, fontSize: "0.88rem" }}>{activeTab === "bookmarks" ? "Tap ❤️ on any document to save it here" : "Try a different search or category"}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {visibleDocs.map((doc, idx) => {
            const accent = ACCENTS[idx % ACCENTS.length];
            const isBookmarked = bookmarks.includes(doc._id);
            return (
              <div key={doc._id} style={{ background: bg, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden", transition: "all 0.22s", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.12)`; e.currentTarget.style.borderColor = accent; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; e.currentTarget.style.borderColor = border; }}>
                {/* Top accent bar */}
                <div style={{ height: 4, background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📄</div>
                      <div>
                        <div style={{ fontWeight: 700, color: textMain, fontSize: "0.95rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: accent, background: `${accent}15`, padding: "2px 8px", borderRadius: 99 }}>{doc.category || "General"}</span>
                      </div>
                    </div>
                    <button onClick={(e) => toggleBookmark(e, doc._id)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4, transition: "transform 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                      {isBookmarked ? "❤️" : "🤍"}
                    </button>
                  </div>

                  <p style={{ color: textSub, fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {doc.description || "No description provided."}
                  </p>

                  {/* Tags */}
                  {doc.tags?.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                      {doc.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{ fontSize: "0.7rem", background: filterBg, color: textSub, padding: "2px 8px", borderRadius: 99, border: `1px solid ${border}` }}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: "0.75rem", color: textSub, marginBottom: 14 }}>
                    📅 {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => onViewPdf(doc.pdfUrl?.url, { fileName: doc.fileName || doc.title, version: doc.currentVersion })}
                      style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, background: `linear-gradient(90deg, ${accent}, ${accent}cc)`, color: "white", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 14px ${accent}40` }}>
                      👁️ Preview
                    </button>
                    <a href={doc.pdfUrl?.url} download target="_blank" rel="noreferrer"
                      style={{ padding: "10px 14px", borderRadius: 10, background: filterBg, border: `1.5px solid ${border}`, color: textMain, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center" }}>
                      ⬇️
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserDocuments;
