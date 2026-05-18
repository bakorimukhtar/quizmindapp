export function getLevel(totalXp: number) {
  return Math.floor(totalXp / 100) + 1;
}

export function getLevelProgress(totalXp: number) {
  return totalXp % 100;
}

export function formatLastStudied(iso: string | null) {
  if (!iso) return "Never studied";

  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
