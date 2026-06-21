import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/lib/base-path";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Silverton Sweepstake",
    short_name: "Sweepstake",
    description: "Track the chaos, scores, sweepstake owners, and World Cup bragging rights.",
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#07111f",
    theme_color: "#07111f",
    icons: [
      {
        src: `${BASE_PATH}/icon-192`,
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: `${BASE_PATH}/icon-512`,
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: `${BASE_PATH}/icon-512`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
