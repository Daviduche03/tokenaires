import { Skeleton } from "@/components/ui/skeleton";
import { ROW_GRID } from "./rank-row";

export function TopThreeSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-panel-raised p-4">
          <span className="flex justify-between">
            <Skeleton className="h-6 w-9" />
            <Skeleton className="h-5 w-20" />
          </span>
          <span className="mt-4 flex items-center gap-3">
            <Skeleton className="size-10 shrink-0" />
            <span className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-16" />
            </span>
          </span>
          <Skeleton className="mt-5 h-7 w-24" />
          <Skeleton className="mt-3 h-1 w-full" />
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
    <div className="panel mt-6 p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-5 w-20" />
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
