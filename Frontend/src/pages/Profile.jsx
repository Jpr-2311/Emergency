import { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../firebase";
import { calculateLevel, getNextLevel, levels } from "../utils/gamification";
import Sidebar from "../components/Sidebar";

export default function Profile() {

  const userId = localStorage.getItem("userId");

  const [userData, setUserData] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [nextLevel, setNextLevel] = useState(null);

  // 🔄 Real-time Listener
  useEffect(() => {
    if (!userId) return;

    const userRef = ref(db, `users/${userId}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData(data);

        const levelData = calculateLevel(data.coins || 0);
        setCurrentLevel(levelData);

        const next = getNextLevel(data.coins || 0);
        setNextLevel(next);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading Profile...
      </div>
    );
  }

  const coins = userData.coins || 0;
  const reports = userData.reports || 0;

  // 🔹 Proper Progress Calculation
  let progressPercentage = 100;

  if (nextLevel) {
    const previousLevelMin =
      currentLevel?.min || 0;

    const range = nextLevel.min - previousLevelMin;
    const progress = coins - previousLevelMin;

    progressPercentage = Math.min(
      (progress / range) * 100,
      100
    );
  }

  const handleRedeem = async () => {
    if (coins < 1000) return;

    await update(ref(db, `users/${userId}`), {
      coins: coins - 1000
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-[#f8fbff] to-[#eef3ff]">

      <Sidebar />

      <div className="flex-1 p-10 space-y-8">

        {/* 🧍 Basic Profile Info */}
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-4">

          <h2 className="text-2xl font-bold text-blue-600">
            {userData.username}
          </h2>

          <p className="text-gray-700 text-lg">
            🪙 {coins} Coins
          </p>

          <p className="text-gray-700 text-lg">
            🏆 Level {currentLevel?.level || 0} –{" "}
            {currentLevel?.name || "New Informer"}{" "}
            {currentLevel?.badge}
          </p>

          <p className="text-gray-700 text-lg">
            📊 {reports} Reports Submitted
          </p>

          <button
            disabled={coins < 1000}
            onClick={handleRedeem}
            className={`mt-4 px-5 py-2 rounded-xl text-white transition ${
              coins >= 1000
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Redeem 1000 Coins
          </button>

        </div>

        {/* 📈 Progress Section */}
        {nextLevel && (
          <div className="bg-white rounded-2xl shadow-sm p-8 space-y-4">

            <h3 className="text-lg font-semibold text-blue-600">
              Progress to {nextLevel.name}
            </h3>

            <p className="text-gray-600">
              {coins} / {nextLevel.min} Coins
            </p>

            <div className="w-full bg-gray-200 h-3 rounded-full">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

          </div>
        )}

        {/* 🏆 Level Journey */}
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-4">

          <h3 className="text-lg font-semibold text-blue-600">
            Level Journey
          </h3>

          {levels.map((level) => {

            let status = "Locked";
            let statusColor = "text-gray-400";

            if (coins >= level.min) {
              status = "Completed";
              statusColor = "text-green-600";
            } else if (
              currentLevel?.level + 1 === level.level
            ) {
              status = "Active";
              statusColor = "text-blue-600";
            }

            return (
              <div
                key={level.level}
                className="flex justify-between border-b pb-2"
              >
                <span>
                  {level.badge} {level.name}
                </span>

                <span className={`text-sm ${statusColor}`}>
                  {status}
                </span>
              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
}
