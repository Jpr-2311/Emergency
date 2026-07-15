import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "./firebase";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import MyReports from "./pages/MyReports";
import Profile from "./pages/Profile";
import MapView from "./pages/MapView";
import Admin from "./pages/Admin";
import OfficerPortal from "./pages/OfficerPortal";
import ControlCenter from "./pages/ControlCenter";
import Analytics from "./pages/Analytics";
import CopilotPortal from "./pages/CopilotPortal";
import IncidentReplay from "./pages/IncidentReplay";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const snapshot = await get(ref(db, `users/${currentUser.uid}/role`));
        setRole(snapshot.exists() ? snapshot.val() : "informer");
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading || (user && role === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Redirect based on role after login
  let homeRoute = "/dashboard";
  if (role === "admin") homeRoute = "/admin";
  else if (role === "officer") homeRoute = "/officer";
  else if (role === "control_center") homeRoute = "/control-center";

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to={homeRoute} /> : <Login />} />
        <Route path="/login" element={user ? <Navigate to={homeRoute} /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={homeRoute} /> : <SignUp />} />

        {/* Admin Only */}
        <Route
          path="/admin"
          element={user && role === "admin" ? <Admin /> : <Navigate to="/login" />}
        />

        {/* Informer Only */}
        <Route
          path="/dashboard"
          element={user && role !== "admin" ? <Dashboard /> : <Navigate to={homeRoute} />}
        />
        <Route
          path="/reports"
          element={user && role !== "admin" ? <MyReports /> : <Navigate to={homeRoute} />}
        />
        <Route
          path="/profile"
          element={user && role !== "admin" ? <Profile /> : <Navigate to={homeRoute} />}
        />
        <Route
          path="/map"
          element={user && role !== "admin" ? <MapView /> : <Navigate to={homeRoute} />}
        />

        {/* Officer Only */}
        <Route
          path="/officer"
          element={user && role === "officer" ? <OfficerPortal /> : <Navigate to={homeRoute} />}
        />

        {/* Control Center Only */}
        <Route
          path="/control-center"
          element={user && role === "control_center" ? <ControlCenter /> : <Navigate to={homeRoute} />}
        />
        
        {/* Analytics (Admin or Control Center) */}
        <Route
          path="/analytics"
          element={user && (role === "admin" || role === "control_center") ? <Analytics /> : <Navigate to={homeRoute} />}
        />

        {/* Copilot and Replay (Admin Only for Demo) */}
        <Route
          path="/copilot"
          element={user && role === "admin" ? <CopilotPortal /> : <Navigate to={homeRoute} />}
        />
        <Route
          path="/incident-replay"
          element={user && role === "admin" ? <IncidentReplay /> : <Navigate to={homeRoute} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;