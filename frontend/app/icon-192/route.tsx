import { renderPwaIcon } from "@/lib/pwa-icon";

const imageSize = {
  width: 192,
  height: 192
};

export async function GET() {
  return renderPwaIcon(imageSize);
}
