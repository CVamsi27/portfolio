"use client";

import WorldClockStrip from "./WorldClockStrip";
import { useNow } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";

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
    return momentumPercent < 25
      ? "One anchor at a time."
      : "Morning sequence in motion.";
  }
  if (hour >= 12 && hour < 17) {
    return momentumPercent >= 75
      ? "Keep the sequence alive."
      : "Afternoon window is open.";
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
        className="text-border"
      />
      {/* Arc */}
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="var(--color-primary)"
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
        fontSize="14"
        fontWeight="700"
        fontFamily="monospace"
        fill="var(--color-primary)"
      >
        {safePercent}
      </text>
    </svg>
  );
}

export default function TodayHeader({
  name,
  goalTitle,
  momentumPercent,
}: {
  name?: string;
  goalTitle: string;
  momentumPercent?: number;
}) {
  const now = useNow(1_000);
  const greeting = getGreeting(now);
  const tagline = getTagline(now, momentumPercent ?? 0);
  const allDone = (momentumPercent ?? 0) >= 100;

  return (
    <section
      data-testid="today-header"
      className="grid gap-4 border-b border-border/70 pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p
            data-editorial-kicker
            className="text-sm font-medium text-muted-foreground"
          >
            Today
          </p>
        </div>
        <div className="mt-2 flex items-center gap-3">
          {momentumPercent !== undefined && (
            <MomentumRing percent={momentumPercent} />
          )}
          <div className="min-w-0">
            <h1
              className={cn(
                "font-display text-[clamp(1.6rem,5vw,2.8rem)] font-semibold leading-tight tracking-tight transition-colors duration-700",
                allDone ? "text-primary" : "text-foreground",
              )}
            >
              {name ? `${greeting}, ${name}.` : "Make the next move."}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {tagline}
              {goalTitle ? ` ${goalTitle}` : ""}
            </p>
          </div>
        </div>
      </div>
      <div className="sm:min-w-[18rem]">
        <WorldClockStrip />
      </div>
    </section>
  );
}
