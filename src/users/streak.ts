const DAY_MS = 86_400_000;

export function currentStreak(activeDays: string[], today: Date): number {
  const days = new Set(activeDays);
  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const key = (date: Date) => date.toISOString().slice(0, 10);
  if (!days.has(key(cursor))) cursor.setTime(cursor.getTime() - DAY_MS);
  let streak = 0;
  while (days.has(key(cursor))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - DAY_MS);
  }
  return streak;
}
