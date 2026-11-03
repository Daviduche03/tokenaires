"use client";

import { MonitorIcon, MoonIcon, Sun2Icon } from "@solar-icons/react/linear";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const MODES = [
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "light", label: "Light", Icon: Sun2Icon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
] as const;

const subscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const index = Math.max(0, MODES.findIndex((mode) => mode.value === (mounted ? theme : "system")));
  const current = MODES[index];
  const next = MODES[(index + 1) % MODES.length];
  return (
    <button
      type="button"
      onClick={() => setTheme(next.value)}
      aria-label={`Appearance: ${current.label}. Switch to ${next.label}`}
      title={`Appearance: ${current.label}`}
      className="touch-target inline-flex size-9 items-center justify-center rounded-full border border-line bg-panel text-t3 transition-colors duration-150 hover:border-line-strong hover:text-foreground"
    >
      <current.Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
