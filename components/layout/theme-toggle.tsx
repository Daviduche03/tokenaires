"use client";

import { MonitorIcon, MoonIcon, Sun2Icon } from "@solar-icons/react/linear";
import { useTheme } from "next-themes";
import { useSyncExternalStore, type MouseEvent } from "react";
import { flushSync } from "react-dom";

const MODES = [
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "light", label: "Light", Icon: Sun2Icon },
  { value: "system", label: "System", Icon: MonitorIcon },
] as const;

const REVEAL_MS = 450;

const subscribe = () => () => {};

function resolve(mode: (typeof MODES)[number]["value"]): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const index = Math.max(0, MODES.findIndex((mode) => mode.value === (mounted ? theme : "dark")));
  const current = MODES[index];
  const next = MODES[(index + 1) % MODES.length];

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const changes = resolve(next.value) !== resolve(current.value);
    if (!document.startViewTransition || reduce || !changes) {
      setTheme(next.value);
      return;
    }
    const x = event.clientX || window.innerWidth;
    const y = event.clientY || 0;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next.value));
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(resolve(next.value));
    });
    void transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: REVEAL_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Appearance: ${current.label}. Switch to ${next.label}`}
      title={`Appearance: ${current.label}`}
      className="touch-target inline-flex size-9 items-center justify-center rounded-full border border-line bg-panel text-t3 transition-colors duration-150 hover:border-line-strong hover:text-foreground"
    >
      <current.Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
