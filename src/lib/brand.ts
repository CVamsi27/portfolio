export const TRACKER_BRAND = {
  name: "NOVA//OS",
  tagline: "Your next chapter, in motion.",
  description:
    "A personal operating system for goals, habits, focus, and shared momentum.",
  themeColor: "#071014",
  iconPath: "/icon.svg",
} as const;

export const PORTFOLIO_BRAND = {
  name: "Vamsi Krishna",
  title: "Vamsi Krishna | Full Stack Engineer",
  description:
    "Product-focused Full Stack Engineer with 5+ years of experience delivering production web applications with TypeScript, React, Node.js, NestJS, and PostgreSQL.",
} as const;

export function isTrackerHost(hostname: string): boolean {
  return hostname.startsWith("personal.");
}

export function getBrandForHost(hostname: string) {
  return isTrackerHost(hostname) ? TRACKER_BRAND : PORTFOLIO_BRAND;
}
