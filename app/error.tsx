"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page flex max-w-3xl flex-col items-center pt-24 text-center">
      <h1 className="text-[36px] font-[350] leading-none tracking-[-0.04em]">Something went wrong</h1>
      <p className="mt-3 text-sm text-t3">The page could not load. Try again in a moment.</p>
      <Button size="sm" className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
