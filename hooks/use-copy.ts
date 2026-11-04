"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { COPY_RESET_MS } from "@/lib/constants";

export function useCopy({ silent = false }: { silent?: boolean } = {}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPY_RESET_MS);
        return true;
      } catch {
        if (!silent) toast.error("Could not copy", { description: "Select the text and copy it yourself." });
        return false;
      }
    },
    [silent],
  );

  return { copied, copy };
}
