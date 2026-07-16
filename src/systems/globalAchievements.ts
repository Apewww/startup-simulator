const STORAGE_KEY = 'ss-achievements';

interface GlobalAchievementData {
  obtained: Record<string, number>; // titleId -> timestamp
}

function load(): GlobalAchievementData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { obtained: {} };
}

function save(data: GlobalAchievementData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function markAchievementObtained(titleId: string): void {
  const data = load();
  if (!data.obtained[titleId]) {
    data.obtained[titleId] = Date.now();
    save(data);
  }
}

export function isAchievementObtained(titleId: string): boolean {
  return titleId in load().obtained;
}

export function getAchievementTimestamp(titleId: string): number | null {
  return load().obtained[titleId] ?? null;
}

export function getAllObtained(): Record<string, number> {
  return load().obtained;
}
