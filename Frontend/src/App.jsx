import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
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
    let roleUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          const userRef = ref(db, `users/${currentUser.uid}`);
          roleUnsubscribe = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              const userRole = data.role || "informer";
              setRole(userRole);
              localStorage.setItem("role", userRole);
              localStorage.setItem("username", data.username || "User");
            } else {
              setRole("informer"); // Fallback if no DB record yet
              localStorage.setItem("role", "informer");
            }
            setLoading(false);
          });
        } else {
          setRole(null);
          localStorage.removeItem("role");
          localStorage.removeItem("username");
          localStorage.removeItem("userId");
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth state or role fetch error:", error);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (roleUnsubscribe) roleUnsubscribe();
    };
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
          element={user ? (role === "admin" ? <Admin /> : <Navigate to={homeRoute} />) : <Navigate to="/login" />}
        />

        {/* Informer Only */}
        <Route
          path="/dashboard"
          element={user ? (role === "informer" ? <Dashboard /> : <Navigate to={homeRoute} />) : <Navigate to="/login" />}
        />
        <Route
          path="/reports"
          element={user ? (role === "informer" ? <MyReports /> : <Navigate to={homeRoute} />) : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/map"
          element={user ? (role === "informer" ? <MapView /> : <Navigate to={homeRoute} />) : <Navigate to="/login" />}
        />

        {/* Officer Only */}
        <Route
          path="/officer"
          element={user ? (role === "officer" ? <OfficerPortal /> : <Navigate to={homeRoute} />) : <Navigate to="/login" />}
        />

        {/* Control Center Only */}
        <Route
          path="/control-center"
          element={user ? (role === "control_center" ? <ControlCenter /> : <Navigate to={homeRoute} />) : <Navigate to="/login" />}
        />
        
        {/* Analytics (Admin or Control Center) */}
        <Route
          path="/analytics"
          element={user ? ((role === "admin" || role === "control_center") ? <Analytics /> : <Navigate to={homeRoute} />) : <Navigate to="/login" />}
        />

        {/* Copilot and Replay (Admin, Informer, Control Center) */}
        <Route
          path="/copilot"
          element={user ? ((role === "admin" || role === "control_center" || role === "informer") ? <CopilotPortal /> : <Navigate to={homeRoute} />) : <Navigate to="/login" />}
        />
        <Route
          path="/incident-replay"
          element={user ? ((role === "admin" || role === "control_center" || role === "informer") ? <IncidentReplay /> : <Navigate to={homeRoute} />) : <Navigate to="/login" />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;