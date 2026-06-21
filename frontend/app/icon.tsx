import { renderPwaIcon } from "@/lib/pwa-icon";

export const contentType = "image/png";
export const size = {
  width: 32,
  height: 32
};

export default function Icon() {
  return renderPwaIcon(size);
}
