"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Clock = { label: string; timeZone: string };
const CLOCKS: Clock[] = [
  { label: "Munich", timeZone: "Europe/Berlin" },
  { label: "San Francisco", timeZone: "America/Los_Angeles" },
];

function clockTime(now: number, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(now);
}
function clockDate(now: number, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(now);
}
function clockZone(now: number, timeZone: string) {
  return (
    new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? timeZone
  );
}

/** Minute precision avoids a constantly ticking header; every city keeps its own date. */
export default function WorldClockStrip({ badge }: { badge?: ReactNode }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 60_000) * 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const localZone =
    now == null ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localTime = now == null ? "--:--" : clockTime(now, localZone);
  const localDate = now == null ? "Your date" : clockDate(now, localZone);
  const localOffset =
    now == null ? "Device timezone" : clockZone(now, localZone);
  const timestamp = now == null ? undefined : new Date(now).toISOString();

  return (
    <div
      data-testid="world-clock-strip"
      data-editorial-telemetry
      role="group"
      aria-label="World clocks"
      className="dossier-world-clock"
    >
      <details
        data-testid="clock-disclosure"
        className="dossier-clock-disclosure"
      >
        <summary>
          <span className="clock-local-copy">
            <span className="dossier-world-date">{localDate}</span>
            <span
              className="clock-local-zone"
              data-testid="local-clock-zone"
              title={localZone}
            >
              Your time · {localOffset}
            </span>
          </span>
          <span className="clock-local-value">
            <time data-testid="local-clock-time" dateTime={timestamp}>
              {localTime}
            </time>
            <span className="dossier-clock-summary-label">
              World clocks{" "}
              <ChevronDown aria-hidden className="clock-chevron h-3.5 w-3.5" />
            </span>
          </span>
        </summary>
        <div className="dossier-clock-details">
          {CLOCKS.map((clock) => (
            <div
              key={clock.label}
              data-testid={`clock-${clock.label}`}
              className="clock-city-row"
            >
              <div className="min-w-0">
                <span className="clock-city-name">{clock.label}</span>
                <span className="clock-city-meta" title={clock.timeZone}>
                  {now == null
                    ? "Loading time…"
                    : `${clockDate(now, clock.timeZone)} · ${clockZone(now, clock.timeZone)}`}
                </span>
              </div>
              <time dateTime={timestamp}>
                {now == null ? "--:--" : clockTime(now, clock.timeZone)}
              </time>
            </div>
          ))}
          {badge ? <div className="dossier-world-status">{badge}</div> : null}
        </div>
      </details>
    </div>
  );
}
