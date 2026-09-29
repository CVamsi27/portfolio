import type { TrackerIconName } from "@/components/trackers/icons";

export type PersonalPrimaryId =
  | "today"
  | "focus"
  | "log"
  | "sharing"
  | "more"
  | "goal"
  | "health"
  | "fasting"
  | "workouts"
  | "archive"
  | "settings"
  | "roadmap"
  | "study";

export type PersonalNavItem = {
  id: PersonalPrimaryId;
  href: "/hub" | "/motivation" | "/log" | "/more" | string;
  label: string;
  short: string;
  icon: TrackerIconName;
};

export const PERSONAL_PRIMARY_NAV: readonly PersonalNavItem[] = [
  { id: "today", href: "/hub", label: "Today", short: "Today", icon: "hub" },
  { id: "focus", href: "/motivation", label: "Focus", short: "Focus", icon: "flame" },
  { id: "log", href: "/log", label: "Log", short: "Log", icon: "log" },
  { id: "sharing", href: "/share", label: "Sharing", short: "Share", icon: "share" },
  { id: "more", href: "/more", label: "More", short: "More", icon: "settings" },
] as const;

export const PERSONAL_MORE_NAV: readonly PersonalNavItem[] = [
  { id: "roadmap", href: "/roadmap", label: "100-Day Roadmap", short: "Roadmap", icon: "book" },
  { id: "goal", href: "/goal", label: "Goals", short: "Goals", icon: "flag" },
  { id: "health", href: "/weight-loss", label: "Health / Weight loss", short: "Health", icon: "scale" },
  { id: "fasting", href: "/intermittent-fasting", label: "Fasting", short: "Fast", icon: "timer" },
  { id: "workouts", href: "/workout-tracking", label: "Workouts", short: "Workouts", icon: "workout" },
  { id: "archive", href: "/archive", label: "Archive", short: "Archive", icon: "archive" },
  { id: "settings", href: "/settings", label: "Settings", short: "Settings", icon: "settings" },
];

export function isPersonalPrimaryPath(pathname: string, href: string): boolean {
  return pathname === href || (href === "/hub" && pathname === "/trackers");
}
