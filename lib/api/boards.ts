import {
  BoardResponseSchema,
  GlobalStatsSchema,
  type BoardPeriod,
  type BoardResponse,
  type BoardSource,
  type GlobalStats,
} from "@tokenaires/contracts";
import { api } from "@/lib/api/client";

export interface BoardParams {
  period: BoardPeriod;
  source: BoardSource;
  page: number;
}

export async function getBoard(params: BoardParams): Promise<BoardResponse> {
  const { data } = await api.get<unknown>("/boards", { params });
  return BoardResponseSchema.parse(data);
}

export async function getStats(): Promise<GlobalStats> {
  const { data } = await api.get<unknown>("/stats");
  return GlobalStatsSchema.parse(data);
}
