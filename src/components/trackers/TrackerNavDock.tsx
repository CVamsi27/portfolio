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
      className="dossier-command-dock fixed inset-x-2.5 bottom-2.5 z-[70] sm:hidden rounded-2xl border border-border/80 bg-background/90 shadow-2xl backdrop-blur-xl"
      style={{ paddingBottom: "calc(0.2rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center justify-between gap-1 px-1 py-1">
        {PERSONAL_PRIMARY_NAV.map((l) => {
          const active = isPersonalPrimaryPath(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-label={l.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "dossier-command-link relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-all active:scale-95",
                active
                  ? "is-active bg-[#c9ff4f]/15 text-[#c9ff4f] font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
              )}
            >
              <TrackerIcon name={l.icon} className={cn("h-[18px] w-[18px] transition-transform", active && "scale-105 drop-shadow-[0_0_8px_rgba(201,255,79,0.65)]")} />
              <span className="w-full truncate text-center text-[9px] font-semibold leading-none tracking-tight">{l.short}</span>
              {active ? (
                <span className="absolute -bottom-0.5 h-0.5 w-2.5 rounded-full bg-[#c9ff4f]" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
