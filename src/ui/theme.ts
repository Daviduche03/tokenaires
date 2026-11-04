import pc from 'picocolors';

const ESC = String.fromCharCode(27);

function limeOpen(env: NodeJS.ProcessEnv): string | null {
  if (!pc.isColorSupported) return null;
  const colorTerm = (env.COLORTERM ?? '').toLowerCase();
  if (colorTerm === 'truecolor' || colorTerm === '24bit') return `${ESC}[38;2;190;242;100m`;
  if ((env.TERM ?? '').includes('256')) return `${ESC}[38;5;191m`;
  return null;
}

const LIME = limeOpen(process.env);

function lime(text: string): string {
  return LIME ? `${LIME}${text}${ESC}[39m` : pc.green(text);
}

function supportsUnicode(env: NodeJS.ProcessEnv, platform: NodeJS.Platform): boolean {
  if (platform !== 'win32') return env.TERM !== 'linux';
  return Boolean(env.WT_SESSION) || env.TERM_PROGRAM === 'vscode';
}

const UNICODE = supportsUnicode(process.env, process.platform);

export const symbols = UNICODE
  ? {
      tick: '✔',
      cross: '✖',
      warn: '▲',
      dot: '·',
      arrow: '→',
      logo: '▀█▀',
      spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
      barFull: '━',
      barEmpty: '─',
      box: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
    }
  : {
      tick: '√',
      cross: 'x',
      warn: '!',
      dot: '-',
      arrow: '->',
      logo: '[T]',
      spinner: ['-', '\\', '|', '/'],
      barFull: '#',
      barEmpty: '-',
      box: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
    };

export const theme = {
  title: (text: string): string => pc.bold(text),
  dim: (text: string): string => pc.dim(text),
  accent: (text: string): string => lime(text),
  good: (text: string): string => lime(text),
  warn: (text: string): string => pc.yellow(text),
  bad: (text: string): string => pc.red(text),
  strong: (text: string): string => pc.bold(text),
};

export function progressBar(ratio: number, width: number): string {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));
  const filled = Math.round(clamped * width);
  return `${theme.accent(symbols.barFull.repeat(filled))}${theme.dim(symbols.barEmpty.repeat(width - filled))}`;
}
