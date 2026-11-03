"use client";

import { BOARD_PERIODS, type BoardPeriod, type BoardSource } from "@tokenaires/contracts";
import { SourceIcon } from "@/components/brand/source-icon";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { Select, type SelectOption } from "@/components/ui/select";
import { PERIOD_LABELS, SOURCE_FILTER_LABELS } from "@/lib/constants";
import { BoardSummary } from "./board-summary";

const PERIOD_OPTIONS = BOARD_PERIODS.map((value) => ({ value, label: PERIOD_LABELS[value] }));

const SOURCE_OPTIONS: ReadonlyArray<SelectOption<BoardSource>> = [
  { value: "all", label: SOURCE_FILTER_LABELS.all },
  { value: "claude-code", label: SOURCE_FILTER_LABELS["claude-code"], icon: <SourceIcon source="claude-code" /> },
  { value: "codex", label: SOURCE_FILTER_LABELS.codex, icon: <SourceIcon source="codex" /> },
];

interface BoardControlsProps {
  period: BoardPeriod;
  source: BoardSource;
  onPeriodChange: (period: BoardPeriod) => void;
  onSourceChange: (source: BoardSource) => void;
}

export function BoardControls({ period, source, onPeriodChange, onSourceChange }: BoardControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-medium tracking-[-0.02em]">Rich list</h2>
        <BoardSummary />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedTabs aria-label="Period" value={period} onValueChange={onPeriodChange} options={PERIOD_OPTIONS} />
        <Select aria-label="Tool" value={source} onValueChange={onSourceChange} options={SOURCE_OPTIONS} className="h-10 w-[9.5rem]" />
      </div>
    </div>
  );
}
