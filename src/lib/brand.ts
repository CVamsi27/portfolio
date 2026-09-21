export const TRACKER_BRAND = {
  name: "NOVA//OS",
  parentBrand: "Buildora",
  tagline: "Your next chapter, in motion.",
  description:
    "A personal operating system for goals, habits, focus, and shared momentum.",
  themeColor: "#071014",
  iconPath: "/icons/nova.svg",
} as const;

export const PORTFOLIO_BRAND = {
  siteName: "Buildora",
  personName: "Vamsi Krishna",
  name: "Vamsi Krishna",
  title: "Buildora — Vamsi Krishna | Full Stack Engineer",
  iconPath: "/icons/buildora.svg",
  description:
    "Product-focused Full Stack Engineer with 5+ years of experience delivering production web applications with TypeScript, React, Node.js, NestJS, and PostgreSQL.",
} as const;

export function isTrackerHost(hostname: string): boolean {
  return hostname.startsWith("personal.");
}

export function getBrandForHost(hostname: string) {
  return isTrackerHost(hostname) ? TRACKER_BRAND : PORTFOLIO_BRAND;
}
