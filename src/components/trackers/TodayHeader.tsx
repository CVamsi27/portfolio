"use client";

import WorldClockStrip from "./WorldClockStrip";
import { useNow } from "@/lib/tracker-store";

function formatDate(now: number) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
}

export default function TodayHeader({ name, goalTitle }: { name?: string; goalTitle: string }) {
  const now = useNow(1_000);

  return (
    <section data-testid="today-header" className="grid gap-3 border-b border-border/70 pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div>
        <p className="dossier-kicker" data-editorial-kicker>Today // personal operating system</p>
        <h1 className="mt-2 max-w-xl font-display text-[clamp(2.15rem,9vw,4.6rem)] font-black leading-[0.9] tracking-[-0.06em]">
          {name ? `Good morning, ${name}.` : "Make the next move."}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {goalTitle || "One useful move now. The rest can follow."}
        </p>
      </div>
      <div className="sm:min-w-[18rem]">
        <p className="mb-1 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
          {formatDate(now)}
        </p>
        <WorldClockStrip />
      </div>
    </section>
  );
}
