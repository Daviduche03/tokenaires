import type { BoardEntry } from "@tokenaires/contracts";
import { ImageResponse } from "next/og";
import { getCachedLeaders } from "@/lib/data/board";
import { formatCompact, formatFull } from "@/lib/format";
import { OG_COLORS, OG_SIZE, ogFonts, ogLogo } from "@/lib/og";

const LADDER_GLOW = "radial-gradient(40% 60% at 76% 100%, rgba(190,242,100,0.22), rgba(190,242,100,0.05) 55%, transparent 80%)";

export const alt = "Tokenaires, the rich list for AI tokens";
export const size = OG_SIZE;
export const contentType = "image/png";

const LADDER = [
  { rank: 2, step: 92 },
  { rank: 1, step: 150 },
  { rank: 3, step: 56 },
] as const;

function Seat({ rank, step, entry }: { rank: number; step: number; entry: BoardEntry | undefined }) {
  const first = rank === 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 150 }}>
      {entry ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          {entry.user.avatarUrl ? (
            <img
              src={entry.user.avatarUrl}
              alt=""
              width={first ? 76 : 60}
              height={first ? 76 : 60}
              style={{ borderRadius: 999, border: `3px solid ${first ? OG_COLORS.accent : OG_COLORS.line}` }}
            />
          ) : (
            <div style={{ width: first ? 76 : 60, height: first ? 76 : 60, borderRadius: 999, background: OG_COLORS.panel, border: `3px solid ${OG_COLORS.line}` }} />
          )}
          <span style={{ marginTop: 10, fontSize: 22, fontWeight: 600, maxWidth: 150, overflow: "hidden" }}>@{entry.user.handle}</span>
          <span style={{ marginTop: 2, fontSize: 24, color: first ? OG_COLORS.accent : OG_COLORS.muted }}>{formatCompact(entry.tokens)}</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 999, border: `2px dashed ${OG_COLORS.line}` }} />
          <span style={{ marginTop: 10, fontSize: 20, color: OG_COLORS.muted }}>Open seat</span>
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: step,
          borderRadius: "18px 18px 0 0",
          border: `1px solid ${first ? "rgba(190,242,100,0.45)" : OG_COLORS.line}`,
          borderBottom: "none",
          background: first ? "linear-gradient(180deg, rgba(190,242,100,0.28), rgba(190,242,100,0.04))" : "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.01))",
          fontSize: first ? 56 : 40,
          color: first ? OG_COLORS.accent : OG_COLORS.muted,
        }}
      >
        {rank}
      </div>
    </div>
  );
}

export default async function Image() {
  const [fonts, logo, leaders] = await Promise.all([ogFonts(), ogLogo(), getCachedLeaders()]);
  const entries = leaders?.board.entries ?? [];
  const stats = leaders?.stats;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: `${LADDER_GLOW}, ${OG_COLORS.background}`, color: OG_COLORS.foreground, fontFamily: "Aspekta", padding: "64px 64px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 600, paddingBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>
            <img src={logo} alt="" width={44} height={44} />
            tokenaires
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 48, fontSize: 76, lineHeight: 1.02, letterSpacing: -3.5 }}>
            <span>The rich list for</span>
            <span style={{ color: OG_COLORS.accent }}>AI tokens</span>
          </div>
          <div style={{ display: "flex", marginTop: "auto", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", padding: "14px 24px", borderRadius: 999, border: `1px solid ${OG_COLORS.line}`, background: OG_COLORS.panel, fontSize: 26, color: OG_COLORS.foreground }}>
              <span style={{ color: OG_COLORS.accent }}>$&nbsp;</span>npx tokenaires
            </div>
            {stats && (
              <span style={{ fontSize: 22, color: OG_COLORS.muted }}>
                {formatFull(stats.developers)} {stats.developers === 1 ? "developer" : "developers"} · {formatCompact(stats.totalTokens)} tokens
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, flex: 1 }}>
          {LADDER.map(({ rank, step }) => (
            <Seat key={rank} rank={rank} step={step} entry={entries.find((entry) => entry.rank === rank)} />
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
