import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function OfficerPortal() {
  const [complaints, setComplaints] = useState([
    { id: "CMP-10293", location: "Kochi, MG Road", severity: "severe", status: "Assigned", priority: "High" },
    { id: "CMP-99812", location: "Edappally Toll", severity: "moderate", status: "In Progress", priority: "Medium" }
  ]);
  const [engineerNotes, setEngineerNotes] = useState("");

  const markResolved = (id) => {
    setComplaints(complaints.map(c => c.id === id ? { ...c, status: "Resolved" } : c));
    alert(`Complaint ${id} marked as resolved!`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Officer Dashboard</h1>
        <p className="text-gray-600">Manage assigned emergency repairs and update progress.</p>
        
        <div className="grid gap-6 mt-6">
          {complaints.map(complaint => (
            <div key={complaint.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="text-xl font-bold text-blue-800">{complaint.id} <span className="text-sm font-normal text-gray-500">({complaint.priority} Priority)</span></h3>
                <p className="text-gray-600 mt-1"><strong>Location:</strong> {complaint.location}</p>
                <p className="text-gray-600"><strong>Status:</strong> {complaint.status}</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col gap-2 w-full md:w-1/3">
                <input 
                    type="text" 
                    placeholder="Engineer Notes..." 
                    className="p-2 border rounded-lg w-full"
                    value={engineerNotes}
                    onChange={(e) => setEngineerNotes(e.target.value)}
                />
                {complaint.status !== "Resolved" && (
                    <button 
                        onClick={() => markResolved(complaint.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                        Mark Completed
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
