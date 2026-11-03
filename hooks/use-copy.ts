"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { COPY_RESET_MS } from "@/lib/constants";

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      toast.error("Could not copy. Select the text and copy it yourself.");
    }
  }, []);

  return { copied, copy };
}
