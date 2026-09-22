"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Moon, ShieldAlert } from "lucide-react";
import DevicePreparation from "./DevicePreparation";
import { useNow } from "@/lib/tracker-store";
import {
  DEFAULT_LOCKDOWN_PREFERENCES,
  formatLockEnd,
  isBedtimeLocked,
  nextBedtimeWindow,
  normalizeLockdownPreferences,
  type LockdownPreferences,
} from "@/lib/lockdown";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import type { FocusActiveState } from "@/lib/focus-sprint";

export default function LockdownGate({ children }: { children: React.ReactNode }) {
  const { value: rawPreferences } = useSyncedStorage<LockdownPreferences>("lockdown:preferences", DEFAULT_LOCKDOWN_PREFERENCES);
  const { value: activeFocus, setValue: setActiveFocus } = useSyncedStorage<FocusActiveState | null>("focus:active", null);
  const [bedtimeDismissed, setBedtimeDismissed] = useState(false);
  const now = useNow(1_000);
  const preferences = normalizeLockdownPreferences(rawPreferences);
  const bedtimeWindow = nextBedtimeWindow(preferences, new Date(now));
  const bedtimeLocked = !bedtimeDismissed && isBedtimeLocked(preferences, new Date(now));
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
        <div data-testid="bedtime-lock-screen" role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#071014]/98 px-4 py-8 text-white backdrop-blur-lg">
          <div className="w-full max-w-2xl border border-[#49e7ff]/30 bg-[#10242a] p-5 shadow-[10px_10px_0_rgba(73,231,255,0.12)] sm:p-8">
            <div className="flex items-start gap-3">
              <Moon className="mt-1 h-5 w-5 shrink-0 text-[#c8ff3d]" aria-hidden />
              <div>
                <p className="dossier-kicker">Bedtime boundary</p>
                <h1 className="mt-1 font-display text-3xl font-black tracking-tight">The day is closed.</h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                  This quiet window ends at {bedtimeWindow ? formatLockEnd(bedtimeWindow.end) : "your chosen time"}. The app is protecting this space, not controlling your device.
                </p>
              </div>
            </div>
            <div data-testid="lockdown-limitations" className="mt-5 border border-[#ff554d]/30 bg-[#071014]/50 p-4 text-sm text-white/80">
              It cannot disable other apps, turn on system Do Not Disturb, or lock your phone or laptop. Use the device preparation steps below for that layer.
            </div>
            <div className="mt-5"><DevicePreparation compact /></div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setBedtimeDismissed(true)} className="inline-flex min-h-11 items-center gap-2 bg-[#c8ff3d] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#071014]">
                Exit bedtime lock
              </button>
              <Link href="/settings#bedtime" className="inline-flex min-h-11 items-center gap-2 border border-white/20 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white/80 hover:text-white">
                Review schedule <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
