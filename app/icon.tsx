import { ImageResponse } from "next/og";
import { OG_COLORS, ogFonts } from "@/lib/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const fonts = await ogFonts();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 18, background: OG_COLORS.accent, color: OG_COLORS.accentInk, fontFamily: "Aspekta", fontSize: 40, fontWeight: 600 }}>
        T
      </div>
    ),
    { ...size, fonts },
  );
}
