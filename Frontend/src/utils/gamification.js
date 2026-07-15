export const levels = [
  { level: 1, name: "Bronze Informer", badge: "🥉", min: 1000 },
  { level: 2, name: "Silver Informer", badge: "🥈", min: 3000 },
  { level: 3, name: "Gold Informer", badge: "🥇", min: 6000 },
  { level: 4, name: "Elite Civic Guardian", badge: "👑", min: 10000 }
];

export const calculateLevel = (coins) => {
  let currentLevel = 0;

  for (let i = levels.length - 1; i >= 0; i--) {
    if (coins >= levels[i].min) {
      currentLevel = levels[i].level;
      break;
    }
  }

  const levelData = levels.find(l => l.level === currentLevel);

  return levelData || { level: 0, name: "New Informer", badge: "🔰", min: 0 };
};

export const getNextLevel = (coins) => {
  return levels.find(level => coins < level.min);
};
