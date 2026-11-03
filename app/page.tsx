import Link from "next/link";
import { Suspense } from "react";
import { Board } from "@/components/board/board";
import { BoardSkeleton } from "@/components/board/board-skeleton";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { InstallCommand } from "@/components/home/install-command";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <HeroBackdrop />
        <div className="page relative z-10 flex flex-col items-center pb-14 pt-10 text-center sm:pb-16 sm:pt-14">
          <h1 className="text-fade max-w-3xl text-[38px] font-[350] leading-[1.02] tracking-[-0.045em] sm:text-[60px]">
            The rich list for <span className="text-shine whitespace-nowrap">AI tokens</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-t3 text-balance sm:text-[15px]">
            Developers ranked by the tokens they burn in Claude Code and Codex.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <InstallCommand id="join" />
            <Button asChild size="md">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
        <div className="hero-glow hero-glow-compact" aria-hidden="true" />
        <div className="hero-arc" aria-hidden="true" />
      </section>
      <div className="page">
        <Suspense fallback={<BoardSkeleton />}>
          <Board />
        </Suspense>
      </div>
    </>
  );
}
