import Link from "next/link";
import { SiGithub } from "react-icons/si";
import { Wordmark } from "@/components/brand/wordmark";
import { SiteNav } from "@/components/layout/site-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/75 backdrop-blur-xl">
      <div className="page grid h-16 grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label="Tokenaires home" className="justify-self-start rounded-full">
          <Wordmark />
        </Link>
        <div className="hidden md:block">
          <SiteNav />
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          <a
            href={SITE.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source on GitHub"
            className="touch-target inline-flex size-9 items-center justify-center rounded-full border border-line bg-panel text-t3 transition-colors hover:border-line-strong hover:text-foreground"
          >
            <SiGithub className="size-4" aria-hidden="true" />
          </a>
          <ThemeToggle />
          <Button asChild variant="primary" size="sm" className="hidden sm:inline-flex">
            <Link href="/#join">Join the list</Link>
          </Button>
        </div>
      </div>
      <div className="page flex justify-center pb-3 md:hidden">
        <SiteNav />
      </div>
    </header>
  );
}
