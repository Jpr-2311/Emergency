import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { calculateLevel } from "../utils/gamification";

import Sidebar from "../components/Sidebar";
import StatsSection from "../components/StatsSection";
import ReportPothole from "../components/ReportPothole";
import Leaderboard from "../components/Leaderboard";

export default function Dashboard() {

  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(0);
  const [badge, setBadge] = useState("");

  const [username, setUsername] = useState("User");
  const [greeting, setGreeting] = useState("");
  const [potholes, setPotholes] = useState([]);

  // Username + Greeting + UserId tracking
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, [userId]); // Update when userId changes (user switches)

  // Real-time coin listener
  useEffect(() => {
    if (!userId) return;

    const userRef = ref(db, `users/${userId}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const currentCoins = data.coins || 0;

        setCoins(currentCoins);

        const levelData = calculateLevel(currentCoins);
        setLevel(levelData.level);
        setBadge(levelData.badge);
      }
    });

    return () => unsubscribe();
  }, [userId]); // Update when userId changes

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-[#f8fbff] to-[#eef3ff]">

      <Sidebar />

      {/* CENTER + RIGHT WRAPPER */}
      <div className="flex flex-1">

        {/* MAIN CONTENT */}
        <div className="flex-1 p-6 space-y-8">

          {/* Coin Counter */}
          <div className="flex justify-end">
            <div className="bg-blue-100 px-5 py-2 rounded-xl font-semibold text-blue-700 shadow-sm">
              🪙 {coins} Coins | Level {level} {badge}
            </div>
          </div>

          {/* Welcome */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-3xl font-bold text-blue-600">
              {greeting}, {username} 👋
            </h1>
            <p className="text-gray-500 mt-2">
              Helping you build better cities.
            </p>
          </div>

          {/* Stats */}
          <StatsSection />

          {/* Upload Section */}
          <ReportPothole onNewPothole={(p) => setPotholes(prev => [...prev, p])} />

        </div>

        {/* Right Leaderboard */}
        <div className="hidden lg:block w-80 p-6">
          <Leaderboard />
        </div>

      </div>
    </div>
  );
}
