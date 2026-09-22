"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Moon, ShieldAlert } from "lucide-react";
import DevicePreparation from "./DevicePreparation";
import { useNow } from "@/lib/tracker-store";
import {
  formatLockEnd,
  isBedtimeLocked,
  nextBedtimeWindow,
} from "@/lib/lockdown";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useLockdownPreferences } from "@/lib/lockdown-store";
import type { FocusActiveState } from "@/lib/focus-sprint";

export default function LockdownGate({ children }: { children: React.ReactNode }) {
  const { value: preferences } = useLockdownPreferences();
  const { value: activeFocus, setValue: setActiveFocus } = useSyncedStorage<FocusActiveState | null>("focus:active", null);
  const { value: manualBedtime, setValue: setManualBedtime } = useSyncedStorage<boolean>("bedtime:manual", false);
  const [bedtimeDismissed, setBedtimeDismissed] = useState(false);
  const [routineStep, setRoutineStep] = useState<Record<number, boolean>>({});
  const now = useNow(1_000);
  const bedtimeWindow = nextBedtimeWindow(preferences, new Date(now));
  const bedtimeLocked = (isBedtimeLocked(preferences, new Date(now)) && !bedtimeDismissed) || Boolean(manualBedtime);
  const focusLocked = Boolean(activeFocus);

  useEffect(() => {
    const lock = bedtimeLocked ? "bedtime" : focusLocked ? "focus" : null;
    if (lock) document.documentElement.dataset.personalLock = lock;
    else document.documentElement.removeAttribute("data-personal-lock");
    return () => document.documentElement.removeAttribute("data-personal-lock");
  }, [bedtimeLocked, focusLocked]);

  useEffect(() => {
    if (!focusLocked) return;
    const onLinkClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!anchor || !anchor.getAttribute("href")?.startsWith("/")) return;
      event.preventDefault();
      event.stopPropagation();
      setActiveFocus((previous) => previous ? { ...previous, interruptions: (previous.interruptions ?? 0) + 1 } : previous);
    };
    document.addEventListener("click", onLinkClick, true);
    return () => document.removeEventListener("click", onLinkClick, true);
  }, [focusLocked, setActiveFocus]);

  const handleExitBedtime = () => {
    setBedtimeDismissed(true);
    setManualBedtime(false);
  };

  const toggleStep = (stepIdx: number) => {
    setRoutineStep((prev) => ({ ...prev, [stepIdx]: !prev[stepIdx] }));
  };

  return (
    <>
      {children}
      {focusLocked ? (
        <div data-testid="focus-lock-status" className="fixed inset-x-3 top-[4.5rem] z-[80] mx-auto flex max-w-xl items-center justify-between gap-3 border border-[#49e7ff]/40 bg-[#071014]/95 px-3 py-2 text-xs text-white shadow-lg backdrop-blur sm:inset-x-auto sm:right-4 sm:top-20 sm:w-auto">
          <span className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5 text-[#49e7ff]" /> Focus is active. Finish or cancel before navigating.</span>
          <span className="shrink-0 font-mono text-[#49e7ff]">{activeFocus?.interruptions ?? 0} interruption{activeFocus?.interruptions === 1 ? "" : "s"}</span>
        </div>
      ) : null}
      {bedtimeLocked ? (
        <div data-testid="bedtime-lock-screen" role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#05080c]/98 px-3 py-6 text-white backdrop-blur-xl sm:px-4 sm:py-8">
          <div className="w-full max-w-2xl border border-indigo-500/40 bg-gradient-to-b from-[#0b121e] to-[#070b12] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] sm:p-8 rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                  <Moon className="h-5 w-5 text-[#c8ff3d]" aria-hidden />
                </div>
                <div>
                  <p className="dossier-kicker text-indigo-300">Strict Bedtime Boundary</p>
                  <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-white">The day is closed.</h1>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-300">
                    This quiet window ends at {bedtimeWindow ? formatLockEnd(bedtimeWindow.end) : "your chosen time"}. Rest is where adaptation compounds.
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
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold ${
                        routineStep[idx]
                          ? "border-[#c8ff3d] bg-[#c8ff3d] text-slate-900"
                          : "border-white/30 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className={routineStep[idx] ? "line-through text-slate-400" : "text-slate-200"}>
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
                  <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/30 text-[10px] font-mono font-bold text-indigo-300">
                    4s
                  </span>
                </span>
                <div>
                  <p className="text-xs font-semibold text-indigo-200">Wind-Down Breathing Pacer</p>
                  <p className="text-[11px] text-slate-400">4-second rhythmic breathing to reset and downshift.</p>
                </div>
              </div>
              <span className="hidden font-mono text-[10px] uppercase tracking-wider text-indigo-300/80 sm:inline-block">
                Inhale • Rest
              </span>
            </div>

            <div data-testid="lockdown-limitations" className="mt-5 border border-[#ff554d]/30 bg-[#071014]/60 p-4 text-xs text-white/80 rounded-xl leading-relaxed">
              NOVA locks this workspace to protect your rest. It cannot disable other phone apps or enforce hardware DND. Use the device preparation steps below for full physical isolation.
            </div>

            <div className="mt-5"><DevicePreparation compact /></div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={handleExitBedtime}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c8ff3d] px-5 text-xs font-bold uppercase tracking-[0.12em] text-[#071014] transition-all hover:bg-[#bbf030] active:scale-95"
              >
                Exit bedtime lock
              </button>
              <Link
                href="/settings#bedtime"
                onClick={() => setManualBedtime(false)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white/80 hover:text-white transition-colors"
              >
                Review schedule <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
