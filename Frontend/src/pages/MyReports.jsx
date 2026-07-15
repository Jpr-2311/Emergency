import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";

export default function MyReports() {

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

      // 🔥 Filter only logged-in user reports
      const myReports = reportArray
        .filter(report => report.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt); // Latest first

      setReports(myReports);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">

      <Sidebar />

      <div className="flex-1 p-8 space-y-6">

        <h1 className="text-2xl font-bold text-blue-600">
          My Reports
        </h1>

        {reports.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow text-gray-500">
            No reports submitted yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-blue-50">
                <tr>
                  <th className="p-4">Report ID</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>AI Priority</th>
                  <th>Status</th>
                  <th>Coins</th>
                  <th>Timeline</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {reports.map(report => (
                  <tr key={report.id} className="border-t">
                    <td className="p-4 text-sm">{report.id}</td>
                    <td>{report.location}</td>
                    <td>{report.severity}</td>
                    <td>
                      {report.ai_priority_score ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-orange-600">{report.ai_priority_score} / 100</span>
                          {report.explanation && (
                            <span className="text-[10px] text-gray-500 max-w-[120px] truncate" title={report.explanation.join(", ")}>
                                {report.explanation[0]}...
                            </span>
                          )}
                        </div>
                      ) : "N/A"}
                    </td>
                    <td>
                      <span className="px-2 py-1 bg-yellow-100 rounded-lg text-sm">
                        {report.status}
                      </span>
                    </td>
                    <td>🪙 {report.coinsAwarded}</td>
                    <td className="p-4">
                      {report.timeline ? (
                        <div className="text-xs space-y-1">
                          {report.timeline.map((t, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              <span className="text-gray-600">{t.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No timeline data</span>
                      )}
                    </td>
                    <td>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>
    </div>
  );
}
