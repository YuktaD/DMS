import PropTypes from "prop-types";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/doctorSlice";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function Sidenav({ brandImg, brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const reduxDispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await reduxDispatch(logout()); } catch (e) { console.error(e); }
  };

  const dashboardRoutes = routes.filter(r => r.layout === "dashboard");

  const navIcons = {
    dashboard: "📊",
    profile: "👤",
    "Add Documents": "📤",
    notifications: "🔔",
    "sign in": "🔐",
    "sign up": "✍️",
  };

  return (
    <aside style={{
      position: "fixed", inset: 0, zIndex: 50,
      marginTop: 16, marginLeft: 16, marginBottom: 16,
      height: "calc(100vh - 32px)", width: 264,
      borderRadius: 18,
      background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)",
      border: "1px solid rgba(99,102,241,0.2)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      transform: openSidenav ? "translateX(0)" : "translateX(-320px)",
      transition: "transform 0.3s ease",
      display: "flex", flexDirection: "column",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}
      className="xl:translate-x-0"
    >
      {/* Brand */}
      <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 14px rgba(99,102,241,0.5)", flexShrink: 0 }}>📄</div>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.3px", lineHeight: 1 }}>{brandName}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", letterSpacing: "0.1em", marginTop: 2 }}>ADMIN PANEL</div>
          </div>
        </Link>
        {/* Mobile close button */}
        <button onClick={() => setOpenSidenav(dispatch, false)}
          style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}
          className="xl:hidden">
          <XMarkIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        {dashboardRoutes.map(({ layout, title, pages }) => (
          <div key={layout}>
            {title && (
              <div style={{ padding: "8px 12px 6px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{title}</div>
            )}
            {pages.filter(p => !["sign in", "sign up"].includes(p.name)).map(({ icon, name, path }) => (
              <NavLink key={name} to={`/${layout}${path}`}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", marginBottom: 4, borderRadius: 12,
                  textDecoration: "none", transition: "all 0.2s",
                  background: isActive ? "rgba(99,102,241,0.2)" : "transparent",
                  border: isActive ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
                })}>
                {({ isActive }) => (
                  <>
                    <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{navIcons[name] || "📄"}</span>
                    <span style={{ color: isActive ? "#a5b4fc" : "rgba(255,255,255,0.65)", fontWeight: isActive ? 700 : 500, fontSize: "0.88rem", textTransform: "capitalize" }}>{name}</span>
                    {isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#818cf8" }} />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom — Logout */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>
          <span style={{ fontSize: 18 }}>🚪</span>
          <span style={{ color: "#fca5a5", fontWeight: 600, fontSize: "0.88rem" }}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};
Sidenav.defaultProps = { brandName: "DMS Admin", brandImg: "" };

export default Sidenav;
