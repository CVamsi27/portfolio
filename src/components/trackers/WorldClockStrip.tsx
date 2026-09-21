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
  const local = CLOCKS[0];
  const remote = CLOCKS.slice(1);

  return (
    <div data-testid="world-clock-strip" data-editorial-telemetry className="dossier-world-clock" aria-label="World clocks">
      <details data-testid="clock-disclosure" className="dossier-clock-disclosure">
        <summary>
          <span className="dossier-world-date">{date}</span>
          <span className="dossier-world-time">
            <span>{local.label}</span>
            <strong className="tabular-nums">{now == null ? "--:--:--" : formatClock(now, local.timeZone)}</strong>
          </span>
          <span className="dossier-clock-summary-label">World clocks</span>
        </summary>
        <div className="dossier-clock-details">
          {remote.map((clock) => (
            <span key={clock.label} className="dossier-world-time">
              <span>{clock.label}</span>
              <strong className="tabular-nums">{now == null ? "--:--:--" : formatClock(now, clock.timeZone)}</strong>
            </span>
          ))}
          {badge ? <span className="dossier-world-status">{badge}</span> : null}
        </div>
      </details>
    </div>
  );
}
