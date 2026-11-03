"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getBoard, getStats, type BoardParams } from "@/lib/api/boards";
import { queryKeys } from "@/lib/query-keys";

export function useBoard(params: BoardParams) {
  return useQuery({
    queryKey: queryKeys.board(params),
    queryFn: () => getBoard(params),
    placeholderData: keepPreviousData,
  });
}

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats(), queryFn: getStats });
}
