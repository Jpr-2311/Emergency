import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Analytics() {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5001/recommendations")
      .then(res => res.json())
      .then(data => setRecommendations(data))
      .catch(console.error);
  }, []);

  const metrics = [
    { label: "Total Complaints", value: "3,412" },
    { label: "Pending Critical Issues", value: "18" },
    { label: "Average Repair Time", value: "48 Hours" },
    { label: "Risk Index", value: "High (82/100)" }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Enterprise Government Dashboard</h1>
        <p className="text-gray-600">Overview of civic infrastructure health, department performance, and live AI insights.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-gray-500 text-sm font-semibold">{m.label}</span>
              <span className="text-3xl font-bold text-blue-600 mt-2">{m.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                <h3 className="font-bold text-gray-800 mb-4">AI Priority Heatmap & Road Health</h3>
                <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl text-gray-400">
                    [ Leaflet Heatmap Overlay Placeholder ]
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                <h3 className="font-bold text-gray-800 mb-4">Smart Recommendations</h3>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {recommendations.map(rec => (
                        <div key={rec.id} className="p-3 bg-blue-50 text-blue-900 rounded-lg text-sm border border-blue-100 flex items-start gap-2">
                            <span>💡</span>
                            <span>{rec.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
