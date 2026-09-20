"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pause, Play, RotateCcw, Square, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SignalRule from "@/components/editorial/SignalRule";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useNow } from "@/lib/tracker-store";
import {
  FOCUS_PRESETS,
  completeFocusSession,
  getFocusElapsedMs,
  getFocusRemainingMs,
  type FocusActiveState,
  type FocusMinutes,
  type FocusSession,
} from "@/lib/focus-sprint";

const MAX_SESSIONS = 100;

function formatClock(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function FocusSprint({
  label,
  compact = false,
  onCompleted,
}: {
  label: string;
  compact?: boolean;
  onCompleted?: (session: FocusSession) => void;
}) {
  const { value: active, setValue: setActive, status: activeStatus } = useSyncedStorage<FocusActiveState | null>("focus:active", null);
  const { value: sessions, setValue: setSessions, status: sessionStatus } = useSyncedStorage<FocusSession[]>("focus:sessions", []);
  const [plannedMinutes, setPlannedMinutes] = useState<FocusMinutes>(25);
  const [message, setMessage] = useState<string | null>(null);
  const now = useNow(1_000);
  const safeSessions = sessions ?? [];

  const finish = useCallback(() => {
    if (!active) return;
    const session = completeFocusSession(active, Date.now());
    setSessions((previous) => [session, ...(previous ?? [])].slice(0, MAX_SESSIONS));
    setActive(null);
    setMessage(`Focus sprint complete · ${session.durationMinutes} min saved`);
    onCompleted?.(session);
  }, [active, onCompleted, setActive, setSessions]);

  useEffect(() => {
    if (active && active.pausedAt === undefined && getFocusRemainingMs(active, now) <= 0) finish();
  }, [active, finish, now]);

  const start = () => {
    setMessage(null);
    setActive({
      id: `focus_${Date.now().toString(36)}`,
      label: label.trim() || "Focused work",
      plannedMinutes,
      startedAt: Date.now(),
      pausedMs: 0,
    });
  };

  const pause = () => {
    if (!active || active.pausedAt !== undefined) return;
    setActive({ ...active, pausedAt: Date.now() });
  };

  const resume = () => {
    if (!active?.pausedAt) return;
    const resumedAt = Date.now();
    setActive({
      ...active,
      pausedAt: undefined,
      pausedMs: active.pausedMs + resumedAt - active.pausedAt,
    });
  };

  const cancel = () => {
    setActive(null);
    setMessage("Focus sprint cancelled");
  };

  const isRunning = Boolean(active);
  const isPaused = active?.pausedAt !== undefined;
  const elapsed = active ? getFocusElapsedMs(active, now) : 0;
  const total = active ? active.plannedMinutes * 60_000 : plannedMinutes * 60_000;
  const progress = total ? (elapsed / total) * 100 : 0;
  const storageError = activeStatus === "error" || sessionStatus === "error";

  return (
    <section
      data-testid="focus-sprint"
      className={compact ? "dossier-panel dossier-focus-sprint" : "dossier-panel dossier-focus-sprint"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="dossier-kicker">Focus sprint // one move</p>
          <h2 className="mt-1 flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
            <Timer className="h-4 w-4 text-[#49E7FF]" aria-hidden />
            {active?.label ?? "Make room for the next move"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isRunning ? "Stay with this move until the timer ends." : "A short, contained block of attention."}
          </p>
        </div>
        {isRunning ? (
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#49E7FF]">
            {isPaused ? "Paused" : "In progress"}
          </span>
        ) : null}
      </div>

      {isRunning ? (
        <div className="mt-5">
          <p className="font-display text-5xl font-black tabular-nums tracking-tight" aria-live="polite">
            {formatClock(active ? getFocusRemainingMs(active, now) : 0)}
          </p>
          <SignalRule className="mt-3" value={progress} label="Focus sprint progress" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={isPaused ? resume : pause}>
              {isPaused ? <Play className="mr-1.5 h-3.5 w-3.5" /> : <Pause className="mr-1.5 h-3.5 w-3.5" />}
              {isPaused ? "Resume sprint" : "Pause sprint"}
            </Button>
            <Button size="sm" variant="outline" onClick={finish}>
              <Check className="mr-1.5 h-3.5 w-3.5" /> Finish sprint
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border/60 p-1" role="group" aria-label="Focus sprint length">
            {FOCUS_PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                type="button"
                aria-pressed={plannedMinutes === preset.minutes}
                onClick={() => setPlannedMinutes(preset.minutes)}
                className={`rounded px-2.5 py-1.5 font-mono text-xs transition-colors ${
                  plannedMinutes === preset.minutes ? "bg-[#C8FF3D] font-bold text-[#071014]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={start}>
            <Play className="mr-1.5 h-3.5 w-3.5" /> Start focus sprint
          </Button>
        </div>
      )}

      {message ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-500" role="status">
          {message.includes("complete") ? <Check className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
          {message}
        </p>
      ) : null}
      {storageError ? <p className="mt-3 text-xs text-amber-500">Not saved yet — keep this tab open and retry after sync returns.</p> : null}
      {!isRunning && safeSessions.length > 0 ? (
        <p className="mt-3 text-[11px] text-muted-foreground">{safeSessions.length} focus block{safeSessions.length === 1 ? "" : "s"} recorded</p>
      ) : null}
      <span className="sr-only"><Square aria-hidden /> Focus sprint controls</span>
    </section>
  );
}
