import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 shrink-0" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-44" />
          <span className="flex gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </span>
        </div>
      </div>
      <div className="panel mt-8 p-5 sm:p-7">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-11 w-72 sm:h-14 sm:w-[30rem]" />
        <Skeleton className="mt-6 h-1.5 w-full" />
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-[var(--radius-card)] bg-panel-raised px-4 py-3">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="mt-2 h-5 w-10" />
            </div>
          ))}
        </div>
      </div>
      <div className="panel mt-3 p-5 sm:p-7">
        <Skeleton className="h-4 w-20" />
        <div className="mt-5 grid min-w-[560px] grid-flow-col grid-rows-7 gap-[3px] [grid-auto-columns:minmax(0,1fr)]">
          {Array.from({ length: 53 * 7 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-[3px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
