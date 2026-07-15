import { ref, get, set } from "firebase/database";
import { db } from "../firebase";

export const initializeUser = async (userId, username) => {
  const userRef = ref(db, `users/${userId}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    await set(userRef, {
      username: username,
      coins: 0,
      reports: 0,
      level: 0
    });
  }
};
