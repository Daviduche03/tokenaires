"use client";

import { CheckReadIcon, LinkIcon } from "@solar-icons/react/linear";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/hooks/use-copy";
import { SITE } from "@/lib/constants";

export function ShareButton({ handle, className }: { handle: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <Button size="sm" className={className} onClick={() => void copy(`${SITE.url}/u/${handle}`)}>
      {copied ? <CheckReadIcon className="size-3.5 text-accent" aria-hidden="true" /> : <LinkIcon className="size-3.5" aria-hidden="true" />}
      {copied ? "Link copied" : "Copy profile link"}
    </Button>
  );
}
