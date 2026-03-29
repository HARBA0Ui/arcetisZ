const LEVEL_TABLE: Record<number, number> = {
  1: 0,
  2: 20,
  3: 350,
  4: 650,
  5: 1100,
  6: 1700
};

export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  if (LEVEL_TABLE[level]) return LEVEL_TABLE[level];

  let total = LEVEL_TABLE[6];
  for (let current = 7; current <= level; current += 1) {
    total += Math.floor(100 * current ** 1.5);
  }

  return total;
}

export function levelFromXp(xp: number) {
  let level = 1;

  while (xp >= xpRequiredForLevel(level + 1)) {
    level += 1;
  }

  return level;
}

export function xpProgress(xp: number) {
  const level = levelFromXp(xp);
  const currentLevelXp = xpRequiredForLevel(level);
  const nextLevelXp = xpRequiredForLevel(level + 1);

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressInLevel: xp - currentLevelXp,
    requiredForNext: nextLevelXp - currentLevelXp
  };
}
