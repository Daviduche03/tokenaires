import Link from "next/link";
import { Suspense } from "react";
import { Board } from "@/components/board/board";
import { BoardSkeleton } from "@/components/board/board-skeleton";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { HeroStats } from "@/components/home/hero-stats";
import { InstallCommand } from "@/components/home/install-command";
import { TerminalDemo } from "@/components/home/terminal-demo";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <HeroBackdrop />
        <div className="page relative z-10 flex flex-col items-center pb-24 pt-16 text-center sm:pb-28 sm:pt-24">
          <h1 className="text-fade max-w-3xl text-[44px] font-[350] leading-[1.02] tracking-[-0.045em] sm:text-[76px]">
            The rich list for <span className="text-shine whitespace-nowrap">AI tokens</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-t3">
            Developers ranked by the tokens they burn in Claude Code and Codex. Sign in with GitHub, run one command, climb.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <InstallCommand id="join" />
            <Button asChild size="md">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
          <TerminalDemo className="mt-12 w-full max-w-xl" />
        </div>
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-arc" aria-hidden="true" />
      </section>
      <div className="page -mt-10 sm:-mt-12">
        <div className="relative z-10 mx-auto max-w-3xl">
          <HeroStats />
        </div>
        <Suspense fallback={<BoardSkeleton />}>
          <Board />
        </Suspense>
      </div>
    </>
  );
}
