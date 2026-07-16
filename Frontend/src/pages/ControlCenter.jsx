import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import HospitalIntelligence from "../components/HospitalIntelligence";

export default function ControlCenter() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch mock IoT sensor alerts from Node server
    fetch(`${import.meta.env.VITE_API_URL}/iot/sensors`)
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">CrisisIQ Emergency Control Center</h1>
        <p className="text-gray-600">AI-Powered Government Crisis Management Platform</p>
        
        {/* Alerts Section */}
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
            <h2 className="text-xl font-bold text-red-800 mb-4">Active IoT Alerts</h2>
            {alerts.length === 0 ? <p className="text-gray-500">No active alerts.</p> : (
                <div className="space-y-3">
                    {alerts.map((alert, i) => (
                        <div key={i} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center border border-red-100">
                            <div>
                                <span className="font-bold text-red-600">{alert.type} Alert</span> - Risk: {alert.risk}
                            </div>
                            <div className="text-sm text-gray-500">
                                Location: [{alert.location[0]}, {alert.location[1]}]
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Hospital Intelligence Integration */}
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Hospital Readiness</h2>
            <HospitalIntelligence />
        </div>
      </div>
    </div>
  );
}
