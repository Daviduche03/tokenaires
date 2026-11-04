import { describe, expect, it } from "vitest";
import { parseStarCount } from "@/lib/data/github";

describe("parseStarCount", () => {
  it("reads the stargazer count from the GitHub repo payload", () => {
    expect(parseStarCount({ stargazers_count: 1234 })).toBe(1234);
    expect(parseStarCount({ stargazers_count: 0 })).toBe(0);
  });

  it("returns null for missing or invalid counts", () => {
    expect(parseStarCount(null)).toBeNull();
    expect(parseStarCount({ message: "API rate limit exceeded" })).toBeNull();
    expect(parseStarCount({ stargazers_count: "12" })).toBeNull();
    expect(parseStarCount({ stargazers_count: -1 })).toBeNull();
  });
});
