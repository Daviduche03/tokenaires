import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { SITE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="page flex flex-col gap-4 py-8 text-[13px] text-t3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Wordmark className="text-foreground" />
          <span>Totals come from local agent logs. Prompts and code never leave your machine.</span>
        </div>
        <span className="flex gap-5">
          <Link href="/how-it-works" className="hover:text-foreground">How it works</Link>
          <a href={SITE.repoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
        </span>
      </div>
    </footer>
  );
}
