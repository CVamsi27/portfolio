"use client";

import { useEffect, useMemo } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import Stat from "@/components/trackers/Stat";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { SyncBadge } from "@/components/auth/AuthButton";
import {
  FASTING_PROTOCOLS,
  fastingStage,
  formatHMS,
} from "@/lib/trackers";
import { cn } from "@/lib/utils";

type FastState = {
  protocolId: string;
  phase: "fasting" | "eating";
  elapsedSec: number;
  running: boolean;
  lastTickAt: number | null;
};

const DEFAULTS: FastState = {
  protocolId: "16-8",
  phase: "fasting",
  elapsedSec: 5.2 * 3600,
  running: false,
  lastTickAt: null,
};

type HistoryEntry = { date: string; hours: number; protocol: string };

const R = 84;
const CIRC = 2 * Math.PI * R;

export default function FastingPage() {
  const { value: st, setValue: setSt, status } = useSyncedStorage<FastState>(
    "fasting",
    DEFAULTS,
  );
  const { value: history, setValue: setHistory } = useSyncedStorage<
    HistoryEntry[]
  >("fasting:history", []);
  // Single 1s ticker, drift-resistant: each tick banks real wall-clock
  // delta from lastTickAt (no now-state ping-pong, no second effect).
  useEffect(() => {
    if (!st.running) return;
    const id = window.setInterval(() => {
      const at = Date.now();
      setSt((prev) => {
        if (!prev.running) return prev;
        const base = prev.lastTickAt ?? at;
        return {
          ...prev,
          elapsedSec: prev.elapsedSec + Math.max(0, Math.floor((at - base) / 1000)),
          lastTickAt: at,
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.running]);

  const protocol =
    FASTING_PROTOCOLS.find((p) => p.id === st.protocolId) ??
    FASTING_PROTOCOLS[1];
  const targetSec = protocol.fastHours * 3600;
  const clamped = Math.min(st.elapsedSec, targetSec);
  const pct = targetSec === 0 ? 0 : (clamped / targetSec) * 100;
  const remaining = Math.max(0, targetSec - st.elapsedSec);
  const stage = fastingStage(pct);
  const complete = st.elapsedSec >= targetSec;

  const weekTotal = useMemo(
    () => history.slice(-7).reduce((a, h) => a + h.hours, 0),
    [history],
  );

  const toggleRun = () =>
    setSt({
      ...st,
      running: !st.running,
      lastTickAt: !st.running ? Date.now() : null,
    });

  const reset = () =>
    setSt({ ...st, elapsedSec: 0, running: false, lastTickAt: null });

  const switchPhase = () => {
    if (st.phase === "fasting" && complete) {
      setHistory([
        ...history,
        {
          date: new Date().toISOString().slice(0, 10),
          hours: protocol.fastHours,
          protocol: protocol.label,
        },
      ]);
    }
    setSt({
      ...st,
      phase: st.phase === "fasting" ? "eating" : "fasting",
      elapsedSec: 0,
      running: true,
      lastTickAt: Date.now(),
    });
  };

  return (
    <RequireAuth>
    <TrackerShell
      icon="⏱"
      title="Intermittent Fasting"
      subtitle="One-glance fast timer. Pick a protocol, start the clock, scrub the timeline — everything persists in localStorage."
      badge={<SyncBadge status={status} />}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
            <div className="text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Target Plan
              </p>
              <p className="mt-1 text-sm font-medium">
                {protocol.fastHours}h Fast / {24 - protocol.fastHours}h Eat
              </p>
              <p className="mt-1 max-w-[180px] text-xs text-muted-foreground">
                {protocol.blurb}
              </p>
            </div>

            {/* progress ring */}
            <div className="relative h-[220px] w-[220px]">
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
                <circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="none"
                  strokeWidth="12"
                  className="stroke-muted"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  stroke="url(#fastGrad)"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC - (CIRC * pct) / 100}
                  className="transition-[stroke-dashoffset] duration-500"
                />
                <defs>
                  <linearGradient id="fastGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {st.phase}
                </span>
                <span className="font-display text-3xl font-bold tabular-nums">
                  {formatHMS(st.elapsedSec)}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {pct.toFixed(0)}% complete
                </span>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <p className="text-sm font-semibold text-blue-500">{stage.title}</p>
              <p className="mt-1 max-w-[190px] text-xs leading-relaxed text-muted-foreground">
                {stage.desc}
              </p>
            </div>
          </div>

          {/* stats row */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            <Stat label="Elapsed" value={`${(st.elapsedSec / 3600).toFixed(1)} hrs`} />
            <Stat label="Remaining" value={`${(remaining / 3600).toFixed(1)} hrs`} />
            <Stat label="Window" value={`${protocol.fastHours}:${24 - protocol.fastHours}`} accent />
          </div>

          {/* controls */}
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium">Fasting Protocol</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {FASTING_PROTOCOLS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSt({ ...st, protocolId: p.id })}
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-left text-sm transition-all",
                      p.id === protocol.id
                        ? "border-primary bg-primary/10 font-semibold"
                        : "border-border/60 hover:bg-accent",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Current Interval State</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button onClick={toggleRun} variant={st.running ? "secondary" : "default"} className="flex-1">
                  {st.running ? "Pause" : "Start Fast"}
                </Button>
                <Button onClick={reset} variant="outline">
                  Reset
                </Button>
              </div>
              <Button onClick={switchPhase} className="mt-2 w-full bg-blue-600 hover:bg-blue-600/90">
                Switch to {st.phase === "fasting" ? "Eating Window" : "Fasting"}
              </Button>
              {complete && st.phase === "fasting" && (
                <p className="mt-2 text-center text-sm font-semibold text-emerald-500">
                  Window complete — nice work. Switch to eating.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Scrub Window Timeline</label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {(st.elapsedSec / 3600).toFixed(1)}h / {protocol.fastHours}h
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={targetSec}
                step={60}
                value={clamped}
                onChange={(e) =>
                  setSt({ ...st, elapsedSec: Number(e.target.value) })
                }
                className="mt-2 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Recent fasts</h2>
            <span className="text-xs text-muted-foreground">
              Last 7: {weekTotal.toFixed(0)}h total
            </span>
          </div>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No completed fasts yet — finish a window and it lands here.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {history.slice(-7).reverse().map((h, i) => (
                <li
                  key={`${h.date}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="font-medium tabular-nums">{h.date}</span>
                  <span className="text-muted-foreground">
                    {h.hours}h · {h.protocol}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </TrackerShell>
    </RequireAuth>
  );
}
