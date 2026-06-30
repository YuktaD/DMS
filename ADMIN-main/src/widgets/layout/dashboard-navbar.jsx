import { useLocation, useNavigate } from "react-router-dom";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";

export function DashboardNavbar() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { fixedNavbar } = controller;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { adminInfo } = useSelector(s => s.doctor || {});

  const segments = pathname.split("/").filter(Boolean);
  const page = segments[segments.length - 1] || "dashboard";

  const pageLabels = {
    home: "Dashboard Overview",
    profile: "Admin Profile",
    upload: "Upload Document",
    notifications: "Notifications",
  };

  return (
    <nav style={{
      position: fixedNavbar ? "sticky" : "static", top: 0, zIndex: 40,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #e2e8f0",
      padding: "0 24px", height: 60,
      display: "flex", alignItems: "center", gap: 16,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Mobile menu toggle */}
      <button onClick={() => setOpenSidenav(dispatch, true)}
        style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", color: "#374151" }}
        className="xl:hidden">
        <Bars3Icon style={{ width: 20, height: 20 }} />
      </button>

      {/* Breadcrumb */}
      <div>
        <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Admin / {page}
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
          {pageLabels[page] || page.charAt(0).toUpperCase() + page.slice(1)}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
          📅 {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
        {adminInfo?.adminName && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "6px 14px" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "0.8rem" }}>
              {adminInfo.adminName?.charAt(0)?.toUpperCase()}
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{adminInfo.adminName}</span>
          </div>
        )}
      </div>
    </nav>
  );
}

export default DashboardNavbar;
