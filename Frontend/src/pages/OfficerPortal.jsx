import { useEffect, useState } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";

export default function OfficerPortal() {
  const [complaints, setComplaints] = useState([]);
  const [engineerNotes, setEngineerNotes] = useState({});

  useEffect(() => {
    const reportsRef = ref(db, "reports");
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setComplaints([]);
        return;
      }
      // Filter for active complaints (Assigned, In Progress)
      const data = Object.entries(snapshot.val())
        .map(([id, val]) => ({ id, ...val }))
        .filter(c => c.status !== "Resolved")
        .sort((a, b) => b.createdAt - a.createdAt);
      setComplaints(data);
    });
    return () => unsubscribe();
  }, []);

  const handleNotesChange = (id, value) => {
    setEngineerNotes(prev => ({ ...prev, [id]: value }));
  };

  const markResolved = async (complaint) => {
    try {
      const notes = engineerNotes[complaint.id] || "Resolved by officer";
      
      // Update the report status and add engineer notes
      await update(ref(db, `reports/${complaint.id}`), { 
        status: "Resolved",
        engineerNotes: notes,
        resolvedAt: Date.now()
      });

      // Award coins to the citizen who reported it
      if (complaint.userId) {
        const userRef = ref(db, `users/${complaint.userId}`);
        const userSnap = await get(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.val();
          const currentCoins = userData.coins || 0;
          const coinsToAward = complaint.coinsAwarded || 50;
          await update(userRef, { coins: currentCoins + coinsToAward });
        }
      }

      // Clear local notes
      setEngineerNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[complaint.id];
        return newNotes;
      });

      alert(`Complaint ${complaint.complaintId || complaint.id} marked as resolved and coins awarded!`);
    } catch (err) {
      console.error("Error resolving complaint:", err);
      alert("Failed to resolve complaint.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">CrisisIQ Officer Portal</h1>
        <p className="text-gray-600">Smart Emergency Response & Infrastructure Intelligence</p>
        
        <div className="grid gap-6 mt-6">
          {complaints.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500 font-semibold text-lg">No active assignments. Great job! 🎉</p>
            </div>
          ) : (
            complaints.map(complaint => (
              <div key={complaint.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h3 className="text-xl font-bold text-blue-800">
                    {complaint.complaintId || complaint.id}{" "}
                    <span className="text-sm font-normal text-gray-500">({complaint.priority || "Medium"} Priority)</span>
                  </h3>
                  <p className="text-gray-600 mt-1"><strong>Location:</strong> {complaint.location}</p>
                  <p className="text-gray-600"><strong>Status:</strong> {complaint.status}</p>
                  <p className="text-gray-600"><strong>Reported by:</strong> {complaint.username}</p>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-col gap-2 w-full md:w-1/3">
                  <input 
                      type="text" 
                      placeholder="Engineer Notes (Optional)..." 
                      className="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={engineerNotes[complaint.id] || ""}
                      onChange={(e) => handleNotesChange(complaint.id, e.target.value)}
                  />
                  <button 
                      onClick={() => markResolved(complaint)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                      Mark Completed
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
