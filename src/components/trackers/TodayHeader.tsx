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

function formatClock(now: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

function getGreeting(now: number): string {
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Late night focus";
}

function getTagline(now: number, momentumPercent: number): string {
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 12) {
    return momentumPercent < 25 ? "One anchor at a time." : "Morning sequence in motion.";
  }
  if (hour >= 12 && hour < 17) {
    return momentumPercent >= 75 ? "Keep the sequence alive." : "Afternoon window is open.";
  }
  if (hour >= 17 && hour < 22) {
    return "Close the loop before midnight.";
  }
  return "Rest is the next move.";
}

export default function TodayHeader({
  name,
  goalTitle,
  momentumPercent = 0,
}: {
  name?: string;
  goalTitle: string;
  momentumPercent?: number;
}) {
  const now = useNow(1_000);
  const greeting = getGreeting(now);
  const tagline = getTagline(now, momentumPercent);

  return (
    <section data-testid="today-header" className="grid gap-3 border-b border-border/70 pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="dossier-kicker" data-editorial-kicker>Today // personal operating system</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff3d]" />
            Local-first
          </span>
        </div>
        <h1 className="mt-2 max-w-xl font-display text-[clamp(2.15rem,9vw,4.6rem)] font-black leading-[0.9] tracking-[-0.06em]">
          {name ? `${greeting}, ${name}.` : "Make the next move."}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {tagline}{goalTitle ? ` ${goalTitle}` : ""}
        </p>
      </div>
      <div className="sm:min-w-[18rem]">
        <div className="mb-1 flex items-baseline justify-end gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {formatDate(now)}
          </p>
          <p className="font-mono text-xs font-bold tabular-nums text-[#32b8c8]">
            {formatClock(now)}
          </p>
        </div>
        <WorldClockStrip />
      </div>
    </section>
  );
}
