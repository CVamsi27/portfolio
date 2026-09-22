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

function formatTimeParts(now: number) {
  const d = new Date(now);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const dayMinutes = d.getHours() * 60 + d.getMinutes();
  const dayProgressPct = Math.round((dayMinutes / 1440) * 100);
  return { hours, minutes, seconds, dayProgressPct };
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
  const { hours, minutes, seconds, dayProgressPct } = formatTimeParts(now);

  return (
    <section data-testid="today-header" className="grid gap-4 border-b border-border/70 pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="dossier-kicker" data-editorial-kicker>Today // personal operating system</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em] text-muted-foreground shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff3d] animate-pulse" />
            Local-first
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/50 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
            <span className="text-[#32b8c8] font-bold tabular-nums">{dayProgressPct}%</span> of day elapsed
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
        <div className="mb-1.5 flex items-baseline justify-between gap-3 sm:justify-end">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {formatDate(now)}
          </p>
          <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#32b8c8] animate-ping" />
            <p className="font-mono text-xs font-bold tabular-nums text-foreground flex items-center">
              <span>{hours}</span>
              <span className="animate-pulse text-[#32b8c8] mx-0.5">:</span>
              <span>{minutes}</span>
              <span className="text-[10px] text-muted-foreground font-normal ml-1 tabular-nums">.{seconds}</span>
            </p>
          </div>
        </div>
        <WorldClockStrip />
      </div>
    </section>
  );
}
