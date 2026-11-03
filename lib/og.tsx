import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_COLORS = {
  background: "#09090b",
  panel: "#111113",
  foreground: "#f5f5f4",
  muted: "#a1a1aa",
  line: "rgba(255,255,255,0.08)",
  accent: "#c8f169",
  accentInk: "#141a05",
} as const;

export const OG_GLOW = "radial-gradient(60% 55% at 50% 100%, rgba(200,241,105,0.22), rgba(200,241,105,0.05) 50%, transparent 78%)";

export async function ogFonts() {
  const read = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
  const [regular, semibold] = await Promise.all([read("Aspekta-400.ttf"), read("Aspekta-600.ttf")]);
  return [
    { name: "Aspekta", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Aspekta", data: semibold, weight: 600 as const, style: "normal" as const },
  ];
}
