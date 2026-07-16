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
    const [mode, setMode] = useState("command_center");
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.clear();
        sessionStorage.clear();
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
                        <h1 className="text-2xl font-bold text-blue-600">🛡️ CrisisIQ Admin</h1>
                        <p className="text-gray-400 text-sm mt-1">Smart Emergency Response & Infrastructure Intelligence</p>
                    </div>

                    {/* Nav tabs + Logout */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {navBtn("🏢 Command Center", "command_center", "bg-gray-800")}
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

                {/* ── Mode: Command Center (landing) ── */}
                {mode === "command_center" && (
                    <div className="space-y-6">
                        {/* KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">Active Emergencies</h3>
                                <p className="text-2xl font-bold text-red-600 mt-1">2</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">Pending Complaints</h3>
                                <p className="text-2xl font-bold text-orange-600 mt-1">14</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">Ambulances Active</h3>
                                <p className="text-2xl font-bold text-blue-600 mt-1">5</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">Hospitals Online</h3>
                                <p className="text-2xl font-bold text-green-600 mt-1">3</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">Officers Available</h3>
                                <p className="text-2xl font-bold text-purple-600 mt-1">8</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">AI Predictions</h3>
                                <p className="text-2xl font-bold text-indigo-600 mt-1">142</p>
                            </div>
                        </div>

                        {/* Central View */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Live Crisis Map */}
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px]">
                                <div className="bg-gray-900 text-white px-6 py-3 text-sm font-semibold flex justify-between items-center">
                                    <span>🌐 Live Crisis Map</span>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-md">System Optimal</span>
                                </div>
                                <div className="flex-1 bg-gray-100 relative">
                                    <MapView />
                                </div>
                            </div>

                            {/* AI Copilot Mini */}
                            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-[500px]">
                                <div className="bg-blue-600 text-white px-6 py-3 text-sm font-semibold flex justify-between items-center">
                                    <span>🤖 AI Emergency Copilot</span>
                                </div>
                                <div className="flex-1 p-4 bg-gray-50 flex flex-col justify-end space-y-4">
                                    <div className="bg-blue-100 text-blue-900 p-3 rounded-xl rounded-bl-none text-sm self-start max-w-[85%]">
                                        Command Center AI active. How can I assist with crisis management today?
                                    </div>
                                    <button 
                                      onClick={() => navigate('/copilot')}
                                      className="w-full bg-white border border-blue-200 text-blue-600 font-semibold p-3 rounded-xl shadow-sm hover:bg-blue-50 transition text-sm flex items-center justify-center gap-2"
                                    >
                                        Open Full Copilot Interface →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Quick Actions */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                                <h3 className="font-bold text-gray-800">⚡ Quick Actions</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => navigate('/incident-replay')} className="p-4 bg-gray-50 border hover:border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 transition group">
                                        <span className="text-2xl group-hover:scale-110 transition">⏪</span>
                                        <span className="text-sm font-semibold text-gray-700">Incident Replay</span>
                                    </button>
                                    <button onClick={() => setMode('accident')} className="p-4 bg-gray-50 border hover:border-red-300 rounded-xl flex flex-col items-center justify-center gap-2 transition group">
                                        <span className="text-2xl group-hover:scale-110 transition">🚨</span>
                                        <span className="text-sm font-semibold text-gray-700">Dispatch Unit</span>
                                    </button>
                                </div>
                            </div>

                            {/* Notifications */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                                <h3 className="font-bold text-gray-800">🔔 Recent Alerts</h3>
                                <div className="space-y-3">
                                    <div className="p-3 bg-red-50 text-red-800 text-sm rounded-lg border border-red-100 flex items-start gap-3">
                                        <span className="mt-0.5">⚠️</span>
                                        <p>Severe pothole detected on MG Road intersecting ambulance route.</p>
                                    </div>
                                    <div className="p-3 bg-orange-50 text-orange-800 text-sm rounded-lg border border-orange-100 flex items-start gap-3">
                                        <span className="mt-0.5">🌧️</span>
                                        <p>High rainfall predicted in Ernakulam. Flood risk elevated.</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 flex items-start gap-3">
                                        <span className="mt-0.5">ℹ️</span>
                                        <p>Aster Medcity ICU capacity at 85%.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
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