"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TRACKER_LINKS } from "@/lib/trackers";
import AuthButton from "@/components/auth/AuthButton";

export default function TrackerNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-16 z-40 -mx-1 flex flex-wrap items-center justify-between gap-2 bg-background/85 px-1 py-2 backdrop-blur-md">
      <nav
        aria-label="Trackers"
        className="flex flex-wrap items-center gap-1 rounded-2xl border border-border/60 bg-card/90 p-1.5 shadow-sm backdrop-blur"
      >
        {TRACKER_LINKS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "rounded-xl px-3 py-1.5 text-[13px] font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <AuthButton />
    </div>
  );
}
