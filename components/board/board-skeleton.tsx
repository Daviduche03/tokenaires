import { Skeleton } from "@/components/ui/skeleton";
import { ROW_GRID } from "./row-grid";
import { LADDER } from "./ladder";

export function TopThreeSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 items-end gap-2 sm:gap-3">
      {LADDER.map(({ rank, step, order }) => (
        <div key={rank} className={`flex min-w-0 flex-col ${order}`}>
          <div className="flex min-h-[132px] flex-col items-center rounded-t-[14px] border border-b-0 border-line bg-panel-raised px-2 pt-3 sm:hidden">
            <Skeleton className="h-6 w-9" />
            <Skeleton className="mt-2.5 size-9" />
            <Skeleton className="mt-2 h-3 w-14" />
            <Skeleton className="mt-1.5 h-3.5 w-10" />
          </div>
          <div className="hidden flex-col rounded-t-[var(--radius-card)] border border-line bg-panel-raised p-4 sm:flex">
            <span className="flex justify-between">
              <Skeleton className="h-6 w-9" />
              <Skeleton className="h-5 w-20" />
            </span>
            <span className="mt-4 flex items-center gap-3">
              <Skeleton className={rank === 1 ? "size-12 shrink-0" : "size-10 shrink-0"} />
              <span className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </span>
            </span>
            <Skeleton className="mt-5 h-7 w-24" />
            <Skeleton className="mt-3 h-1 w-full" />
          </div>
          <div className={`rounded-b-[14px] border-x border-b border-line sm:rounded-b-[var(--radius-card)] ${step}`} />
        </div>
      ))}
    </div>
  );
}

export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className={`${ROW_GRID} px-3`}>
          <Skeleton className="h-4 w-5" />
          <span className="flex min-h-14 items-center gap-3">
            <Skeleton className="size-8 shrink-0" />
            <span className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2.5 w-20" />
            </span>
          </span>
          <span className="hidden gap-2 md:flex">
            <Skeleton className="size-3.5" />
            <Skeleton className="size-3.5" />
          </span>
          <Skeleton className="hidden h-5 w-20 md:block" />
          <Skeleton className="hidden h-1 w-full md:block" />
          <Skeleton className="ml-auto h-4 w-16 md:w-28" />
        </li>
      ))}
    </ul>
  );
}

export function BoardSkeleton() {
  return (
    <div className="panel p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-52" />
        </span>
        <span className="flex gap-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-36" />
        </span>
      </div>
      <div className="mt-5">
        <TopThreeSkeleton />
      </div>
      <div className="mt-6">
        <RowsSkeleton />
      </div>
    </div>
  );
}
