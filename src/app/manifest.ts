import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isTrackerHost } from "@/lib/brand";

/**
 * PWA manifest — the tracker suite installs as a standalone app
 * (personal.buildora.work on mobile home screens).
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  const trackerSurface =
    requestHeaders.get("x-product-surface") === "tracker" || isTrackerHost(host);

  if (!trackerSurface) {
    return {
      name: "Vamsi Krishna — Portfolio",
      short_name: "Vamsi",
      description:
        "Vamsi Krishna's personal portfolio — full stack engineering, product systems, and selected work.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#f4f1ea",
      theme_color: "#f4f1ea",
      icons: [{ src: "/icons/vk.svg", sizes: "any", type: "image/svg+xml" }],
    };
  }

  return {
    name: "NOVA",
    short_name: "NOVA",
    description:
      "NOVA by Buildora — a personal workspace for goals, habits, focus, and shared momentum.",
    start_url: "/hub",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#071014",
    theme_color: "#071014",
    categories: ["health", "fitness", "productivity", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
