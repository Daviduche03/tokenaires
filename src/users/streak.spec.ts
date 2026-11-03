import { currentStreak } from './streak';

describe('currentStreak', () => {
  const today = new Date('2026-11-03T15:00:00Z');

  it('counts consecutive days ending today', () => {
    expect(
      currentStreak(['2026-11-01', '2026-11-02', '2026-11-03'], today),
    ).toBe(3);
  });

  it('keeps a streak alive when today has no usage yet', () => {
    expect(currentStreak(['2026-11-01', '2026-11-02'], today)).toBe(2);
  });

  it('breaks on a missing day', () => {
    expect(currentStreak(['2026-10-30', '2026-11-03'], today)).toBe(1);
    expect(currentStreak(['2026-10-31'], today)).toBe(0);
  });
});
