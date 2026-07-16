import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const role = localStorage.getItem("role") || "informer";

  return (
    <div className="w-64 bg-white shadow-lg p-6 hidden md:block">
      <h2 className="text-2xl font-extrabold text-blue-600 mb-1">
        CrisisIQ
      </h2>
      <p className="text-xs text-blue-500 font-medium mb-10 leading-tight">
        Smart Emergency Response & Infrastructure Intelligence
      </p>

      <nav className="space-y-4">

        {role === "informer" && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                }`
              }
            >
              📊 Citizen Dashboard
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                }`
              }
            >
              📄 My Reports
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                }`
              }
            >
              📍 Incident Map
            </NavLink>
            <NavLink
              to="/copilot"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100"
                }`
              }
            >
              🤖 Copilot
            </NavLink>
            <NavLink
              to="/incident-replay"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-green-100 text-green-600" : "hover:bg-gray-100"
                }`
              }
            >
              ⏪ Incident Replay
            </NavLink>
          </>
        )}

        {role === "admin" && (
          <>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-red-100 text-red-600" : "hover:bg-gray-100"
                }`
              }
            >
              👑 Admin Dashboard
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                }`
              }
            >
              📈 Analytics
            </NavLink>
            <NavLink
              to="/copilot"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100"
                }`
              }
            >
              🤖 Copilot
            </NavLink>
            <NavLink
              to="/incident-replay"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-green-100 text-green-600" : "hover:bg-gray-100"
                }`
              }
            >
              ⏪ Incident Replay
            </NavLink>
          </>
        )}

        {role === "officer" && (
          <>
            <NavLink
              to="/officer"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-orange-100 text-orange-600" : "hover:bg-gray-100"
                }`
              }
            >
              👷 Officer Dashboard
            </NavLink>
          </>
        )}

        {role === "control_center" && (
          <>
            <NavLink
              to="/control-center"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-indigo-100 text-indigo-600" : "hover:bg-gray-100"
                }`
              }
            >
              🏢 Emergency Control Center
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                }`
              }
            >
              📈 Analytics
            </NavLink>
            <NavLink
              to="/copilot"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100"
                }`
              }
            >
              🤖 Copilot
            </NavLink>
            <NavLink
              to="/incident-replay"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? "bg-green-100 text-green-600" : "hover:bg-gray-100"
                }`
              }
            >
              ⏪ Incident Replay
            </NavLink>
          </>
        )}

        {/* Global links available to everyone */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-xl transition ${
              isActive ? "bg-gray-200 text-gray-800" : "hover:bg-gray-100 text-gray-600"
            }`
          }
        >
          👤 Profile
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-100 text-red-600 transition font-semibold mt-8"
        >
          🚪 Logout
        </button>

      </nav>
    </div>
  );
}
