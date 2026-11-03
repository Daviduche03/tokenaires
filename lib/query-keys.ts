import type { BoardParams } from "@/lib/api/boards";

export const queryKeys = {
  board: (params: BoardParams) => ["board", params.period, params.source, params.page] as const,
  stats: () => ["stats"] as const,
};
