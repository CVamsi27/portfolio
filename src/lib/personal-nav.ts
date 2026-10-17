import type { TrackerIconName } from "@/components/trackers/icons";

export type PersonalPrimaryId =
  | "tasks"
  | "today"
  | "focus"
  | "motivation"
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
  /** Directory copy for surfaces that list the destination (Tools). */
  description?: string;
};

export const PERSONAL_PRIMARY_NAV: readonly PersonalNavItem[] = [
  { id: "today", href: "/hub", label: "Today", short: "Today", icon: "hub" },
  { id: "plan", href: "/plan", label: "Plan", short: "Plan", icon: "todo" },
  {
    id: "roadmap",
    href: "/roadmap",
    label: "Roadmap",
    short: "Roadmap",
    icon: "book",
  },
  {
    id: "health",
    href: "/health",
    label: "Health",
    short: "Health",
    icon: "scale",
  },
  {
    id: "review",
    href: "/dashboard",
    label: "Progress",
    short: "Progress",
    icon: "log",
  },
];

export const PERSONAL_TOOLS_NAV: readonly PersonalNavItem[] = [
  {
    id: "motivation",
    href: "/motivation",
    label: "Motivation",
    short: "Motivation",
    icon: "flame",
    description: "Your purpose, reminders and next step.",
  },
  {
    id: "archive",
    href: "/archive",
    label: "Library",
    short: "Library",
    icon: "archive",
    description: "Your private notes, links and saved material.",
  },
  {
    id: "sharing",
    href: "/share",
    label: "Sharing",
    short: "Sharing",
    icon: "share",
    description: "Manage explicit sharing and its audience.",
  },
  {
    id: "settings",
    href: "/settings",
    label: "Settings",
    short: "Settings",
    icon: "settings",
    description: "Modules, optional protection, sync and data backup.",
  },
];

export function isPersonalToolPath(pathname: string, href: string): boolean {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/share" && pathname === "/shared-with-me")
  );
}

export function isPersonalPrimaryPath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/hub") return pathname === "/trackers";
  const sections: Record<string, string[]> = {
    "/plan": ["/todo", "/goal"],
    "/health": [
      "/food",
      "/routine",
      "/weight-loss",
      "/workout-tracking",
      "/intermittent-fasting",
    ],
    "/dashboard": ["/review", "/log"],
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
