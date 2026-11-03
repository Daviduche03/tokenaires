import type { BoardPeriod, BoardSource } from "@tokenaires/contracts";
import { InstallCommand } from "@/components/home/install-command";
import { PERIOD_LABELS, SOURCE_FILTER_LABELS } from "@/lib/constants";

export function BoardEmpty({ period, source }: { period: BoardPeriod; source: BoardSource }) {
  const filtered = period !== "all" || source !== "all";
  return (
    <div className="mt-6 flex flex-col items-center px-4 py-8 text-center">
      <p className="text-base font-medium">{filtered ? "Nobody here yet" : "The list is empty"}</p>
      <p className="mt-1.5 max-w-sm text-sm text-t3">
        {filtered
          ? `No usage in ${SOURCE_FILTER_LABELS[source]} for ${PERIOD_LABELS[period].toLowerCase()}.`
          : "Run the command below and take the first seat."}
      </p>
      {!filtered && <InstallCommand className="mt-5" />}
    </div>
  );
}
