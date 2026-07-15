import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function Leaderboard() {

  const [users, setUsers] = useState([]);

  // Always read fresh currentUserId from localStorage
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    const usersRef = ref(db, "users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUsers([]);
        return;
      }

      const data = snapshot.val();

      const userArray = Object.entries(data).map(([id, value]) => ({
        id,
        ...value
      }));

      // 🏆 Sort Logic:
      // 1️⃣ Coins DESC
      // 2️⃣ Reports DESC (if coins equal)
      // 3️⃣ JoinedAt ASC (earlier join wins)
      const sortedUsers = userArray.sort((a, b) => {
        const coinDiff = (b.coins || 0) - (a.coins || 0);
        if (coinDiff !== 0) return coinDiff;

        const reportDiff = (b.reports || 0) - (a.reports || 0);
        if (reportDiff !== 0) return reportDiff;

        return (a.joinedAt || 0) - (b.joinedAt || 0);
      });

      setUsers(sortedUsers);
    });

    return () => unsubscribe();
  }, []);

  // If everyone has 0 coins → show only current user
  const filteredUsers =
    users.length > 0 && users.every(u => (u.coins || 0) === 0)
      ? users.filter(u => u.id === currentUserId)
      : users;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">

      <h2 className="text-xl font-bold mb-4 text-blue-600">
        Top Informers
      </h2>

      {filteredUsers.length === 0 ? (
        <p className="text-gray-500">No rankings yet.</p>
      ) : (
        filteredUsers.map((user, index) => (
          <div
            key={user.id}
            className={`flex justify-between py-2 border-b last:border-none ${
              user.id === currentUserId
                ? "bg-blue-50 rounded-lg px-2"
                : ""
            }`}
          >
            <span>
              {index + 1}. {user.username}
            </span>

            <span>
              🪙 {user.coins || 0}
            </span>
          </div>
        ))
      )}

    </div>
  );
}
