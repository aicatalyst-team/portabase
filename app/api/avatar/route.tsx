import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const AVATAR_COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#e11d48",
  "#ea580c",
  "#d97706",
  "#059669",
  "#0891b2",
  "#52525b",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const initials = (searchParams.get("initials") ?? "?")
    .slice(0, 2)
    .toUpperCase();
  const color = searchParams.get("color") ?? AVATAR_COLORS[0];

  return new ImageResponse(
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: 28,
        fontWeight: 700,
        fontFamily: "sans-serif",
        letterSpacing: "-0.5px",
      }}
    >
      {initials}
    </div>,
    { width: 80, height: 80 },
  );
}
