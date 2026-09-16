import type { ReactNode } from "react";
import TrackerNav from "./TrackerNav";

export default function TrackerShell({
  icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon?: string;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <TrackerNav />
      <header className="mt-6 animate-slide-up">
        <div className="flex items-center gap-3.5">
          {icon ? (
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-500 text-2xl shadow-lg shadow-primary/25"
            >
              {icon}
            </span>
          ) : null}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Quick tracker
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
    </div>
  );
}
