import { useEffect, useState } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { db } from "../firebase";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import MapView from "./MapView";

// ─── Hospital list (same as MapView) ──────────────────────────────────────
const HOSPITALS = [
    { id: "H1", name: "Lisie Hospital" },
    { id: "H3", name: "Aster Medcity" },
    { id: "H5", name: "Renai Medicity" },
];

// ─── Leaderboard ──────────────────────────────────────────────────────────
function Leaderboard() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const usersRef = ref(db, "users");
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (!snapshot.exists()) return;
            const data = Object.entries(snapshot.val()).map(([id, u]) => ({
                id,
                username: u.username,
                coins: u.coins || 0,
                reports: u.reports || 0,
            }));
            data.sort((a, b) => b.coins - a.coins);
            setUsers(data.slice(0, 10));
        });
        return () => unsubscribe();
    }, []);

    const medals = ["🥇", "🥈", "🥉"];

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
            <h2 className="text-lg font-bold text-blue-600">🏆 Leaderboard</h2>
            {users.map((u, i) => (
                <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl w-7">{medals[i] || `#${i + 1}`}</span>
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">{u.username}</p>
                            <p className="text-xs text-gray-500">{u.reports} reports</p>
                        </div>
                    </div>
                    <span className="font-bold text-blue-600 text-sm">🪙 {u.coins}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Pothole Requests ─────────────────────────────────────────────────────
function PotholeRequests() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const reportsRef = ref(db, "reports");
        const unsubscribe = onValue(reportsRef, (snapshot) => {
            if (!snapshot.exists()) { setReports([]); return; }
            const data = Object.entries(snapshot.val())
                .map(([id, v]) => ({ id, ...v }))
                .sort((a, b) => b.createdAt - a.createdAt);
            setReports(data);
        });
        return () => unsubscribe();
    }, []);

    const updateStatus = async (reportId, newStatus) => {
        // Get the report to find the user and coins
        const report = reports.find(r => r.id === reportId);
        if (!report) return;

        // Update report status
        await update(ref(db, `reports/${reportId}`), { status: newStatus });

        // If marking as Resolved, award coins to user
        if (newStatus === "Resolved" && report.userId) {
            try {
                const userRef = ref(db, `users/${report.userId}`);
                const userSnapshot = await get(userRef);
                
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.val();
                    const currentCoins = userData.coins || 0;
                    const coinsToAward = report.coinsAwarded || 0;
                    const currentReports = userData.reports || 0;

                    // Update user coins and report count
                    await update(ref(db, `users/${report.userId}`), {
                        coins: currentCoins + coinsToAward,
                        reports: currentReports + 1
                    });
                }
            } catch (err) {
                console.error("Error awarding coins:", err);
            }
        }
    };

    const severityColor = (s) =>
        s === "severe"
            ? "bg-red-100 text-red-700"
            : s === "moderate"
                ? "bg-orange-100 text-orange-700"
                : "bg-yellow-100 text-yellow-700";

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-blue-600">
                🕳️ Pothole Reports ({reports.length})
            </h2>

            {reports.length === 0 ? (
                <p className="text-gray-400 text-sm">No reports yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-blue-50 text-gray-600">
                                <th className="p-3">User</th>
                                <th className="p-3">Location</th>
                                <th className="p-3">Severity</th>
                                <th className="p-3">Confidence</th>
                                <th className="p-3">Coins</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((r) => (
                                <tr key={r.id} className="border-t hover:bg-gray-50 transition">
                                    <td className="p-3 font-medium">{r.username}</td>
                                    <td className="p-3 text-gray-500 max-w-[160px] truncate">{r.location}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${severityColor(r.severity)}`}>
                                            {r.severity}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-600">
                                        {r.confidence
                                            ? `${(parseFloat(r.confidence) * 100).toFixed(0)}%`
                                            : "N/A"}
                                    </td>
                                    <td className="p-3">🪙 {r.coinsAwarded}</td>
                                    <td className="p-3 text-gray-500">
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3">
                                        <select
                                            value={r.status}
                                            onChange={(e) => updateStatus(r.id, e.target.value)}
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Donor Transport Panel ────────────────────────────────────────────────
function DonorTransportPanel() {
    const [from, setFrom] = useState(HOSPITALS[0].id);
    const [to, setTo] = useState(HOSPITALS[1].id);
    const [active, setActive] = useState(false);

    const canStart = from !== to;

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-bold text-blue-600">🫀 Donor Transport</h2>
                <p className="text-sm text-gray-500">
                    Select origin and destination hospitals for organ/donor transport.
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">FROM Hospital</label>
                        <select
                            value={from}
                            onChange={(e) => { setFrom(e.target.value); setActive(false); }}
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            {HOSPITALS.map((h) => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">TO Hospital</label>
                        <select
                            value={to}
                            onChange={(e) => { setTo(e.target.value); setActive(false); }}
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            {HOSPITALS.map((h) => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {!canStart && (
                    <p className="text-xs text-red-500">Origin and destination must be different hospitals.</p>
                )}

                <button
                    disabled={!canStart}
                    onClick={() => setActive(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition"
                >
                    🚑 Start Donor Transport Route
                </button>
            </div>

            {active && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-blue-600 text-white px-6 py-3 text-sm font-semibold">
                        🫀 Donor Route:{" "}
                        {HOSPITALS.find((h) => h.id === from)?.name} →{" "}
                        {HOSPITALS.find((h) => h.id === to)?.name}
                    </div>
                    <div style={{ height: "calc(100vh - 320px)", minHeight: "300px" }}>
                        <MapView donorMode donorFrom={from} donorTo={to} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────
export default function Admin() {
    const [mode, setMode] = useState("select");
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.clear();
        navigate("/login");
    };

    const navBtn = (label, target, color = "bg-blue-600") => (
        <button
            onClick={() => setMode(target)}
            className={`${color} ${mode === target ? "ring-2 ring-offset-2 ring-blue-400" : ""
                } text-white font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition text-sm`}
        >
            {label}
        </button>
    );

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-r from-[#f8fbff] to-[#eef3ff]">
            <div className="h-full p-6 space-y-6 overflow-y-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-600">🛡️ Admin Dashboard</h1>
                        <p className="text-gray-400 text-sm mt-1">Manage dispatch, potholes, and leaderboard</p>
                    </div>

                    {/* Nav tabs + Logout */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {navBtn("🚨 Accident", "accident", "bg-red-600")}
                        {navBtn("🫀 Donor Transport", "donor", "bg-purple-600")}
                        {navBtn("🕳️ Pothole Reports", "potholes", "bg-orange-500")}
                        {navBtn("🏆 Leaderboard", "leaderboard", "bg-green-600")}

                        <button
                            onClick={handleLogout}
                            className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 font-semibold px-4 py-2 rounded-xl transition text-sm border border-gray-200 hover:border-red-200"
                        >
                            🚪 Logout
                        </button>
                    </div>
                </div>

                {/* ── Mode: Select (landing) ── */}
                {mode === "select" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={() => setMode("accident")}
                            className="bg-white rounded-2xl shadow-sm p-8 text-left hover:shadow-md hover:border-red-200 border-2 border-transparent transition group"
                        >
                            <div className="text-4xl mb-3">🚨</div>
                            <h2 className="text-xl font-bold text-gray-800 group-hover:text-red-600 transition">Accident / Emergency</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Dispatch ambulance from current location to nearest hospital. Uses full pothole-aware routing.
                            </p>
                        </button>

                        <button
                            onClick={() => setMode("donor")}
                            className="bg-white rounded-2xl shadow-sm p-8 text-left hover:shadow-md hover:border-purple-200 border-2 border-transparent transition group"
                        >
                            <div className="text-4xl mb-3">🫀</div>
                            <h2 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition">Donor Transport</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Route an ambulance between two hospitals for organ or donor transfer.
                            </p>
                        </button>

                        <button
                            onClick={() => setMode("potholes")}
                            className="bg-white rounded-2xl shadow-sm p-8 text-left hover:shadow-md hover:border-orange-200 border-2 border-transparent transition group"
                        >
                            <div className="text-4xl mb-3">🕳️</div>
                            <h2 className="text-xl font-bold text-gray-800 group-hover:text-orange-500 transition">Pothole Reports</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Review, approve, or update the status of community pothole reports.
                            </p>
                        </button>

                        <button
                            onClick={() => setMode("leaderboard")}
                            className="bg-white rounded-2xl shadow-sm p-8 text-left hover:shadow-md hover:border-green-200 border-2 border-transparent transition group"
                        >
                            <div className="text-4xl mb-3">🏆</div>
                            <h2 className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition">Leaderboard</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                View top contributors ranked by coins earned from pothole reports.
                            </p>
                        </button>
                    </div>
                )}

                {/* ── Mode: Accident ── */}
                {mode === "accident" && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
                        <div className="bg-red-600 text-white px-6 py-3 text-sm font-semibold flex items-center gap-2">
                            🚨 Accident / Emergency Dispatch
                            <span className="ml-auto text-xs opacity-75">Use AUTO SELECT NEAREST to dispatch</span>
                        </div>
                        <div className="flex-1">
                            <MapView />
                        </div>
                    </div>
                )}

                {/* ── Mode: Donor Transport ── */}
                {mode === "donor" && <DonorTransportPanel />}

                {/* ── Mode: Pothole Reports ── */}
                {mode === "potholes" && <PotholeRequests />}

                {/* ── Mode: Leaderboard ── */}
                {mode === "leaderboard" && (
                    <div className="max-w-lg">
                        <Leaderboard />
                    </div>
                )}
            </div>
        </div>
    );
}