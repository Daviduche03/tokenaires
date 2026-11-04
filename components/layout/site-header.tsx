import Link from "next/link";
import { RiStarFill } from "react-icons/ri";
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
          <Button asChild variant="outline" size="sm" className="group gap-1.5 pl-3 pr-3.5">
            <a href={SITE.repoUrl} target="_blank" rel="noopener noreferrer" aria-label="Star Tokenaires on GitHub">
              <SiGithub className="size-3.5" aria-hidden="true" />
              <span>Star</span>
              <RiStarFill
                className="size-3.5 text-accent-text transition-transform duration-200 ease-out group-hover:rotate-[72deg] group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                aria-hidden="true"
              />
            </a>
          </Button>
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
