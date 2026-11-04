"use client";

import { CheckReadIcon, LinkIcon } from "@solar-icons/react/linear";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/hooks/use-copy";
import { SITE } from "@/lib/constants";

export function ShareButton({ handle, className }: { handle: string; className?: string }) {
  const { copied, copy } = useCopy();
  const share = async () => {
    if (await copy(`${SITE.url}/u/${handle}`)) {
      toast.success("Profile link copied", { description: `Share @${handle}'s spot on the rich list.` });
    }
  };
  return (
    <Button size="sm" className={className} onClick={() => void share()}>
      {copied ? <CheckReadIcon className="size-3.5 text-accent" aria-hidden="true" /> : <LinkIcon className="size-3.5" aria-hidden="true" />}
      {copied ? "Link copied" : "Copy profile link"}
    </Button>
  );
}
