import pc from 'picocolors';

export const theme = {
  title: (text: string): string => pc.bold(text),
  dim: (text: string): string => pc.dim(text),
  accent: (text: string): string => pc.cyan(text),
  good: (text: string): string => pc.green(text),
  warn: (text: string): string => pc.yellow(text),
  bad: (text: string): string => pc.red(text),
  strong: (text: string): string => pc.bold(text),
};

export function progressBar(ratio: number, width: number): string {
  const clamped = Math.min(1, Math.max(0, ratio));
  const filled = Math.round(clamped * width);
  return `${pc.cyan('━'.repeat(filled))}${pc.dim('━'.repeat(width - filled))}`;
}
