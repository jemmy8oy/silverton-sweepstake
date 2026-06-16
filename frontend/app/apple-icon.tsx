import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = {
  width: 180,
  height: 180
};

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(160deg, #08101d 0%, #12345b 55%, #d2a93c 100%)",
          color: "#f8fafc",
          display: "flex",
          fontSize: 72,
          fontStyle: "italic",
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-0.08em",
          width: "100%"
        }}
      >
        SS
      </div>
    ),
    size
  );
}
