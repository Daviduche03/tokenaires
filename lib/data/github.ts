import { cacheLife } from "next/cache";
import { SITE } from "@/lib/constants";

const repoApiUrl = (repoUrl: string): string => repoUrl.replace("https://github.com/", "https://api.github.com/repos/");

export function parseStarCount(payload: unknown): number | null {
  if (typeof payload !== "object" || payload === null) return null;
  const count = (payload as { stargazers_count?: unknown }).stargazers_count;
  return typeof count === "number" && Number.isFinite(count) && count >= 0 ? count : null;
}

export async function getRepoStarCount(): Promise<number | null> {
  "use cache";
  cacheLife("hours");
  try {
    const response = await fetch(repoApiUrl(SITE.repoUrl), {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "tokenaires-site" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return parseStarCount(await response.json());
  } catch {
    return null;
  }
}
