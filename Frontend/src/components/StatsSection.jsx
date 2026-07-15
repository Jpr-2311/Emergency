import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function StatsSection() {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0,
    pending: 0,
  });

  useEffect(() => {
    const reportsRef = ref(db, "reports");
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = Object.values(snapshot.val());

      setStats({
        total:      data.length,
        resolved:   data.filter(r => r.status === "Resolved").length,
        inProgress: data.filter(r => r.status === "In Progress").length,
        pending:    data.filter(r => r.status === "Pending").length,
      });
    });

    return () => unsubscribe();
  }, []);

  const cards = [
    { title: "Total Issues",  value: stats.total },
    { title: "Resolved",      value: stats.resolved },
    { title: "In Progress",   value: stats.inProgress },
    { title: "Pending",       value: stats.pending },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {cards.map((item, index) => (
        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
          <p className="text-gray-500">{item.title}</p>
          <h2 className="text-2xl font-bold text-blue-600">{item.value}</h2>
        </div>
      ))}
    </div>
  );
}