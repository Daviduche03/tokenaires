"use client";

import { CheckReadIcon, CopyIcon } from "@solar-icons/react/linear";
import { useCopy } from "@/hooks/use-copy";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function InstallCommand({ className, id }: { className?: string; id?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      id={id}
      type="button"
      onClick={() => void copy(SITE.installCommand)}
      aria-label={copied ? "Copied" : `Copy ${SITE.installCommand}`}
      className={cn(
        "group inline-flex h-11 scroll-mt-28 items-center gap-3 rounded-full border border-line-strong bg-panel pl-5 pr-1.5 transition-colors duration-150 hover:border-foreground/25",
        className,
      )}
    >
      <span className="font-mono text-[13px] text-foreground">
        <span className="select-none text-accent-text">$ </span>
        {SITE.installCommand}
      </span>
      <span
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full bg-foreground/[0.06] text-t3 transition-colors group-hover:text-foreground",
          copied && "bg-accent text-accent-ink group-hover:text-accent-ink",
        )}
      >
        {copied ? <CheckReadIcon className="size-4" aria-hidden="true" /> : <CopyIcon className="size-4" aria-hidden="true" />}
      </span>
    </button>
  );
}
