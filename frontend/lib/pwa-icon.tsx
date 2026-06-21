import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

const logoPath = path.join(process.cwd(), "app", "icon-512", "logo.jpeg");

async function readLogoDataUrl() {
  const buffer = await readFile(logoPath);
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

export async function renderPwaIcon(size: { width: number; height: number }) {
  const src = await readLogoDataUrl();

  return new ImageResponse(
    (
      <img
        src={src}
        alt="Silverton Sweepstake"
        width={size.width}
        height={size.height}
        style={{
          height: "100%",
          objectFit: "cover",
          width: "100%"
        }}
      />
    ),
    size
  );
}
