import { describe, expect, it } from "vitest";
import { shareOfLeader } from "@/lib/share";

describe("shareOfLeader", () => {
  it("is full for the leader and empty without data", () => {
    expect(shareOfLeader(27e9, 27e9)).toBe(1);
    expect(shareOfLeader(0, 27e9)).toBe(0);
    expect(shareOfLeader(500, 0)).toBe(0);
  });

  it("keeps small totals visible on a log scale", () => {
    const small = shareOfLeader(162_336, 27e9);
    expect(small).toBeGreaterThan(0.4);
    expect(small).toBeLessThan(1);
    expect(shareOfLeader(42_312, 27e9)).toBeLessThan(small);
  });
});
