import { ref, update, get } from "firebase/database";
import { db } from "../firebase";
import { calculateLevel } from "../utils/gamification";

export default function HeroUpload() {

  const handleUpload = async (e) => {
    const userId = localStorage.getItem("userId");

    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const newCoins = (data.coins || 0) + 50;
      const newReports = (data.reports || 0) + 1;

      const levelData = calculateLevel(newCoins);

      await update(userRef, {
        coins: newCoins,
        reports: newReports,
        level: levelData.level
      });
    }
  };

  return (
    <div className="bg-white p-10 rounded-3xl shadow-sm text-center">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">
        Smart AI Road Monitoring
      </h2>

      <label className="flex flex-col items-center border-2 border-dashed border-blue-300 rounded-2xl p-12 cursor-pointer hover:bg-blue-50 transition">

        <div className="text-5xl mb-4">📷</div>
        <p>Drag & drop image or click to upload</p>

        <input
          type="file"
          className="hidden"
          onChange={handleUpload}
        />
      </label>
    </div>
  );
}
