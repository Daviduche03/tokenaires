"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { useState, type CSSProperties, type ReactNode } from "react";
import { CheckCircleIcon, DangerCircleIcon, InfoCircleIcon } from "@solar-icons/react/bold";
import { Toaster, type ToastClassnames } from "sonner";
import { CustomCursor } from "@/components/motion/custom-cursor";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QUERY_STALE_MS } from "@/lib/constants";

const TOASTER_STYLE = { "--width": "min(calc(100vw - 2rem), 25rem)" } as CSSProperties;

const TOAST_ICONS = {
  success: <CheckCircleIcon className="size-5 text-accent-text" aria-hidden="true" />,
  error: <DangerCircleIcon className="size-5 text-down" aria-hidden="true" />,
  info: <InfoCircleIcon className="size-5 text-accent-text" aria-hidden="true" />,
};

const TOAST_CLASSES: ToastClassnames = {
  toast:
    "flex w-full flex-wrap items-start gap-x-3 gap-y-2.5 rounded-2xl border border-line-strong bg-panel-raised/95 py-3 pl-3.5 pr-4 font-sans text-foreground shadow-[0_20px_50px_-16px_hsl(0_0%_0%/0.6)] backdrop-blur-xl",
  icon: "flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06]",
  success: "[&_[data-icon]]:bg-accent-soft",
  info: "[&_[data-icon]]:bg-accent-soft",
  error: "[&_[data-icon]]:bg-down/15",
  content: "flex min-w-0 flex-1 basis-[calc(100%-2.75rem)] flex-col gap-0.5 pt-1.5",
  title: "text-[13px] font-medium leading-5 tracking-[-0.01em]",
  description: "text-xs leading-[1.45] text-t3",
  actionButton:
    "ml-11 inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full bg-accent px-3.5 text-xs font-medium text-accent-ink transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
};

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: QUERY_STALE_MS, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem value={{ light: "light", dark: "dark" }} disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
      <QueryClientProvider client={client}>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster
            position="top-center"
            offset={{ top: 76 }}
            mobileOffset={{ top: 12, left: 16, right: 16 }}
            gap={10}
            style={TOASTER_STYLE}
            icons={TOAST_ICONS}
            toastOptions={{ unstyled: true, classNames: TOAST_CLASSES }}
          />
          <CustomCursor />
        </TooltipProvider>
      </QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
