"use client";

import { Button } from "@/components/ui/button";
import { useJoin } from "@/hooks/use-join";
import { cn } from "@/lib/utils";

export function JoinButton({ className }: { className?: string }) {
  const { join } = useJoin();
  return (
    <Button type="button" variant="primary" size="sm" className={cn(className)} onClick={() => void join()}>
      Join the list
    </Button>
  );
}
