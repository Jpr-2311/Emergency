import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear localStorage on logout
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg p-6 hidden md:block">
      <h2 className="text-2xl font-extrabold text-blue-600 mb-10">
        POTHOLE GO
      </h2>

      <nav className="space-y-4">

        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-xl transition ${
              isActive
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            }`
          }
        >
          📊 Dashboard
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-xl transition ${
              isActive
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            }`
          }
        >
          📄 My Reports
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-xl transition ${
              isActive
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            }`
          }
        >
          👤 Profile
        </NavLink>

        <NavLink
          to="/copilot"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-xl transition ${
              isActive
                ? "bg-purple-100 text-purple-600"
                : "hover:bg-gray-100"
            }`
          }
        >
          🤖 Copilot
        </NavLink>

        <NavLink
          to="/incident-replay"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-xl transition ${
              isActive
                ? "bg-green-100 text-green-600"
                : "hover:bg-gray-100"
            }`
          }
        >
          ⏪ Incident Replay
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
