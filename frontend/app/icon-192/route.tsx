import { ImageResponse } from "next/og";
const imageSize = {
  width: 192,
  height: 192
};

function AppIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(160deg, #08101d 0%, #12345b 55%, #d2a93c 100%)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        position: "relative",
        width: "100%"
      }}
    >
      <div
        style={{
          border: "6px solid rgba(248, 250, 252, 0.85)",
          borderRadius: size * 0.18,
          display: "flex",
          fontSize: size * 0.28,
          fontStyle: "italic",
          fontWeight: 800,
          letterSpacing: "-0.08em",
          lineHeight: 1,
          padding: `${size * 0.08}px ${size * 0.12}px`,
          transform: "translateY(-8%)"
        }}
      >
        SS
      </div>
      <div
        style={{
          bottom: size * 0.14,
          display: "flex",
          fontSize: size * 0.09,
          fontWeight: 700,
          letterSpacing: "0.24em",
          opacity: 0.9,
          position: "absolute"
        }}
      >
        SWEEPSTAKE
      </div>
    </div>
  );
}

export async function GET() {
  return new ImageResponse(<AppIcon size={imageSize.width} />, imageSize);
}
