"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TRACKER_LINKS } from "@/lib/trackers";
import { TrackerIcon, type TrackerIconName } from "./icons";
import { cn } from "@/lib/utils";

/**
 * Mobile-only floating bottom dock for the tracker suite.
 * Glassmorphic pill bar; hides on scroll-down, reveals on scroll-up.
 */
export default function TrackerNavDock() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      // Only react to meaningful scroll, keep visible near the top.
      if (Math.abs(delta) > 8) {
        setHidden(delta > 0 && y > 120);
        lastY.current = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Filter: fasting link hidden when fasting is disabled is handled by pages
  // via prefs; the dock shows the core suite regardless (fasting page itself
  // communicates the protocol). Shared-with-me lives under the share entry.
  const links = TRACKER_LINKS.filter((l) => l.href !== "/shared-with-me");

  return (
    <nav
      aria-label="Tracker navigation"
      className={cn(
        "fixed inset-x-2 bottom-2 z-[70] transition-transform duration-300 sm:hidden",
        hidden ? "pointer-events-none translate-y-[130%]" : "translate-y-0",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-0.5 rounded-2xl border border-border/60 bg-card/85 p-1.5 shadow-xl shadow-black/10 backdrop-blur-md">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-label={l.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition-all",
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TrackerIcon name={l.icon as TrackerIconName} className={cn("h-[18px] w-[18px]", active && "drop-shadow-[0_0_6px_hsl(262_83%_58%/0.6)]")} />
              <span className="w-full truncate text-center text-[9px] font-semibold leading-none">{l.short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
