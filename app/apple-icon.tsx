import { ImageResponse } from "next/og";
import { OG_COLORS, ogLogo } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const logo = await ogLogo();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: OG_COLORS.background }}>
        <img src={logo} alt="" width={132} height={132} />
      </div>
    ),
    size,
  );
}
