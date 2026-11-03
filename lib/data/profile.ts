import type { ProfileResponse } from "@tokenaires/contracts";
import { cacheLife } from "next/cache";
import { getProfile } from "@/lib/api/users";

export async function getCachedProfile(handle: string): Promise<ProfileResponse | null> {
  "use cache";
  cacheLife("minutes");
  return getProfile(handle);
}
