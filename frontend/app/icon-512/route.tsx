import { renderPwaIcon } from "@/lib/pwa-icon";

const imageSize = {
  width: 512,
  height: 512
};

export async function GET() {
  return renderPwaIcon(imageSize);
}
