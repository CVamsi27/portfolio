export const TRACKER_BRAND = {
  name: "NOVA",
  parentBrand: "Buildora",
  tagline: "Your next chapter, in motion.",
  description:
    "A personal workspace for goals, habits, focus, and shared momentum.",
  themeColor: "#071014",
  iconPath: "/icons/nova.svg",
} as const;

export const PORTFOLIO_BRAND = {
  siteName: "Vamsi Krishna",
  personName: "Vamsi Krishna Chandaluri",
  name: "Vamsi Krishna",
  title: "Vamsi Krishna — Portfolio | Full Stack Engineer",
  iconPath: "/icons/vk.svg",
  ogImagePath: "/portfolio-og.png",
  description:
    "Full Stack Engineer building reliable, thoughtful software with TypeScript, React, Node.js, NestJS, and PostgreSQL.",
} as const;

export function isTrackerHost(hostname: string): boolean {
  return hostname.startsWith("personal.");
}

export function getBrandForHost(hostname: string) {
  return isTrackerHost(hostname) ? TRACKER_BRAND : PORTFOLIO_BRAND;
}
