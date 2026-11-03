import { describe, expect, it } from "vitest";
import { buildHeatmap } from "@/components/profile/heatmap-data";
import { HEATMAP_WEEKS } from "@/lib/constants";

describe("buildHeatmap", () => {
  const today = new Date("2026-11-03T15:00:00Z");

  it("returns full weeks ending on the Saturday after today", () => {
    const weeks = buildHeatmap([], today);
    expect(weeks).toHaveLength(HEATMAP_WEEKS);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    const last = weeks[HEATMAP_WEEKS - 1];
    expect(last[6].day).toBe("2026-11-07");
    expect(last.find((cell) => cell.day === "2026-11-03")?.future).toBe(false);
    expect(last.find((cell) => cell.day === "2026-11-04")?.future).toBe(true);
  });

  it("keeps empty days at level zero and ranks busy days higher", () => {
    const daily = [
      { day: "2026-11-01", tokens: 10 },
      { day: "2026-11-02", tokens: 1_000 },
      { day: "2026-11-03", tokens: 1_000_000 },
    ];
    const cells = buildHeatmap(daily, today).flat();
    const level = (day: string) => cells.find((cell) => cell.day === day)?.level;
    expect(level("2026-10-31")).toBe(0);
    expect(level("2026-11-01")).toBeLessThan(level("2026-11-03") ?? 0);
    expect(level("2026-11-03")).toBe(4);
  });
});
