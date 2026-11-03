import { Button } from "@/components/ui/button";

export function BoardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-10 text-center">
      <p className="text-base font-medium">The list did not load</p>
      <p className="mt-1.5 text-sm text-t3">Check your connection and try again.</p>
      <Button size="sm" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
