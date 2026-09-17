import type { MetadataRoute } from "next";

/**
 * PWA manifest — the tracker suite installs as a standalone app
 * (personal.buildora.work on mobile home screens).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VK Personal Suite",
    short_name: "Personal Suite",
    description:
      "Local-first personal operating system: fasting, workouts, goals, todos, motivation and private sharing — with optional cloud sync.",
    start_url: "/trackers",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0c",
    theme_color: "#7c3aed",
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
