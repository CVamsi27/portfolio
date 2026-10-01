"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  Moon,
  Shield,
  Phone,
  MessageSquare,
  Headphones,
  Settings,
  AlertTriangle,
  Clock,
  Unlock,
  ChevronRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  Volume2,
  VolumeX,
  Smartphone,
  Apple,
  Sliders,
  X,
  Radio,
} from "lucide-react";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useAuth } from "@/lib/auth-store";
import { useNow } from "@/lib/tracker-store";
import {
  type NightCurfewConfig,
  DEFAULT_NIGHT_CURFEW_CONFIG,
  DEFAULT_ALLOWED_APPS,
  isNightCurfewActive,
  getNightCurfewRemainingMs,
  formatCurfewCountdown,
  formatCurfewTime,
  grantEmergencyUnlock,
  revokeEmergencyUnlock,
  OS_LOCKDOWN_GUIDES,
} from "@/lib/night-curfew";
import { isMobilePhoneDevice, getDeviceDisplayName } from "@/lib/study-focus";
import { playBedtimeChime } from "@/lib/audio-cue";
import { useToast } from "@/components/ui/use-toast";
import StudyBreakLoungeModal from "./StudyBreakLoungeModal";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export default function NightCurfewLockdownBarrier() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { user } = useAuth();
  const { value: curfewConfig, setValue: setCurfewConfig } =
    useSyncedStorage<NightCurfewConfig>("night_curfew_config", DEFAULT_NIGHT_CURFEW_CONFIG);

  const now = useNow(1000);
  const { toast } = useToast();

  const [showOsGuide, setShowOsGuide] = useState<"ios" | "android" | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSleepAudioModal, setShowSleepAudioModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hold-to-Unlock state (5-second deliberate hold to prevent impulsive bypassing)
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chimePlayedDateRef = useRef<string | null>(null);

  const isPhone = useMemo(() => isMobilePhoneDevice(), []);
  const deviceName = useMemo(() => getDeviceDisplayName(), []);

  // Determine if night curfew should lock down this screen
  const isCurfewActive = useMemo(() => {
    if (!mounted) return false;
    return isNightCurfewActive(curfewConfig, now, isPhone);
  }, [mounted, curfewConfig, now, isPhone]);

  // Remaining time until curfew ends (morning wake-up)
  const remainingMs = useMemo(() => {
    return getNightCurfewRemainingMs(curfewConfig, now);
  }, [curfewConfig, now]);

  // Gentle acoustic bedtime chime once per day upon entering curfew
  useEffect(() => {
    if (isCurfewActive && soundEnabled) {
      const todayKey = new Date(now).toDateString();
      if (chimePlayedDateRef.current !== todayKey) {
        chimePlayedDateRef.current = todayKey;
        playBedtimeChime();
      }
    }
  }, [isCurfewActive, soundEnabled, now]);

  // 5-second Hold-to-Unlock execution
  const startHold = useCallback(() => {
    setIsHolding(true);
    setHoldProgress(0);
    const stepMs = 50;
    const totalMs = 5000;
    const increment = (stepMs / totalMs) * 100;

    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          setIsHolding(false);
          // Grant 15 min emergency pass
          setCurfewConfig((prevConfig) =>
            grantEmergencyUnlock(prevConfig, prevConfig.emergencyUnlockDurationMs || 15 * 60 * 1000, Date.now())
          );
          toast({
            title: "Emergency 15-Minute Pass Granted",
            description: "Phone curfew paused for 15 minutes. Use only for genuine emergencies.",
          });
          return 100;
        }
        return prev + increment;
      });
    }, stepMs);
  }, [setCurfewConfig, toast]);

  const cancelHold = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  const handleSaveSettings = useCallback(
    (updated: Partial<NightCurfewConfig>) => {
      setCurfewConfig((prev) => ({
        ...prev,
        ...updated,
      }));
      setShowSettingsModal(false);
      toast({
        title: "Night Curfew Updated",
        description: `Curfew scheduled from ${formatCurfewTime(updated.startHour ?? curfewConfig.startHour, 0)} to ${formatCurfewTime(updated.endHour ?? curfewConfig.endHour, 0)}.`,
      });
    },
    [setCurfewConfig, toast, curfewConfig.startHour, curfewConfig.endHour]
  );

  const handleReLockNow = () => {
    setCurfewConfig((prev) => revokeEmergencyUnlock(prev));
    toast({
      title: "Curfew Restored",
      description: "Full bedtime lockdown re-engaged.",
    });
  };

  if (!isCurfewActive) {
    // If temporarily emergency unlocked during curfew window, show a discreet reminder banner
    const isWithinWindow = isNightCurfewActive(
      { ...curfewConfig, emergencyUnlockedUntil: null },
      now,
      isPhone
    );
    if (isWithinWindow && curfewConfig.emergencyUnlockedUntil && now < curfewConfig.emergencyUnlockedUntil) {
      const unlockLeftMs = Math.max(0, curfewConfig.emergencyUnlockedUntil - now);
      const unlockMins = Math.ceil(unlockLeftMs / 60_000);
      return (
        <div className="fixed bottom-4 left-4 right-4 z-[9000] mx-auto max-w-md rounded-2xl border border-amber-500/40 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <span>
                <strong>Curfew Emergency Pass</strong>: {unlockMins}m remaining
              </span>
            </div>
            <button
              onClick={handleReLockNow}
              className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition-colors hover:bg-amber-500/30"
            >
              Re-lock Now
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const barrier = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Night Curfew Phone Lockdown Screen"
      className="fixed inset-0 z-[99999] flex flex-col justify-between overflow-y-auto bg-slate-950/98 p-5 text-slate-100 backdrop-blur-2xl selection:bg-indigo-500/30 sm:p-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 15%, rgba(99, 102, 241, 0.18) 0%, transparent 60%), radial-gradient(circle at 80% 85%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)",
      }}
    >
      {/* Top Bar: Device Name & Sound Toggle */}
      <div className="flex items-center justify-between border-b border-indigo-900/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-sm">
            <Moon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold tracking-wider text-slate-100">
                10:00 PM BEDTIME LOCKDOWN
              </span>
              <span className="rounded-full border border-indigo-500/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-300">
                CURFEW
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Active on {deviceName} · {formatCurfewTime(curfewConfig.startHour, curfewConfig.startMinute)} –{" "}
              {formatCurfewTime(curfewConfig.endHour, curfewConfig.endMinute)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            aria-label={soundEnabled ? "Disable acoustic bedtime chime" : "Enable acoustic bedtime chime"}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            aria-label="Curfew settings"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Center Content: Countdown & Germany Goal Reminder */}
      <div className="my-auto flex flex-col items-center py-6 text-center">
        {/* Glowing Moon Icon */}
        <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/20 to-slate-900 shadow-2xl shadow-indigo-500/20 sm:h-24 sm:w-24">
          <Moon className="h-10 w-10 text-indigo-300 sm:h-12 sm:w-12 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-slate-900 bg-emerald-500 text-slate-950 shadow-md">
            <Shield className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Ticking Wake-up Countdown */}
        <div className="mb-2 font-mono text-3xl font-extrabold tracking-tight text-indigo-200 sm:text-4xl">
          {formatCurfewCountdown(remainingMs)}
        </div>
        <p className="mb-5 text-xs font-medium uppercase tracking-widest text-indigo-400/80">
          Until {formatCurfewTime(curfewConfig.endHour, curfewConfig.endMinute)} Morning Rise & Deep Study
        </p>

        {/* Germany Blue Card Vision Box */}
        <div className="mb-6 w-full max-w-lg rounded-2xl border border-indigo-900/50 bg-slate-900/80 p-4 shadow-xl text-left backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>GERMANY €75K–€85K BLUE CARD GOAL</span>
            </div>
            <span className="text-[11px] text-slate-400">Restorative Sleep</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            {curfewConfig.bedtimeAffirmation}
          </p>
          <div className="mt-3 flex items-center gap-2 border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Third-party apps locked to prevent late-night dopamine loop.</span>
          </div>
        </div>

        {/* Allowed Essential Apps Launcher */}
        <div className="w-full max-w-lg">
          <div className="mb-2.5 flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Permitted Essential Utilities
            </span>
            <span className="text-[10px] text-slate-500">Only critical access allowed</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
            {/* Phone Call */}
            <a
              href={curfewConfig.emergencyContactNumber ? `tel:${curfewConfig.emergencyContactNumber}` : "tel:"}
              className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-left transition hover:border-emerald-500/60 hover:bg-emerald-900/30"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-100">Phone Dialer</div>
                <div className="truncate text-[10px] text-slate-400">
                  {curfewConfig.emergencyContactNumber ? `Call ${curfewConfig.emergencyContactName}` : "Direct voice calls"}
                </div>
              </div>
            </a>

            {/* Messages / SMS */}
            <a
              href="sms:"
              className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-950/30 p-3 text-left transition hover:border-sky-500/60 hover:bg-sky-900/30"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-100">Messages</div>
                <div className="truncate text-[10px] text-slate-400">SMS / Urgent text</div>
              </div>
            </a>

            {/* Emergency SOS 112 */}
            <a
              href="tel:112"
              className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-left transition hover:border-rose-500/60 hover:bg-rose-900/30"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-100">SOS (112)</div>
                <div className="truncate text-[10px] text-slate-400">EU Emergency lines</div>
              </div>
            </a>

            {/* Sleep Audio / Soundscapes */}
            <button
              onClick={() => setShowSleepAudioModal(true)}
              className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3 text-left transition hover:border-indigo-500/60 hover:bg-indigo-900/30"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <Headphones className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-100">Sleep Audio</div>
                <div className="truncate text-[10px] text-slate-400">Delta waves & rain</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls: Physical Hardware Guide & Emergency Unlock */}
      <div className="flex flex-col gap-3 border-t border-indigo-900/40 pt-4">
        {/* Physical OS Hardware Lockdown Assistant */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Smartphone className="h-4 w-4 text-indigo-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">Enforce on Physical Phone OS</span>
              <p className="text-[11px] text-slate-400">
                Block Instagram, YouTube, X, Reddit at the phone operating system level.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowOsGuide("ios")}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Apple className="h-3 w-3" />
              <span>iPhone</span>
            </button>
            <button
              onClick={() => setShowOsGuide("android")}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
            >
              <span>Android</span>
            </button>
          </div>
        </div>

        {/* 5-Second Hold to Unlock (Cognitive Friction for Emergencies) */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-[11px] text-slate-400">
            Hold button for 5 seconds only in a genuine real-world emergency.
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              onTouchCancel={cancelHold}
              className={cn(
                "relative flex items-center gap-2 overflow-hidden rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-md transition-all select-none active:scale-95",
                isHolding
                  ? "border-amber-500 bg-amber-950/60 text-amber-200"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-850"
              )}
            >
              {/* Progress bar fill */}
              <div
                className="absolute inset-y-0 left-0 bg-amber-500/30 transition-all duration-75"
                style={{ width: `${holdProgress}%` }}
              />
              <Unlock className="relative z-10 h-3.5 w-3.5 text-amber-400" />
              <span className="relative z-10">
                {isHolding ? `Hold (${Math.ceil((5000 - (holdProgress / 100) * 5000) / 1000)}s)...` : "Emergency Unlock"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* OS Hardware Guide Modal */}
      {showOsGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-indigo-900/60 bg-slate-950 p-6 shadow-2xl">
            <button
              onClick={() => setShowOsGuide(null)}
              aria-label="Close OS guide"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-slate-100">
                  {OS_LOCKDOWN_GUIDES[showOsGuide].title}
                </h3>
                <span className="text-xs text-indigo-300 font-medium">
                  {OS_LOCKDOWN_GUIDES[showOsGuide].badge}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 my-4">
              {OS_LOCKDOWN_GUIDES[showOsGuide].steps.map((step) => (
                <div key={step.step} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-bold text-indigo-300">
                      {step.step}
                    </span>
                    <span className="text-xs font-semibold text-slate-100">{step.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed pl-7">{step.detail}</p>
                  <div className="mt-1.5 pl-7 text-[10px] font-mono text-indigo-400">
                    📍 {step.settingPath}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowOsGuide(null)}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-indigo-500"
            >
              Got it, I configured my phone
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <CurfewSettingsModal
          config={curfewConfig}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
        />
      )}

      {/* Sleep Audio Lounge Modal */}
      {showSleepAudioModal && (
        <StudyBreakLoungeModal
          open={showSleepAudioModal}
          onClose={() => setShowSleepAudioModal(false)}
        />
      )}
    </div>
  );

  return createPortal(barrier, document.body);
}

function CurfewSettingsModal({
  config,
  onClose,
  onSave,
}: {
  config: NightCurfewConfig;
  onClose: () => void;
  onSave: (updated: Partial<NightCurfewConfig>) => void;
}) {
  const [startHour, setStartHour] = useState(config.startHour ?? 22);
  const [endHour, setEndHour] = useState(config.endHour ?? 6);
  const [onlyMobile, setOnlyMobile] = useState(config.onlyMobilePhones ?? true);
  const [emergencyContact, setEmergencyContact] = useState(config.emergencyContactNumber ?? "");
  const [emergencyName, setEmergencyName] = useState(config.emergencyContactName ?? "Emergency Contact");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      startHour: Number(startHour),
      endHour: Number(endHour),
      onlyMobilePhones: onlyMobile,
      emergencyContactNumber: emergencyContact.trim(),
      emergencyContactName: emergencyName.trim() || "Emergency Contact",
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-indigo-900/60 bg-slate-950 p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <Sliders className="h-5 w-5 text-indigo-400" />
          <h3 className="font-heading text-base font-bold text-slate-100">
            Bedtime Curfew Settings
          </h3>
        </div>

        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Curfew Start Hour (24-Hour Format)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={startHour}
                onChange={(e) => setStartHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">
                ({formatCurfewTime(startHour, 0)}) Default: 22 (10:00 PM)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Wake-Up End Hour (24-Hour Format)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={endHour}
                onChange={(e) => setEndHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">
                ({formatCurfewTime(endHour, 0)}) Default: 6 (06:00 AM)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Emergency Contact Name & Number
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Contact Name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="tel"
                placeholder="+49 or local phone"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="onlyMobile"
              checked={onlyMobile}
              onChange={(e) => setOnlyMobile(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="onlyMobile" className="text-xs text-slate-300">
              Target mobile handheld devices only (allow desktop reading)
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Save Curfew
          </button>
        </div>
      </form>
    </div>
  );
}
