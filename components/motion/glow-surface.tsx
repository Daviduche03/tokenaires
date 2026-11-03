"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlowSurfaceProps {
  children: ReactNode;
  className?: string;
  radius?: number;
}

export function GlowSurface({ children, className, radius = 260 }: GlowSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const track = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${event.clientX - bounds.left}px`);
    ref.current.style.setProperty("--my", `${event.clientY - bounds.top}px`);
  }, []);
  return (
    <div
      ref={ref}
      onPointerMove={track}
      style={{ "--glow-radius": `${radius}px` } as React.CSSProperties}
      className={cn("glow-surface group/glow relative", className)}
    >
      {children}
      <span aria-hidden="true" className="glow-surface-fill" />
      <span aria-hidden="true" className="glow-surface-ring" />
    </div>
  );
}
