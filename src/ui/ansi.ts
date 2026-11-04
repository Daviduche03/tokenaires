const ESC = String.fromCharCode(27);
const SEQUENCE = new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]`, 'g');
const SEQUENCE_AT_START = new RegExp(`^${ESC}\\[[0-9;?]*[A-Za-z]`);
const RESET = `${ESC}[0m`;

export function stripAnsi(text: string): string {
  return text.replace(SEQUENCE, '');
}

export function visibleWidth(text: string): number {
  return Array.from(stripAnsi(text)).length;
}

export function padEnd(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - visibleWidth(text)));
}

export function padStart(text: string, width: number): string {
  return ' '.repeat(Math.max(0, width - visibleWidth(text))) + text;
}

export function clip(text: string, width: number): string {
  if (visibleWidth(text) <= width) return text;
  let out = '';
  let shown = 0;
  let styled = false;
  let rest = text;
  while (rest.length > 0 && shown < width) {
    const sequence = SEQUENCE_AT_START.exec(rest);
    if (sequence) {
      out += sequence[0];
      styled = true;
      rest = rest.slice(sequence[0].length);
      continue;
    }
    const char = String.fromCodePoint(rest.codePointAt(0) ?? 0);
    out += char;
    shown += 1;
    rest = rest.slice(char.length);
  }
  return styled ? out + RESET : out;
}
