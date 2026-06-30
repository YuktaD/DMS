import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";
import { useDispatch, useSelector } from "react-redux";
import { getdoctor } from "./store/slices/doctorSlice";
import { useEffect } from "react";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.doctor);
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return children;
};

// Public Route Component (for authentication pages)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.doctor);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return children;
};

function App() {

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getdoctor());
  }, []);


  return (
    <Routes>
      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Public Auth Routes */}
      <Route
        path="/auth/*"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />

      {/* Default Route */}
      <Route
        path="*"
        element={
          <Navigate to="/auth/sign-in" replace />
        }
      />
      
    </Routes>
    
  );
}

export default App;