import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const NotificationBell = ({ token }) => {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const fetchNotifs = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/users/notifications", {
        headers: { Authorization: "Bearer " + token }, withCredentials: true
      });
      if (data.success) setNotifs(data.notifications);
    } catch (e) {}
  };

  useEffect(() => {
    if (token) { fetchNotifs(); const t = setInterval(fetchNotifs, 15000); return () => clearInterval(t); }
  }, [token]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async () => {
    try {
      await axios.patch("http://localhost:5000/api/users/notifications/read", {}, {
        headers: { Authorization: "Bearer " + token }, withCredentials: true
      });
      setNotifs(n => n.map(x => ({ ...x, isRead: true })));
    } catch (e) {}
  };

  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => { setOpen(p => !p); if (!open && unread > 0) markRead(); }}
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: "white", position: "relative", fontSize: 18, lineHeight: 1 }}>
        🔔
        {unread > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", width: 320, background: "white", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", border: "1px solid #e2e8f0", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>Notifications</span>
            {unread > 0 && <span style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 600, cursor: "pointer" }} onClick={markRead}>Mark all read</span>}
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {notifs.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "0.88rem" }}>No notifications yet</div>
            ) : notifs.map((n, i) => (
              <div key={i} style={{ padding: "12px 18px", borderBottom: "1px solid #f8fafc", background: n.isRead ? "white" : "#f0f4ff", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: n.isRead ? 400 : 600, lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 3 }}>
                    {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
