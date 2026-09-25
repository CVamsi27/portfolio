"use client";

import WorldClockStrip from "./WorldClockStrip";
import { useNow } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";

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

/** SVG circular momentum arc — 56×56 viewport, r=24, circumference≈150.8. */
function MomentumRing({ percent }: { percent: number }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const safePercent = Math.max(0, Math.min(100, percent));
  const dashOffset = circ - (circ * safePercent) / 100;
  const allDone = safePercent >= 100;

  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      aria-label={`Momentum: ${safePercent}%`}
      role="img"
      className="shrink-0"
    >
      {/* Track */}
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="text-muted/30"
      />
      {/* Arc */}
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke={allDone ? "#c8ff3d" : "#32b8c8"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 28 28)"
        className="transition-[stroke-dashoffset,stroke] duration-700 motion-reduce:transition-none"
      />
      {/* Center percentage */}
      <text
        x="28"
        y="28"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="700"
        fontFamily="monospace"
        fill={allDone ? "#c8ff3d" : "#32b8c8"}
      >
        {safePercent}
      </text>
    </svg>
  );
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
  const allDone = momentumPercent >= 100;

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
        <div className="mt-2 flex items-center gap-3">
          <MomentumRing percent={momentumPercent} />
          <div className="min-w-0">
            <h1 className={cn(
              "font-display text-[clamp(1.7rem,7vw,3.8rem)] font-black leading-[0.9] tracking-[-0.06em] transition-colors duration-700",
              allDone ? "text-[#c8ff3d]" : "text-foreground",
            )}>
              {name ? `${greeting}, ${name}.` : "Make the next move."}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {tagline}{goalTitle ? ` ${goalTitle}` : ""}
            </p>
          </div>
        </div>
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
