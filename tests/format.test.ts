import { describe, expect, it } from 'vitest';
import { formatCompact, formatInt, formatPercent, formatRank } from '@/ui/format';
import { renderTable } from '@/ui/table';

describe('formatting', () => {
  it('formats compact numbers', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(999)).toBe('999');
    expect(formatCompact(1_234)).toBe('1.2K');
    expect(formatCompact(1_200_000_000)).toBe('1.2B');
    expect(formatCompact(999_960)).toBe('1M');
    expect(formatCompact(27_137_616_336)).toBe('27.1B');
    expect(formatCompact(3_400_000_000_000)).toBe('3.4T');
  });

  it('formats integers, percentages and ranks', () => {
    expect(formatInt(1234567)).toBe('1,234,567');
    expect(formatPercent(0.4723)).toBe('47.2%');
    expect(formatPercent(0.0001)).toBe('<0.1%');
    expect(formatRank(null)).toBe('unranked');
    expect(formatRank(1204)).toBe('#1,204');
  });

  it('aligns table columns', () => {
    const lines = renderTable(
      [
        { header: 'Name', align: 'left' },
        { header: 'Count', align: 'right' },
      ],
      [{ cells: ['a', '1'] }, { cells: ['longer', '1,000'] }],
      (text) => text,
    );
    expect(lines).toEqual(['  Name     Count', '  a            1', '  longer   1,000']);
  });
});
