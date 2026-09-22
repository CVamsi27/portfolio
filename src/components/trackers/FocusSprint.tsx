"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pause, Play, RotateCcw, Square, Timer, X, ShieldCheck } from "lucide-react";
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
  type FocusSessionMode,
} from "@/lib/focus-sprint";
import { enterFullscreen, exitFullscreen } from "@/lib/focus-mode";
import DevicePreparation from "./DevicePreparation";

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
  const [mode, setMode] = useState<FocusSessionMode>("timed");
  const [message, setMessage] = useState<string | null>(null);
  const now = useNow(1_000);
  const safeSessions = sessions ?? [];

  const finish = useCallback(() => {
    if (!active) return;
    const session = completeFocusSession(active, Date.now());
    setSessions((previous) => [session, ...(previous ?? [])].slice(0, MAX_SESSIONS));
    setActive(null);
    void exitFullscreen();
    document.documentElement.removeAttribute("data-focus-session");
    setMessage(`Focus sprint complete · ${session.durationMinutes} min saved`);
    onCompleted?.(session);
  }, [active, onCompleted, setActive, setSessions]);

  useEffect(() => {
    if (!active || active.mode === "open" || active.pausedAt !== undefined) return;
    const remaining = getFocusRemainingMs(active, now);
    const timeout = window.setTimeout(finish, Math.max(0, remaining));
    return () => window.clearTimeout(timeout);
  }, [active, finish, now]);

  useEffect(() => {
    if (!active) return;
    document.documentElement.dataset.focusSession = "active";
    const interrupt = () => setActive((previous) => previous ? { ...previous, interruptions: (previous.interruptions ?? 0) + 1 } : previous);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") interrupt();
    };
    const onFullscreen = () => {
      if (active.fullscreen && !document.fullscreenElement) interrupt();
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.documentElement.removeAttribute("data-focus-session");
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [active, setActive]);

  const start = async () => {
    setMessage(null);
    const fullscreen = await enterFullscreen(document.documentElement);
    setActive({
      id: `focus_${Date.now().toString(36)}`,
      label: label.trim() || "Focused work",
      mode,
      plannedMinutes: mode === "timed" ? plannedMinutes : undefined,
      startedAt: Date.now(),
      pausedMs: 0,
      interruptions: 0,
      fullscreen,
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
    void exitFullscreen();
    document.documentElement.removeAttribute("data-focus-session");
    setMessage("Focus sprint cancelled");
  };

  const isRunning = Boolean(active);
  const isPaused = active?.pausedAt !== undefined;
  const elapsed = active ? getFocusElapsedMs(active, now) : 0;
  const total = active?.mode === "open" ? 0 : (active?.plannedMinutes ?? plannedMinutes) * 60_000;
  const progress = total ? (elapsed / total) * 100 : 0;
  const storageError = activeStatus === "error" || sessionStatus === "error";

  return (
    <section
      data-testid="focus-sprint"
      data-focus-lock={isRunning ? "active" : "inactive"}
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
            {isRunning ? active?.mode === "open" ? "Stay with this move until you explicitly finish it." : "Stay with this move until the timer ends." : label.trim() ? `For: ${label}` : "A short, contained block of attention."}
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
            {active?.mode === "open" ? formatClock(elapsed) : formatClock(active ? getFocusRemainingMs(active, now) : 0)}
          </p>
          {active?.mode === "timed" ? <SignalRule className="mt-3" value={progress} label="Focus sprint progress" /> : <p className="mt-3 text-xs text-muted-foreground">Open session · your time is being recorded.</p>}
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
          <p data-testid="focus-interruptions" className="mt-3 text-[11px] text-muted-foreground">
            {active?.interruptions ?? 0} interruption{active?.interruptions === 1 ? "" : "s"} recorded
          </p>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border/60 p-1" role="group" aria-label="Focus session mode">
            <button type="button" aria-pressed={mode === "timed"} onClick={() => setMode("timed")} className={`rounded px-2.5 py-1.5 font-mono text-xs transition-colors ${mode === "timed" ? "bg-[#49E7FF] font-bold text-[#071014]" : "text-muted-foreground hover:text-foreground"}`}>Timed</button>
            <button type="button" aria-pressed={mode === "open"} onClick={() => setMode("open")} className={`rounded px-2.5 py-1.5 font-mono text-xs transition-colors ${mode === "open" ? "bg-[#49E7FF] font-bold text-[#071014]" : "text-muted-foreground hover:text-foreground"}`}>Open-ended</button>
          </div>
          {mode === "timed" ? (
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
          ) : null}
          <Button size="sm" onClick={start}>
            <Play className="mr-1.5 h-3.5 w-3.5" /> Start focus sprint
          </Button>
        </div>
      )}

      {!isRunning ? <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#49E7FF]" />Focus hides in-app navigation and warns if you leave the tab. Turn on Do Not Disturb and app limits from your device before starting.</p> : null}

      {!isRunning ? (
        <details className="mt-4 border-t border-border/60 pt-3">
          <summary className="cursor-pointer list-none text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">Prepare your device</summary>
          <div className="mt-3"><DevicePreparation compact /></div>
        </details>
      ) : null}

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
