"use client";
import { useWorkSession } from "@/lib/work-session-store";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useDialogFocus } from "@/components/common/useDialogFocus";
import { useEffect, useState } from "react";
import { ArrowRight, Moon, ShieldAlert, Check } from "lucide-react";
import DevicePreparation from "./DevicePreparation";
import { useNow } from "@/lib/tracker-store";
import {
  formatLockEnd,
  isBedtimeLocked,
  nextBedtimeWindow,
} from "@/lib/lockdown";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useLockdownPreferences } from "@/lib/lockdown-store";
import {
  completeFocusSession,
  getFocusRemainingMs,
  type FocusActiveState,
  type FocusSession,
} from "@/lib/focus-sprint";

export default function LockdownGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { value: preferences } = useLockdownPreferences();
  const {
    focus: activeFocus,
    setFocus: setActiveFocus,
    study,
    setStudy,
  } = useWorkSession();
  const { setValue: setFocusSessions } = useSyncedStorage<FocusSession[]>(
    "focus:sessions",
    [],
  );
  const { value: manualBedtime, setValue: setManualBedtime } =
    useSyncedStorage<boolean>("bedtime:manual", false);
  const { value: bedtimeDismissedUntil, setValue: setBedtimeDismissedUntil } =
    useSyncedStorage<number>("bedtime:dismissed-until", 0);
  const [routineStep, setRoutineStep] = useState<Record<number, boolean>>({});
  const now = useNow(1_000);
  const bedtimeWindow = nextBedtimeWindow(preferences, new Date(now));
  const bedtimeLocked =
    (isBedtimeLocked(preferences, new Date(now)) &&
      now >= bedtimeDismissedUntil) ||
    Boolean(manualBedtime);
  const focusExpired = Boolean(
    activeFocus &&
      activeFocus.mode !== "open" &&
      activeFocus.pausedAt === undefined &&
      getFocusRemainingMs(activeFocus, now) <= 0,
  );
  const focusLocked = Boolean(activeFocus) && !focusExpired;

  useEffect(() => {
    if (!focusExpired || !activeFocus) return;
    const endedAt =
      activeFocus.startedAt +
      activeFocus.pausedMs +
      (activeFocus.plannedMinutes ?? 25) * 60_000;
    const session = completeFocusSession(activeFocus, endedAt);
    setFocusSessions((previous) =>
      (previous ?? []).some((item) => item.id === session.id)
        ? previous
        : [session, ...(previous ?? [])].slice(0, 100),
    );
    setActiveFocus((previous) =>
      previous?.id === activeFocus.id ? null : previous,
    );
    document.documentElement.removeAttribute("data-focus-session");
  }, [focusExpired, activeFocus, setActiveFocus, setFocusSessions]);

  const cancelFocus = () => {
    setActiveFocus(null);
    document.documentElement.removeAttribute("data-focus-session");
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => undefined);
  };

  useEffect(() => {
    const lock = bedtimeLocked ? "bedtime" : focusLocked ? "focus" : null;
    if (lock) document.documentElement.dataset.personalLock = lock;
    else document.documentElement.removeAttribute("data-personal-lock");
    return () => document.documentElement.removeAttribute("data-personal-lock");
  }, [bedtimeLocked, focusLocked]);

  const handleExitBedtime = () => {
    setBedtimeDismissedUntil(bedtimeWindow?.end.getTime() ?? now + 60 * 60_000);
    setManualBedtime(false);
  };

  const dialogRef = useDialogFocus(bedtimeLocked, handleExitBedtime);

  const toggleStep = (stepIdx: number) => {
    setRoutineStep((prev) => ({ ...prev, [stepIdx]: !prev[stepIdx] }));
  };

  return (
    <>
      {study && (
        <section
          data-testid="study-session-status"
          aria-label="Active study session"
          className="relative mb-4 rounded-xl border border-primary bg-card p-3 shadow-lg text-sm"
        >
          <p className="font-semibold break-words">
            {study.chapterTitle} ·{" "}
            {study.pausedAt === undefined ? "Study active" : "Study paused"}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Link
              className="inline-flex min-h-11 items-center px-3 text-primary underline"
              href="/roadmap"
            >
              Resume workspace
            </Link>
            <button
              className="min-h-11 rounded-lg border border-border px-3"
              aria-label={
                study.pausedAt === undefined
                  ? "Pause study session"
                  : "Resume study session"
              }
              onClick={() =>
                setStudy((previous) =>
                  !previous
                    ? previous
                    : previous.pausedAt === undefined
                      ? { ...previous, pausedAt: Date.now() }
                      : {
                          ...previous,
                          pausedMs:
                            previous.pausedMs +
                            Math.max(0, Date.now() - previous.pausedAt),
                          pausedAt: undefined,
                        },
                )
              }
            >
              {study.pausedAt === undefined ? "Pause" : "Resume"}
            </button>
            <button
              className="min-h-11 rounded-lg border border-border px-3"
              aria-label="Cancel study session"
              onClick={() => setStudy(null)}
            >
              Cancel study
            </button>
          </div>
        </section>
      )}
      {focusLocked ? (
        <div
          data-testid="focus-lock-status"
          role="status"
          className="relative mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-card px-3 py-2 text-xs text-foreground"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Focus is
            active. You can keep navigating.
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="shrink-0 font-mono text-primary">
              {activeFocus?.interruptions ?? 0} interruption
              {activeFocus?.interruptions === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={cancelFocus}
              aria-label="Cancel focus session"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Cancel focus
            </button>
          </div>
        </div>
      ) : null}
      {children}
      {bedtimeLocked && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={dialogRef}
              tabIndex={-1}
              data-testid="bedtime-lock-screen"
              role="dialog"
              aria-modal="true"
              aria-label="Bedtime mode"
              className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#05080c]/98 px-3 py-6 text-white backdrop-blur-xl sm:px-4 sm:py-8"
            >
              <div className="w-full max-w-2xl border border-indigo-500/40 bg-gradient-to-b from-[#0b121e] to-[#070b12] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] sm:p-8 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                      <Moon className="h-5 w-5 text-primary" aria-hidden />
                    </div>
                    <div>
                      <p className="dossier-kicker text-indigo-300">
                        Optional wind-down
                      </p>
                      <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-white">
                        The day is closed.
                      </h1>
                      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-300">
                        This quiet window ends at{" "}
                        {bedtimeWindow
                          ? formatLockEnd(bedtimeWindow.end)
                          : "your chosen time"}
                        . Rest is where adaptation compounds.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3-Step Evening Wind-Down Routine */}
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Evening Wind-Down Checklist
                  </p>
                  <div className="mt-3 space-y-2">
                    {[
                      "Tomorrow's #1 outcome is defined and locked.",
                      "Phone placed on charger across the room.",
                      "System Do Not Disturb / Sleep Focus active.",
                    ].map((item, idx) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleStep(idx)}
                        className="flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left text-xs transition-colors hover:border-white/15 hover:bg-white/5"
                      >
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-xs font-bold ${
                            routineStep[idx]
                              ? "border-primary bg-primary text-slate-900"
                              : "border-white/30 text-transparent"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span
                          className={
                            routineStep[idx]
                              ? "line-through text-slate-400"
                              : "text-slate-200"
                          }
                        >
                          {item}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wind-Down Breathing Pacer */}
                <div className="mt-5 flex items-center justify-between rounded-xl border border-indigo-500/25 bg-indigo-950/30 p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-8 w-8 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-25" />
                      <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-mono font-bold text-indigo-300">
                        4s
                      </span>
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-indigo-200">
                        Wind-Down Breathing Pacer
                      </p>
                      <p className="text-xs text-slate-400">
                        4-second rhythmic breathing to reset and downshift.
                      </p>
                    </div>
                  </div>
                  <span className="hidden font-mono text-xs uppercase tracking-wider text-indigo-300/80 sm:inline-block">
                    Inhale • Rest
                  </span>
                </div>

                <div
                  data-testid="lockdown-limitations"
                  className="mt-5 border border-[#ff554d]/30 bg-[#071014]/60 p-4 text-xs text-white/80 rounded-xl leading-relaxed"
                >
                  This is an optional rest screen. It cannot disable other phone
                  apps or enforce hardware DND. Use the device preparation steps
                  below if they help your routine.
                </div>

                <div className="mt-5">
                  <DevicePreparation compact />
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={handleExitBedtime}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
                  >
                    Exit bedtime lock
                  </button>
                  <Link
                    href="/routine"
                    onClick={handleExitBedtime}
                    className="inline-flex min-h-11 items-center text-sm text-primary underline"
                  >
                    Meal and supplement reminders
                  </Link>
                  <Link
                    href="/settings#bedtime"
                    onClick={handleExitBedtime}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white/80 hover:text-white transition-colors"
                  >
                    Review schedule <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
