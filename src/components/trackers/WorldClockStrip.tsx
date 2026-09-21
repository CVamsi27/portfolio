"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type Clock = { label: string; timeZone?: string };

const CLOCKS: Clock[] = [
  { label: "Local" },
  { label: "Munich", timeZone: "Europe/Berlin" },
  { label: "San Francisco", timeZone: "America/Los_Angeles" },
];

function formatClock(now: number, timeZone?: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).format(now);
}

/** A deliberately compact replacement for the former multi-row telemetry block. */
export default function WorldClockStrip({ badge }: { badge?: ReactNode }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const date = now == null ? "Today" : new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(now);

  return (
    <div data-testid="world-clock-strip" data-editorial-telemetry className="dossier-world-clock" aria-label="World clocks">
      <span className="dossier-world-date">{date}</span>
      {CLOCKS.map((clock) => (
        <span key={clock.label} className="dossier-world-time">
          <span>{clock.label}</span>
          <strong className="tabular-nums">{now == null ? "--:--:--" : formatClock(now, clock.timeZone)}</strong>
        </span>
      ))}
      {badge ? <span className="dossier-world-status">{badge}</span> : null}
    </div>
  );
}
