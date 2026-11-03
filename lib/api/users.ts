import { ProfileResponseSchema, type ProfileResponse } from "@tokenaires/contracts";
import { isAxiosError } from "axios";
import { api } from "@/lib/api/client";

export async function getProfile(handle: string): Promise<ProfileResponse | null> {
  try {
    const { data } = await api.get<unknown>(`/users/${encodeURIComponent(handle)}`);
    return ProfileResponseSchema.parse(data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}
