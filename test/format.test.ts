import { tierFor, nextTier } from "@tokenaires/contracts";
import { describe, expect, it } from "vitest";
import { formatCompact, formatFull, formatRelative } from "@/lib/format";

describe("format", () => {
  it("formats full and compact token counts", () => {
    expect(formatFull(1234567)).toBe("1,234,567");
    expect(formatCompact(1_250_000_000)).toBe("1.3B");
    expect(formatCompact(0)).toBe("0");
  });

  it("formats relative sync times", () => {
    const now = Date.parse("2026-11-03T12:00:00Z");
    expect(formatRelative("2026-11-03T11:59:40Z", now)).toBe("just now");
    expect(formatRelative("2026-11-03T11:15:00Z", now)).toBe("45m ago");
    expect(formatRelative("2026-11-01T12:00:00Z", now)).toBe("2d ago");
  });
});

describe("tiers", () => {
  it("maps totals to tiers and the next goal", () => {
    expect(tierFor(0)).toBe("hopeful");
    expect(tierFor(2_500_000)).toBe("millionaire");
    expect(tierFor(1_000_000_000)).toBe("billionaire");
    expect(nextTier(2_500_000)?.id).toBe("billionaire");
    expect(nextTier(2e12)).toBeNull();
  });
});
