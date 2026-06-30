import React, { useState, useEffect } from "react";
import UserAuth from "./UserAuth";
import UserDocuments from "./UserDocuments";
import NotificationBell from "./NotificationBell";
import PayPalCheckout from "./paypalCheckout";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const HomePage = () => {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("userData")); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("userToken") || null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") !== "false");
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [openPurchase, setOpenPurchase] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { localStorage.setItem("darkMode", darkMode); }, [darkMode]);
  useEffect(() => {
    const close = (e) => { if (!e.target.closest("#user-menu")) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleAuthSuccess = (userData, userToken) => { setUser(userData); setToken(userToken); };
  const handleLogout = () => { localStorage.removeItem("userToken"); localStorage.removeItem("userData"); setUser(null); setToken(null); };
  const handleViewPdf = (url) => { setSelectedPdf(url); setIsPurchased(false); setNumPages(null); setLoadError(null); };

  // Dark theme colors
  const bg = darkMode ? "#080d1a" : "#f8fafc";
  const cardBg = darkMode ? "rgba(255,255,255,0.04)" : "white";
  const cardBorder = darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const textMain = darkMode ? "#f1f5f9" : "#0f172a";
  const textSub = darkMode ? "rgba(255,255,255,0.45)" : "#64748b";
  const inputBg = darkMode ? "rgba(255,255,255,0.05)" : "#f8fafc";

  if (!user) return <UserAuth onAuthSuccess={handleAuthSuccess} />;

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "'Inter', -apple-system, sans-serif", transition: "background 0.3s" }}>

      {/* Navbar */}
      <nav style={{ background: darkMode ? "rgba(8,13,26,0.95)" : "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)", borderBottom: `1px solid ${darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.2)"}`, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 66, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 4px 14px rgba(99,102,241,0.5)" }}>📄</div>
            <div>
              <div style={{ color: "white", fontWeight: 800, fontSize: "1rem", lineHeight: 1, letterSpacing: "-0.3px" }}>Advanced Digital Archive System</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>DMS PORTAL</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <NotificationBell token={token} />
            {/* Dark Mode */}
            <button onClick={() => setDarkMode(p => !p)}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 11px", cursor: "pointer", color: "white", fontSize: 15, transition: "all 0.2s" }}
              title={darkMode ? "Light Mode" : "Dark Mode"}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            {/* User menu */}
            <div id="user-menu" style={{ position: "relative" }}>
              <button onClick={() => setMenuOpen(p => !p)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "7px 13px", cursor: "pointer", color: "white", transition: "all 0.2s" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0 }}>
                  {user.userName?.charAt(0)?.toUpperCase()}
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{user.userName?.split(" ")[0]}</span>
                <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
              </button>
              {menuOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: darkMode ? "#0f1629" : "white", border: `1px solid ${cardBorder}`, borderRadius: 14, minWidth: 200, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden", zIndex: 200 }}>
                  <div style={{ padding: "14px 18px", borderBottom: `1px solid ${cardBorder}` }}>
                    <div style={{ fontWeight: 700, color: textMain, fontSize: "0.9rem" }}>{user.userName}</div>
                    <div style={{ color: textSub, fontSize: "0.78rem", marginTop: 2 }}>{user.userEmail}</div>
                  </div>
                  <button onClick={handleLogout}
                    style={{ width: "100%", padding: "12px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "#ef4444", fontWeight: 600, fontSize: "0.88rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: darkMode ? "linear-gradient(160deg, #080d1a 0%, #0d1f3c 50%, #080d1a 100%)" : "linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)", padding: "64px 24px 72px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {[[500,500,"rgba(99,102,241,0.12)",-100,"10%"],[300,300,"rgba(16,185,129,0.07)",-20,-60]].map(([w,h,bg,t,l],i)=>(
          <div key={i} style={{position:"absolute",width:w,height:h,borderRadius:"50%",background:bg,filter:"blur(80px)",top:t,left:l}}/>
        ))}
        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-block", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 99, padding: "6px 18px", color: "#a5b4fc", fontSize: "0.82rem", fontWeight: 600, marginBottom: 20 }}>
            👋 Welcome back, {user.userName?.split(" ")[0]}!
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, color: "white", margin: "0 0 14px", letterSpacing: "-1.5px", lineHeight: 1.1 }}>
            Your Documents,{" "}
            <span style={{ background: "linear-gradient(90deg, #818cf8, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Always Ready</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", lineHeight: 1.75, margin: 0 }}>
            Browse, search, bookmark and download your documents with ease.
          </p>
        </div>
      </div>

      {/* Wave */}
      <div style={{ background: darkMode ? "#0d1f3c" : "#0f172a", lineHeight: 0 }}>
        <svg viewBox="0 0 1440 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
          <path d="M0 50L1440 50L1440 0C1200 40 960 50 720 30C480 10 240 0 0 20L0 50Z" fill={bg} />
        </svg>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 60px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6366f1", letterSpacing: "0.12em", marginBottom: 6 }}>SHARED BY ADMIN</div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: textMain, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Document Library</h2>
          <p style={{ color: textSub, margin: 0, fontSize: "0.88rem" }}>Search, filter, bookmark and download — everything in one place</p>
        </div>
        <UserDocuments onViewPdf={handleViewPdf} token={token} darkMode={darkMode} />
      </div>

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" }} onClick={() => setSelectedPdf(null)}>
          <div style={{ background: darkMode ? "#0f1629" : "white", borderRadius: 20, width: "100%", maxWidth: 860, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", border: `1px solid ${cardBorder}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 24px", background: "linear-gradient(135deg, #080d1a, #1e3a5f)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "white", fontWeight: 700 }}>📄 Document Preview</span>
              <button onClick={() => setSelectedPdf(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", background: darkMode ? "#0a0f1e" : "#f1f5f9" }}>
              {loadError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: 16, margin: 16, borderRadius: 10 }}>{loadError}</div>}
              <Document file={selectedPdf} onLoadSuccess={({ numPages }) => { setNumPages(numPages); setLoadError(null); }} onLoadError={() => setLoadError("Failed to load PDF.")}
                loading={<div style={{ textAlign: "center", padding: 40 }}><div style={{ width: 32, height: 32, border: "3px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} /><p style={{ color: "#64748b" }}>Loading...</p></div>}>
                {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                  pageNum <= 2 || isPurchased ? (
                    <div key={pageNum} style={{ margin: "16px auto", width: "fit-content", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                      <Page pageNumber={pageNum} width={Math.min(780, window.innerWidth - 80)} renderTextLayer={false} renderAnnotationLayer={false} />
                    </div>
                  ) : (
                    <div key={pageNum} style={{ margin: "16px auto", width: Math.min(780, window.innerWidth - 80), height: 560, background: darkMode ? "rgba(255,255,255,0.03)" : "#f1f5f9", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${cardBorder}` }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
                        <h3 style={{ color: textMain, margin: "0 0 8px", fontWeight: 800 }}>Page {pageNum} — Locked</h3>
                        <p style={{ color: textSub, marginBottom: 20, fontSize: "0.9rem" }}>Purchase to unlock full access.</p>
                        <button onClick={() => setOpenPurchase(true)} style={{ padding: "12px 28px", border: "none", borderRadius: 99, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", color: "white", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(99,102,241,0.45)", fontFamily: "inherit" }}>
                          Purchase — $9.99
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </Document>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Dialog */}
      {openPurchase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: darkMode ? "#0f1629" : "white", border: `1px solid ${cardBorder}`, borderRadius: 20, padding: 32, width: "100%", maxWidth: 420, boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
            <h3 style={{ color: textMain, margin: "0 0 8px", fontWeight: 800, fontSize: "1.2rem" }}>🔓 Unlock Full Document</h3>
            <p style={{ color: textSub, marginBottom: 24, fontSize: "0.9rem" }}>Get full lifetime access for <strong style={{ color: textMain }}>$9.99</strong></p>
            <PayPalScriptProvider options={{ "client-id": "AUffiNEi9gFyeaFJQoMDdXGGgbpyoFTv7Exca7HQ6aFZY8fB24983G2ZhcdXz6bdqpbKnybBdtEuy4Mx", currency: "USD" }}>
              <PayPalCheckout amount="9.99" onSuccess={() => { setIsPurchased(true); setOpenPurchase(false); }} />
            </PayPalScriptProvider>
            <button onClick={() => setOpenPurchase(false)} style={{ width: "100%", padding: "10px", marginTop: 12, background: "none", border: `1px solid ${cardBorder}`, borderRadius: 10, color: textSub, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: darkMode ? "#080d1a" : "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)", borderTop: "1px solid rgba(99,102,241,0.12)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📄</div>
            <span style={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}>Advanced Digital Archive System</span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>© {new Date().getFullYear()} Advanced Digital Archive System</p>
        </div>
      </footer>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default HomePage;
