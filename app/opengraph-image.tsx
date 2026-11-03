import { ImageResponse } from "next/og";
import { OG_COLORS, OG_GLOW, OG_SIZE, ogFonts, ogLogo } from "@/lib/og";

export const alt = "Tokenaires, the rich list for AI tokens";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const [fonts, logo] = await Promise.all([ogFonts(), ogLogo()]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `${OG_GLOW}, ${OG_COLORS.background}`, color: OG_COLORS.foreground, fontFamily: "Aspekta" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>
          <img src={logo} alt="" width={46} height={46} />
          tokenaires
        </div>
        <div style={{ display: "flex", marginTop: 36, fontSize: 92, letterSpacing: -4 }}>
          <span>The rich list for&nbsp;</span>
          <span style={{ color: OG_COLORS.accent }}>AI tokens</span>
        </div>
        <div style={{ display: "flex", marginTop: 40, padding: "16px 28px", borderRadius: 999, border: `1px solid ${OG_COLORS.line}`, background: OG_COLORS.panel, fontSize: 28, color: OG_COLORS.muted }}>
          <span style={{ color: OG_COLORS.accent }}>$&nbsp;</span>npx tokenaires
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
