import type { TrackerIconName } from "@/components/trackers/icons";

export type PersonalPrimaryId =
  | "tasks"
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
  | "study"
  | "plan"
  | "review";

export type PersonalNavItem = {
  id: PersonalPrimaryId;
  href: "/hub" | "/motivation" | "/log" | "/more" | string;
  label: string;
  short: string;
  icon: TrackerIconName;
};

export const PERSONAL_PRIMARY_NAV: readonly PersonalNavItem[] = [
  { id: "today", href: "/hub", label: "Today", short: "Today", icon: "hub" },
  { id: "plan", href: "/plan", label: "Plan", short: "Plan", icon: "todo" },
  {
    id: "health",
    href: "/health",
    label: "Health",
    short: "Health",
    icon: "scale",
  },
  {
    id: "review",
    href: "/review",
    label: "Review",
    short: "Review",
    icon: "log",
  },
  { id: "more", href: "/more", label: "More", short: "More", icon: "settings" },
];

export const PERSONAL_MORE_NAV: readonly PersonalNavItem[] = [
  { id: "tasks", href: "/todo", label: "Tasks", short: "Tasks", icon: "todo" },
  {
    id: "roadmap",
    href: "/roadmap",
    label: "100-Day Roadmap",
    short: "Roadmap",
    icon: "book",
  },
  { id: "goal", href: "/goal", label: "Goals", short: "Goals", icon: "flag" },
  {
    id: "health",
    href: "/weight-loss",
    label: "Health / Weight loss",
    short: "Health",
    icon: "scale",
  },
  {
    id: "fasting",
    href: "/intermittent-fasting",
    label: "Fasting",
    short: "Fast",
    icon: "timer",
  },
  {
    id: "workouts",
    href: "/workout-tracking",
    label: "Workouts",
    short: "Workouts",
    icon: "workout",
  },
  {
    id: "archive",
    href: "/archive",
    label: "Library",
    short: "Library",
    icon: "archive",
  },
  {
    id: "settings",
    href: "/settings",
    label: "Settings",
    short: "Settings",
    icon: "settings",
  },
];

export function isPersonalPrimaryPath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/hub") return pathname === "/trackers";
  const sections: Record<string, string[]> = {
    "/plan": ["/todo", "/goal", "/roadmap"],
    "/health": [
      "/food",
      "/routine",
      "/weight-loss",
      "/workout-tracking",
      "/intermittent-fasting",
    ],
    "/review": ["/log"],
    "/more": [
      "/motivation",
      "/archive",
      "/settings",
      "/share",
      "/shared-with-me",
    ],
  };
  return (sections[href] ?? []).some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
