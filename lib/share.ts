export function shareOfLeader(tokens: number, leader: number): number {
  if (leader <= 0 || tokens <= 0) return 0;
  const ratio = Math.log10(tokens + 1) / Math.log10(leader + 1);
  return Math.min(1, Math.max(0.02, ratio));
}
