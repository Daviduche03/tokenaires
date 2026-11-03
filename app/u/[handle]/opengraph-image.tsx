import { TIERS } from "@tokenaires/contracts";
import { ImageResponse } from "next/og";
import { getCachedProfile } from "@/lib/data/profile";
import { formatFull } from "@/lib/format";
import { OG_COLORS, OG_GLOW, OG_SIZE, ogFonts, ogLogo } from "@/lib/og";

export const alt = "Tokenaires profile";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [profile, fonts, logo] = await Promise.all([getCachedProfile(handle), ogFonts(), ogLogo()]);
  const name = profile?.user.name ?? profile?.user.handle ?? handle;
  const tier = TIERS.find((entry) => entry.id === profile?.tier)?.label ?? "";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: `${OG_GLOW}, ${OG_COLORS.background}`, color: OG_COLORS.foreground, fontFamily: "Aspekta" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 600, letterSpacing: -1 }}>
            <img src={logo} alt="" width={40} height={40} />
            tokenaires
          </div>
          {profile?.ranks.all && (
            <div style={{ display: "flex", padding: "10px 24px", borderRadius: 999, background: OG_COLORS.accent, color: OG_COLORS.accentInk, fontSize: 34, fontWeight: 600 }}>
              #{formatFull(profile.ranks.all)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {profile?.user.avatarUrl && (
            <img src={profile.user.avatarUrl} alt="" width={112} height={112} style={{ borderRadius: 999, border: `3px solid ${OG_COLORS.accent}` }} />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 60, fontWeight: 600, letterSpacing: -2 }}>{name}</span>
            <span style={{ fontSize: 26, color: OG_COLORS.muted, marginTop: 6 }}>@{profile?.user.handle ?? handle}{tier ? ` · ${tier}` : ""}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: 32, borderRadius: 28, border: `1px solid ${OG_COLORS.line}`, background: OG_COLORS.panel }}>
          <span style={{ fontSize: 24, color: OG_COLORS.muted }}>Net worth</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 6 }}>
            <span style={{ fontSize: 92, letterSpacing: -4, lineHeight: 1 }}>{profile ? formatFull(profile.totals.total) : "0"}</span>
            <span style={{ fontSize: 28, color: OG_COLORS.muted }}>tokens</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
