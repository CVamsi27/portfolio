"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import {
  PERSONAL_PRIMARY_NAV,
  isPersonalPrimaryPath,
} from "@/lib/personal-nav";
import { TrackerIcon } from "./icons";
import { cn } from "@/lib/utils";

/**
 * Mobile-only command dock for the tracker suite.
 * It keeps route semantics stable while making the active chapter explicit.
 */
export default function TrackerNavDock({
  showDock = true,
}: {
  showDock?: boolean;
}) {
  const pathname = usePathname();
  if (!showDock) return null;

  return (
    <nav
      aria-label="Tracker navigation"
      data-testid="mobile-command-dock"
      data-dock-context="core"
      className="dossier-command-dock fixed inset-x-2 bottom-2.5 z-[70] lg:hidden rounded-2xl border border-border/80 bg-background/90 shadow-2xl backdrop-blur-xl"
      style={{
        paddingBottom: "calc(0.2rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex items-center justify-between gap-0 py-1">
        {PERSONAL_PRIMARY_NAV.map((l) => {
          const active = isPersonalPrimaryPath(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-label={l.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "dossier-command-link relative flex min-w-11 flex-1 flex-col items-center gap-1 rounded-xl px-0 min-h-12 py-2 transition-colors active:scale-95",
                l.id === "roadmap" && "min-w-16",
                l.id === "review" && "min-w-16",
                active
                  ? "is-active bg-primary/15 text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
              )}
            >
              <TrackerIcon
                name={l.icon}
                className={cn(
                  "h-[18px] w-[18px] transition-transform",
                  active && "scale-105",
                )}
              />
              <span
                data-dock-label
                className="w-full whitespace-nowrap text-center font-sans text-xs font-semibold leading-none tracking-tight normal-case"
              >
                {l.short}
              </span>
              {active ? (
                <span className="absolute -bottom-0.5 h-0.5 w-2.5 rounded-full bg-primary" />
              ) : null}
            </Link>
          );
        })}
        {/*
          Quick capture lives inside the dock so it stays reachable without
          floating over page controls. It is a button, not a destination link,
          so the dock keeps its five navigation targets.
        */}
        <button
          type="button"
          data-testid="dock-quick-add"
          aria-label="Quick add"
          title="Quick add"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("nova-open-quicksheet", {
                detail: { tab: "add" },
              }),
            )
          }
          className="ml-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
