import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ambulanceIcon = L.divIcon({
  html: `<div style="font-size: 24px;">🚑</div>`,
  className: "dummy", iconSize: [24, 24], iconAnchor: [12, 12]
});

// Mock Replay Data Timeline (0 to 100 representing completion percentage)
const REPLAY_EVENTS = [
    { time: 0, title: "00:00 - Citizen submits report", explanation: "Images and coordinates received from user device.", location: [9.993, 76.301] },
    { time: 10, title: "00:08 - AI Vision analyzes images", explanation: "Model detected severe damage (96% confidence).", location: [9.993, 76.301] },
    { time: 20, title: "00:10 - Priority Engine Calculation", explanation: "Priority Score: 97. Reason: Located on Ambulance Route.", location: [9.993, 76.301] },
    { time: 30, title: "00:15 - Department Assignment", explanation: "Automatically routed to PWD (High Priority).", location: [9.993, 76.301] },
    { time: 50, title: "00:45 - Emergency Route Recalculation", explanation: "Ambulance rerouted due to severe road damage.", location: [9.995, 76.292] },
    { time: 70, title: "01:00 - Hospital Notification", explanation: "Aster Medcity notified of incoming patient.", location: [10.006, 76.277] },
    { time: 90, title: "05:00 - Repair Completed", explanation: "Engineer uploaded completion photo. Verification pending.", location: [9.993, 76.301] },
    { time: 100, title: "05:30 - Complaint Closed", explanation: "Citizen verified repair. Lifecycle complete.", location: [9.993, 76.301] }
];

export default function IncidentReplay() {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [simulation, setSimulation] = useState("none");
  const intervalRef = useRef(null);

  const activeEvent = [...REPLAY_EVENTS].reverse().find(e => progress >= e.time) || REPLAY_EVENTS[0];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return p + (0.5 * speed);
        });
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const reset = () => { setIsPlaying(false); setProgress(0); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col p-8 h-screen overflow-hidden">
        
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">AI Incident Replay & Decision Simulator</h1>
                <p className="text-gray-600">Visual reconstruction of the emergency lifecycle and "What If?" analysis.</p>
            </div>
            
            {/* Simulator Controls */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                <span className="font-bold text-gray-700">What If Simulator:</span>
                <select 
                    value={simulation} 
                    onChange={e => setSimulation(e.target.value)}
                    className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="none">Actual Scenario</option>
                    <option value="rain">Heavy Rainfall Forecast</option>
                    <option value="hospital">Hospital Capacity Full</option>
                    <option value="traffic">Major Road Closed</option>
                </select>
            </div>
        </div>

        <div className="flex flex-1 gap-6 min-h-0">
          {/* Map and Controls Column */}
          <div className="flex-2 w-2/3 flex flex-col gap-4">
            
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative z-0">
              <MapContainer center={[9.993, 76.290]} zoom={14} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* Simulated Marker jumping to active event location */}
                <Marker position={activeEvent.location} icon={ambulanceIcon}>
                  <Popup>{activeEvent.title}</Popup>
                </Marker>

                {simulation === "rain" && (
                    <Marker position={[9.995, 76.292]}>
                        <Popup>Simulation: Flash Flood Blockade</Popup>
                    </Marker>
                )}
              </MapContainer>
            </div>

            {/* Playback Controls */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <button onClick={reset} className="w-12 h-12 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 transition">
                  ⏹
                </button>
                <div className="flex-1">
                  <input type="range" min="0" max="100" value={progress} onChange={e => {setProgress(Number(e.target.value)); setIsPlaying(false);}} className="w-full" />
                </div>
                <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="p-2 border rounded">
                  <option value={1}>1x Speed</option>
                  <option value={2}>2x Speed</option>
                  <option value={5}>5x Speed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Explanation Column */}
          <div className="flex-1 w-1/3 flex flex-col gap-4 overflow-y-auto">
            
            <div className="bg-blue-50 p-6 rounded-2xl shadow-sm border border-blue-200">
                <h2 className="text-xl font-bold text-blue-900 mb-2">Live AI Decision Logic</h2>
                <div className="space-y-4 mt-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <span className="text-sm font-bold text-gray-500 uppercase">Current Event</span>
                        <p className="font-semibold text-lg text-gray-800">{activeEvent.title}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                        <span className="text-sm font-bold text-blue-500 uppercase">AI Explanation (Why?)</span>
                        <p className="text-gray-700 mt-1">{activeEvent.explanation}</p>
                    </div>
                </div>
            </div>

            {/* Simulation Comparison Panel */}
            {simulation !== "none" && (
                <div className="bg-purple-50 p-6 rounded-2xl shadow-sm border border-purple-200 mt-4">
                    <h2 className="text-lg font-bold text-purple-900 mb-4">Simulation Comparison</h2>
                    <div className="flex justify-between items-center mb-2 border-b border-purple-200 pb-2">
                        <span className="font-semibold text-gray-600">Metric</span>
                        <span className="font-bold text-gray-800">Actual</span>
                        <span className="font-bold text-purple-700">Simulated</span>
                    </div>
                    
                    {simulation === "rain" && (
                        <>
                            <div className="flex justify-between items-center py-2 text-sm">
                                <span className="text-gray-600">Ambulance ETA</span>
                                <span>12 mins</span>
                                <span className="text-red-600 font-bold">28 mins (+16m)</span>
                            </div>
                            <div className="flex justify-between items-center py-2 text-sm">
                                <span className="text-gray-600">Repair Priority</span>
                                <span>97 / 100</span>
                                <span className="text-red-600 font-bold">Escalated to 100</span>
                            </div>
                            <div className="mt-4 p-3 bg-white rounded-lg text-sm text-gray-700 border border-purple-100">
                                <strong>AI Simulation Insight:</strong> "Heavy rain simulation increases traffic congestion and blocks alternative route A. AI automatically preempts routing to Highway B."
                            </div>
                        </>
                    )}

                    {simulation === "hospital" && (
                        <>
                            <div className="flex justify-between items-center py-2 text-sm">
                                <span className="text-gray-600">Selected Hospital</span>
                                <span>Aster Medcity</span>
                                <span className="text-orange-600 font-bold">Lisie Hospital</span>
                            </div>
                            <div className="flex justify-between items-center py-2 text-sm">
                                <span className="text-gray-600">Triage Wait Time</span>
                                <span>25 mins</span>
                                <span className="text-green-600 font-bold">10 mins</span>
                            </div>
                            <div className="mt-4 p-3 bg-white rounded-lg text-sm text-gray-700 border border-purple-100">
                                <strong>AI Simulation Insight:</strong> "If Aster Medcity reaches full capacity, the AI Decision Engine instantly reroutes emergency vehicles to Lisie Hospital, saving 15 mins of triage wait time."
                            </div>
                        </>
                    )}

                    {simulation === "traffic" && (
                        <>
                            <div className="flex justify-between items-center py-2 text-sm">
                                <span className="text-gray-600">Emergency Response</span>
                                <span>Optimal</span>
                                <span className="text-red-600 font-bold">Delayed</span>
                            </div>
                            <div className="mt-4 p-3 bg-white rounded-lg text-sm text-gray-700 border border-purple-100">
                                <strong>AI Simulation Insight:</strong> "Major road closure forces traffic into secondary arteries. AI proactively alters signal phases to RED on perpendicular routes to clear the path for the ambulance."
                            </div>
                        </>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
