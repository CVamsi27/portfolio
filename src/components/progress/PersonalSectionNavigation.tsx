"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isPersonalPrimaryPath } from "@/lib/personal-nav";
const groups = [
  {
    root: "/plan",
    name: "Planning sections",
    items: [
      ["/plan", "Focus"],
      ["/todo", "Tasks"],
      ["/goal", "Goals"],
      ["/roadmap", "Roadmap"],
    ],
  },
  {
    root: "/health",
    name: "Health sections",
    items: [
      ["/health", "Overview"],
      ["/food", "Food"],
      ["/workout-tracking", "Exercise"],
      ["/weight-loss", "Body"],
      ["/intermittent-fasting", "Water & fasting"],
      ["/routine", "Routine"],
    ],
  },
  {
    root: "/dashboard",
    name: "Progress sections navigation",
    items: [
      ["/dashboard", "Dashboard"],
      ["/review", "Detailed review"],
      ["/log", "Journal & capture"],
    ],
  },
  {
    root: "/more",
    name: "Supporting sections",
    items: [
      ["/more", "Overview"],
      ["/motivation", "Motivation"],
      ["/archive", "Library"],
      ["/share", "Sharing"],
      ["/shared-with-me", "Shared with me"],
      ["/settings", "Settings"],
    ],
  },
];
export default function PersonalSectionNavigation() {
  const pathname = usePathname();
  const group = groups.find((item) =>
    isPersonalPrimaryPath(pathname, item.root),
  );
  if (!group || pathname === group.root) return null;
  return (
    <nav aria-label={group.name} className="personal-section-tabs">
      {group.items.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
