import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { TrackerIcon, type TrackerIconName } from "./icons";
import TrackerNavDock from "./TrackerNavDock";

export default function TrackerShell({
  icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon?: TrackerIconName;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6 sm:pb-16">
      <header className="animate-slide-up">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/trackers"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Tracker Hub
          </Link>
          <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {today}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3.5">
          {icon ? (
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-500 shadow-lg shadow-primary/25"
            >
              <TrackerIcon name={icon} className="h-6 w-6 text-white" />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Personal Suite
            </p>
            <h1 className="font-display mt-0.5 text-3xl font-bold tracking-tight">
              {title}
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
        {badge ? <div className="mt-2.5">{badge}</div> : null}
      </header>
      <div className="mt-5 space-y-4">{children}</div>
      <TrackerNavDock />
    </div>
  );
}
