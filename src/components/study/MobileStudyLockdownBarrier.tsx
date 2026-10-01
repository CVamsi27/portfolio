"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ShieldAlert,
  Smartphone,
  Clock,
  Flame,
  Headphones,
  Edit3,
  Unlock,
  AlertTriangle,
  Laptop,
  CheckCircle2,
  ExternalLink,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useAuth } from "@/lib/auth-store";
import { useNow } from "@/lib/tracker-store";
import {
  type ActiveStudySession,
  formatStudyClock,
  getClientDeviceId,
  getStudyRemainingMs,
  getStudyElapsedMs,
  isMobilePhoneDevice,
} from "@/lib/study-focus";
import { playDistractionWarning, playSuccessChime } from "@/lib/audio-cue";
import { useToast } from "@/components/ui/use-toast";
import StudyBreakLoungeModal from "./StudyBreakLoungeModal";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export default function MobileStudyLockdownBarrier() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { user } = useAuth();
  const { value: activeSession, setValue: setActiveSession } =
    useSyncedStorage<ActiveStudySession | null>("study:active_session", null);

  const now = useNow(1000);
  const { toast } = useToast();

  const [snoozeUntil, setSnoozeUntil] = useState<number>(0);
  const [showBreakLounge, setShowBreakLounge] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hold-to-unlock state (prevents impulsive clicking)
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertedSessionIdRef = useRef<string | null>(null);

  // Client device ID
  const currentDeviceId = useMemo(() => getClientDeviceId(), []);
  const isPhone = useMemo(() => isMobilePhoneDevice(), []);

  // Compute active session remaining time
  const remainingMs = activeSession ? getStudyRemainingMs(activeSession, now) : 0;
  const elapsedMs = activeSession ? getStudyElapsedMs(activeSession, now) : 0;
  const totalTargetMs = (activeSession?.targetMinutes || 25) * 60_000;
  const progressPct = totalTargetMs > 0 ? Math.min(100, Math.round((elapsedMs / totalTargetMs) * 100)) : 0;

  // Is this device subject to lockdown?
  const shouldLockdown = useMemo(() => {
    if (!mounted || !user || !activeSession) return false;
    // Session must be active with time remaining
    if (remainingMs <= 0) return false;
    // Must be a mobile/phone client
    if (!isPhone) return false;
    // Check if snoozed
    if (now < snoozeUntil) return false;
    // If the session was started on this exact phone device, don't lock down
    if (activeSession.originDeviceId && activeSession.originDeviceId === currentDeviceId) {
      return false;
    }
    // Block if initiated from desktop or marked for mobile blocking
    return activeSession.blockMobileDevices !== false || activeSession.originDeviceType === "desktop";
  }, [mounted, user, activeSession, remainingMs, isPhone, now, snoozeUntil, currentDeviceId]);

  // Audio prompt on lockdown activation
  useEffect(() => {
    if (shouldLockdown && activeSession && soundEnabled) {
      if (alertedSessionIdRef.current !== activeSession.id) {
        alertedSessionIdRef.current = activeSession.id;
        playDistractionWarning();
      }
    }
  }, [shouldLockdown, activeSession, soundEnabled]);

  // Handle Hold-to-Unlock 5-second timer
  const startHold = useCallback(() => {
    setIsHolding(true);
    setHoldProgress(0);
    const stepMs = 50;
    const totalMs = 3000; // 3 seconds deliberate hold
    const increment = (stepMs / totalMs) * 100;

    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          setIsHolding(false);
          // Unlock for 5 minutes
          const snoozeTime = Date.now() + 5 * 60_000;
          setSnoozeUntil(snoozeTime);
          if (soundEnabled) playSuccessChime();

          // Log distraction on active session
          if (activeSession) {
            setActiveSession({
              ...activeSession,
              distractionCount: activeSession.distractionCount + 1,
            });
          }

          toast({
            title: "Phone Lockdown Snoozed (5m)",
            description: "Workstation session logged 1 mobile interruption.",
          });
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);
  }, [activeSession, setActiveSession, soundEnabled, toast]);

  const cancelHold = useCallback(() => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const handleSaveQuickNote = () => {
    if (!activeSession || !quickNoteText.trim()) return;
    const timeFormatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const appended = activeSession.notes
      ? `${activeSession.notes}\n[Phone Note ${timeFormatted}]: ${quickNoteText.trim()}`
      : `[Phone Note ${timeFormatted}]: ${quickNoteText.trim()}`;

    setActiveSession({
      ...activeSession,
      notes: appended,
    });

    setQuickNoteText("");
    setShowNoteModal(false);
    toast({
      title: "Note Synced to Workstation!",
      description: "Your mental thought was safely saved to the active deep study cockpit.",
    });
  };

  const handleAllowStudyOnPhone = () => {
    if (!activeSession) return;
    // Mark current device as authorized reader
    setActiveSession({
      ...activeSession,
      originDeviceId: currentDeviceId,
      originDeviceType: "mobile",
    });
    toast({
      title: "Mobile Study Mode Activated",
      description: "You may now continue reading on this device.",
    });
  };

  if (!shouldLockdown || !activeSession) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Phone Deep Study Lockdown"
      className="fixed inset-0 z-[99999] flex flex-col justify-between bg-slate-950/98 text-slate-100 backdrop-blur-3xl overflow-y-auto animate-in fade-in-0 duration-300"
    >
      {/* ─── TOP STATUS HEADER ─── */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-rose-500/30 bg-slate-950/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <Smartphone className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-rose-400">
                Phone Lockdown Active
              </span>
              <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-rose-300 border border-rose-500/30">
                Cross-Device Guard
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Laptop className="h-3 w-3 text-cyan-400" />
              <span>Sprint running on: {activeSession.originDeviceName || "Workstation"}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors"
          title={soundEnabled ? "Mute chimes" : "Enable chimes"}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </header>

      {/* ─── MAIN CONTENT: COUNTDOWN & COGNITIVE FRICTION ─── */}
      <main className="flex-1 max-w-lg w-full mx-auto px-5 py-6 flex flex-col justify-center space-y-5 text-center">
        {/* Sprint Countdown Display */}
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/20 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 font-mono text-[11px] font-bold text-rose-400 uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" />
            <span>Sprint In Progress</span>
          </div>

          <div>
            <span className="font-mono text-5xl sm:text-6xl font-black text-white tracking-tight tabular-nums drop-shadow-md">
              {formatStudyClock(remainingMs)}
            </span>
            <p className="mt-1 font-mono text-xs text-slate-400">
              remaining in {activeSession.targetMinutes}m deep focus sprint
            </p>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Chapter Details */}
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3.5 text-left space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-amber-400 font-bold">Day {activeSession.day} · {activeSession.stack}</span>
              <span>Distractions: {activeSession.distractionCount}</span>
            </div>
            <h3 className="font-display font-bold text-sm text-white line-clamp-2">
              {activeSession.chapterTitle}
            </h3>
          </div>
        </div>

        {/* 🇩🇪 GERMANY REALITY CHECK CALLOUT */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <Flame className="h-4 w-4" />
            <span className="font-display font-bold text-xs uppercase tracking-wider">
              🇩🇪 Relocation Reality Check (€75k–€85k Target)
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every glance at your phone shatters your working memory and induces a <strong>23-minute context recovery penalty</strong>. Put your phone face-down and look back at your workstation monitor.
          </p>
        </div>

        {/* ACTION BUTTONS ON PHONE */}
        <div className="space-y-2.5 pt-1">
          {/* Mindful Audio on Phone (YouTube Music / Podcasts) */}
          <button
            type="button"
            onClick={() => setShowBreakLounge(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/25 py-3.5 px-4 font-display text-xs sm:text-sm font-bold text-cyan-200 transition-all shadow-lg shadow-cyan-950/50 cursor-pointer"
          >
            <Headphones className="h-4 w-4 text-cyan-400" />
            <span>Play Focus Audio on Phone (YouTube Music)</span>
          </button>

          {/* Quick Mental Note */}
          <button
            type="button"
            onClick={() => setShowNoteModal(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 py-3 px-4 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5 text-slate-400" />
            <span>Jot a Mental Thought to Workstation</span>
          </button>
        </div>
      </main>

      {/* ─── BOTTOM EMERGENCY OVERRIDE BAR ─── */}
      <footer className="sticky bottom-0 z-10 border-t border-white/10 bg-slate-950/90 px-5 py-4 backdrop-blur-md space-y-2.5">
        {/* Hold-to-Unlock Button */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/40 bg-rose-500/10">
          <div
            className="absolute top-0 bottom-0 left-0 bg-rose-500/30 transition-all duration-75"
            style={{ width: `${holdProgress}%` }}
          />
          <button
            type="button"
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            className="relative w-full py-3.5 px-4 text-xs font-bold text-rose-300 flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.99] transition-transform"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span>{isHolding ? `Hold to unlock (${Math.round(holdProgress)}%)...` : "Hold 3s to Emergency Unlock Phone"}</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
          <button
            type="button"
            onClick={handleAllowStudyOnPhone}
            className="hover:text-slate-300 underline cursor-pointer"
          >
            I am studying on this phone
          </button>
          <span>Auto-unlocks at {formatStudyClock(remainingMs)}</span>
        </div>
      </footer>

      {/* ─── QUICK NOTE MODAL ─── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[100000] grid place-items-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-white">
                Sync Mental Note to Workstation
              </h4>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
            <textarea
              rows={4}
              value={quickNoteText}
              onChange={(e) => setQuickNoteText(e.target.value)}
              placeholder="Jot down a quick invariant, trade-off, or thought to look at later on your computer..."
              className="w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none resize-none"
            />
            <button
              type="button"
              onClick={handleSaveQuickNote}
              className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 text-xs transition-colors cursor-pointer"
            >
              Sync Note to Active Cockpit
            </button>
          </div>
        </div>
      )}

      {/* ─── AUDIO BREAK LOUNGE ON PHONE ─── */}
      <StudyBreakLoungeModal
        open={showBreakLounge}
        onClose={() => setShowBreakLounge(false)}
      />
    </div>,
    document.body
  );
}
