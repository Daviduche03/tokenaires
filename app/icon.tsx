import { ImageResponse } from "next/og";
import { OG_COLORS, ogLogo } from "@/lib/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const logo = await ogLogo();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, background: OG_COLORS.background }}>
        <img src={logo} alt="" width={50} height={50} />
      </div>
    ),
    size,
  );
}
