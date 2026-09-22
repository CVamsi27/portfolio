import type { MetadataRoute } from "next";

/**
 * PWA manifest — the tracker suite installs as a standalone app
 * (personal.buildora.work on mobile home screens).
 */
export default function manifest(): MetadataRoute.Manifest {
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
