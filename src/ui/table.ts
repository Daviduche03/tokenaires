import { padEnd, padStart, visibleWidth } from '@/ui/ansi';

export type Align = 'left' | 'right';

export interface Column {
  header: string;
  align: Align;
}

export type Paint = (text: string) => string;

export interface Row {
  cells: string[];
  paint?: Paint | undefined;
}

function pad(text: string, width: number, align: Align): string {
  return align === 'right' ? padStart(text, width) : padEnd(text, width);
}

export function renderTable(columns: readonly Column[], rows: readonly Row[], headerPaint: Paint): string[] {
  const widths = columns.map((column, index) =>
    Math.max(visibleWidth(column.header), ...rows.map((row) => visibleWidth(row.cells[index] ?? ''))),
  );
  const format = (cells: readonly string[]): string =>
    cells
      .map((cell, index) => pad(cell, widths[index] ?? 0, columns[index]?.align ?? 'left'))
      .join('   ')
      .trimEnd();
  const header = headerPaint(format(columns.map((column) => column.header)));
  const body = rows.map((row) => (row.paint ?? ((value: string) => value))(format(row.cells)));
  return [header, ...body].map((line) => `  ${line}`);
}
