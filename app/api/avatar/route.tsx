import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const AVATAR_COLORS = [
    "#4f46e5", // indigo
    "#7c3aed", // violet
    "#e11d48", // rose
    "#ea580c", // orange
    "#d97706", // amber
    "#059669", // emerald
    "#0891b2", // cyan
    "#52525b", // zinc
];

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const initials = (searchParams.get("initials") ?? "?").slice(0, 2).toUpperCase();
    const color = searchParams.get("color") ?? AVATAR_COLORS[0];

    return new ImageResponse(
        (
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
            </div>
        ),
        { width: 80, height: 80 }
    );
}
