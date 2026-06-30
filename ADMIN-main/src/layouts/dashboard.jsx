import { Routes, Route } from "react-router-dom";
import { Sidenav, DashboardNavbar } from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController } from "@/context";

export function Dashboard() {
  const [controller] = useMaterialTailwindController();
  const { sidenavType } = controller;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Sidenav routes={routes} brandImg={sidenavType === "dark" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"} />
      <div className="p-4 xl:ml-80">
        <DashboardNavbar />
        <Routes>
          {routes.map(({ layout, pages }) =>
            layout === "dashboard" &&
            pages.map(({ path, element }) => (
              <Route exact path={path} element={element} key={path} />
            ))
          )}
        </Routes>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layouts/dashboard.jsx";
export default Dashboard;
