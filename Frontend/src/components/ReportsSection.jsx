import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function ReportsSection() {
  const [reports, setReports] = useState([]);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;

    const reportsRef = ref(db, "reports");
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setReports([]);
        return;
      }

      const data = snapshot.val();
      const reportArray = Object.entries(data).map(([id, value]) => ({
        id,
        ...value
      }));

      // Filter only logged-in user reports
      const myReports = reportArray
        .filter(report => report.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt);

      setReports(myReports);
    });

    return () => unsubscribe();
  }, [userId]);

  const getStatusColor = (status) => {
    if (status === "Resolved") return "bg-green-100 text-green-700";
    if (status === "In Progress") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getSeverityColor = (severity) => {
    if (severity === "severe") return "bg-red-100 text-red-700";
    if (severity === "moderate") return "bg-orange-100 text-orange-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold mb-4">
        My Reports ({reports.length})
      </h2>

      {reports.length === 0 ? (
        <p className="text-gray-500">
          No reports submitted yet.
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {reports.map(report => (
            <div
              key={report.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    <strong>Location:</strong> {report.location}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-600">
                    🪙 {report.coinsAwarded || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
