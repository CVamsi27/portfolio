"use client";

import { useEffect, useState } from "react";
import { Clock, Lock, ShieldAlert, ArrowRight, X, Flame } from "lucide-react";
import {
  type DistractionShieldState,
  DEFAULT_SHIELD_STATE,
  isLockdownActive,
  getRemainingLockdownMs,
  isLeashActive,
  getRemainingLeashMs,
  formatCountdownClock,
  returnToFocusEarly,
} from "@/lib/distraction-shield";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { playSuccessChime } from "@/lib/audio-cue";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface DistractionShieldBannerProps {
  onOpenShield?: (targetUrl?: string) => void;
}

export default function DistractionShieldBanner({ onOpenShield }: DistractionShieldBannerProps) {
  const { value: shieldState, setValue: setShieldState } = useSyncedStorage<DistractionShieldState>(
    "distraction_shield_state",
    DEFAULT_SHIELD_STATE
  );

  const [now, setNow] = useState(() => (typeof window !== "undefined" ? Date.now() : 0));
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const leashActive = isLeashActive(shieldState, now);
  const lockdownActive = isLockdownActive(shieldState, now);

  if (!shieldState.enabled || (!leashActive && !lockdownActive)) {
    return null;
  }

  const leashMs = getRemainingLeashMs(shieldState, now);
  const lockdownMs = getRemainingLockdownMs(shieldState, now);

  const handleReturnToFocus = () => {
    playSuccessChime();
    const updated = returnToFocusEarly(shieldState, Date.now());
    setShieldState(updated);
    toast({
      title: "Focus Restored! 🇩🇪",
      description: "Emergency leash cancelled early. Keep crushing your Germany roadmap!",
    });
  };

  return (
    <aside
      aria-label="Distraction Shield Notification"
      className={cn(
        "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[90] max-w-md rounded-2xl border p-3.5 shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-300",
        leashActive
          ? "border-amber-500/50 bg-amber-950/90 text-amber-100 shadow-amber-950/50"
          : "border-rose-500/50 bg-rose-950/90 text-rose-100 shadow-rose-950/50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "rounded-xl p-2 shrink-0 border",
              leashActive
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
            )}
          >
            {leashActive ? <Clock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {leashActive ? "10m Distraction Leash" : "1h Social Media Lockdown"}
              </span>
            </div>
            <p className="font-mono text-xs font-bold leading-tight flex items-center gap-1.5 tabular-nums">
              <span>{leashActive ? formatCountdownClock(leashMs) : formatCountdownClock(lockdownMs)}</span>
              <span className="text-[10px] font-normal opacity-80">
                {leashActive ? "remaining before 1h lockdown" : "lockdown remaining"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {leashActive ? (
            <button
              type="button"
              onClick={handleReturnToFocus}
              className="rounded-xl bg-emerald-500 px-3 py-1.5 font-display text-[11px] font-bold text-black hover:bg-emerald-400 transition-colors cursor-pointer shadow-xs"
            >
              End Early 🇩🇪
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("portfolio-open-revision-deck"));
                }}
                className="rounded-xl bg-amber-500 px-3 py-1.5 font-display text-[11px] font-bold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer shadow-xs"
                title="Launch full-screen opaque recall gate"
              >
                Recall Gate
              </button>
              <button
                type="button"
                onClick={() => onOpenShield?.()}
                className="rounded-xl border border-rose-400/40 bg-rose-500/20 px-2.5 py-1.5 font-display text-[11px] font-bold text-rose-200 hover:bg-rose-500/30 transition-colors cursor-pointer"
              >
                Status
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
