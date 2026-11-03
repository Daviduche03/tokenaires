const full = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export const formatFull = (value: number): string => full.format(value);

export const formatCompact = (value: number): string => compact.format(value);

export const formatDate = (iso: string): string => shortDate.format(new Date(iso));

export function formatRelative(iso: string, now = Date.now()): string {
  const minutes = Math.round((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : formatDate(iso);
}

export const githubUrl = (handle: string): string => `https://github.com/${handle}`;

export const initials = (value: string): string => value.slice(0, 2).toUpperCase();
