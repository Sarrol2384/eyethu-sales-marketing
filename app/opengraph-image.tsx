import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Eyethu Property Group — Affordable homes in the Western Cape";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0c4a6e 0%, #155977 60%, #1e6e8a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 24,
            opacity: 0.85,
          }}
        >
          <span
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
              fontSize: 18,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Western Cape · South Africa
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Eyethu Property Group
          </div>
          <div
            style={{ fontSize: 32, opacity: 0.9, maxWidth: 880, lineHeight: 1.3 }}
          >
            Affordable homes for first-time buyers — including secure gated
            communities across the Cape.
          </div>
        </div>

        <div
          style={{ fontSize: 22, opacity: 0.75, letterSpacing: 1 }}
        >
          eyethu.example
        </div>
      </div>
    ),
    size,
  );
}
