"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PERSONAL_PRIMARY_NAV, isPersonalPrimaryPath } from "@/lib/personal-nav";
import { TrackerIcon } from "./icons";
import { cn } from "@/lib/utils";

/**
 * Mobile-only command dock for the tracker suite.
 * It keeps route semantics stable while making the active chapter explicit.
 */
export default function TrackerNavDock({ showDock = true }: { showDock?: boolean }) {
  const pathname = usePathname();
  if (!showDock) return null;

  return (
    <nav
      aria-label="Tracker navigation"
      data-testid="mobile-command-dock"
      data-dock-context="core"
      className="dossier-command-dock fixed inset-x-2 bottom-2 z-[70] sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-0.5">
        {PERSONAL_PRIMARY_NAV.map((l) => {
          const active = isPersonalPrimaryPath(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-label={l.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "dossier-command-link flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 transition-all",
                active ? "is-active" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TrackerIcon name={l.icon} className={cn("h-[18px] w-[18px]", active && "drop-shadow-[0_0_6px_rgba(201,255,79,0.6)]")} />
              <span className="w-full truncate text-center text-[9px] font-semibold leading-none">{l.short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
