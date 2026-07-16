import { useEffect, useState } from "react";

export default function HospitalIntelligence() {
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/hospitals`)
      .then(res => res.json())
      .then(data => setHospitals(data))
      .catch(console.error);
  }, []);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hospitals.map(h => (
        <div key={h.id} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
          <h3 className="text-xl font-bold text-blue-900 mb-2">{h.name}</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-600">Available Beds:</span>
              <span className="font-semibold text-gray-800">{h.availableBeds}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-600">ICU Beds:</span>
              <span className="font-semibold text-gray-800">{h.icuBeds}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-600">Doctors on Duty:</span>
              <span className="font-semibold text-gray-800">{h.doctors}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-600">Emergency Queue:</span>
              <span className="font-semibold text-red-600">{h.emergencyQueue} patients</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-600">Triage Wait:</span>
              <span className="font-semibold text-red-600">{h.triageWaitTimeMins} mins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trauma Center:</span>
              <span className="font-semibold">{h.traumaCenter ? "✅ Yes" : "❌ No"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
