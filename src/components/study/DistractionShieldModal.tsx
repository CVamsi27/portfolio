"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert, ShieldCheck, Flame, ExternalLink, ArrowRight,
  AlertTriangle, Lock, Unlock, Clock, RefreshCw, X, Copy,
  CheckCheck, Globe, CheckCircle2, ChevronRight, Ban, Brain, Headphones,
} from "lucide-react";
import StudyBreakLoungeModal from "./StudyBreakLoungeModal";
import {
  type DistractionShieldState,
  DEFAULT_SHIELD_STATE,
  DEFAULT_ALLOWLIST,
  DEFAULT_BLOCKLIST,
  extractDomain,
  isDomainAllowed,
  isDomainBlocked,
  isLockdownActive,
  getRemainingLockdownMs,
  isLeashActive,
  getRemainingLeashMs,
  formatCountdownClock,
  engage10MinLeash,
  returnToFocusEarly,
  generateTampermonkeyUserscript,
  generateHostsBlockFile,
} from "@/lib/distraction-shield";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { playDistractionWarning, playLockdownAlarm, playSuccessChime } from "@/lib/audio-cue";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface DistractionShieldModalProps {
  open: boolean;
  targetUrl: string;
  onClose: () => void;
  onProceedAnyway?: (url: string) => void;
}

type ShieldStep = "intercept" | "germany_goals" | "forget_dreams" | "leash_active" | "lockdown_active" | "settings";

export default function DistractionShieldModal({
  open,
  targetUrl,
  onClose,
  onProceedAnyway,
}: DistractionShieldModalProps) {
  const { value: shieldState, setValue: setShieldState } = useSyncedStorage<DistractionShieldState>(
    "distraction_shield_state",
    DEFAULT_SHIELD_STATE
  );

  const [stepOverride, setStepOverride] = useState<ShieldStep | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const [now, setNow] = useState(() => (typeof window !== "undefined" ? Date.now() : 0));
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedHosts, setCopiedHosts] = useState(false);
  const [testUrlInput, setTestUrlInput] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showBreakLounge, setShowBreakLounge] = useState(false);

  const { toast } = useToast();
  const domain = useMemo(() => extractDomain(targetUrl), [targetUrl]);

  // Keep live time ticking for countdowns
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  // Audio alert cues on modal open
  useEffect(() => {
    if (!open) return;
    if (isLockdownActive(shieldState, Date.now())) {
      playLockdownAlarm();
    } else {
      playDistractionWarning();
    }
  }, [open, shieldState]);

  const defaultStep: ShieldStep = useMemo(() => {
    const timestamp = now;
    if (isLockdownActive(shieldState, timestamp)) {
      return "lockdown_active";
    }
    if (isLeashActive(shieldState, timestamp)) {
      return "leash_active";
    }
    return "intercept";
  }, [shieldState, now]);

  const step: ShieldStep = stepOverride ?? defaultStep;

  // Countdown timer for "Forget your dreams" button to prevent impulsive rage-clicking
  useEffect(() => {
    if (step !== "forget_dreams") return;

    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  if (!open) return null;

  const lockdownRemainingMs = getRemainingLockdownMs(shieldState, now);
  const leashRemainingMs = getRemainingLeashMs(shieldState, now);

  const handleRemindGoals = () => {
    setStepOverride("germany_goals");
  };

  const handleReturnToFocus = () => {
    playSuccessChime();
    const updated = returnToFocusEarly(shieldState, Date.now());
    setShieldState(updated);
    setStepOverride(null);
    toast({
      title: "Focus Restored!",
      description: "You chose your Germany career dreams over temporary distraction.",
    });
    onClose();
  };

  const handleConfirmForgetDreams = () => {
    const updated = engage10MinLeash(shieldState, targetUrl, Date.now());
    setShieldState(updated);
    playLockdownAlarm();
    setStepOverride("leash_active");
    toast({
      title: "10-Minute Leash Started",
      description: "Timer is running. A strict 1-hour lockdown will follow immediately.",
    });
  };

  const handleOpenLeashedApp = () => {
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      if (onProceedAnyway) {
        onProceedAnyway(targetUrl);
      }
    }
  };

  const copyUserscript = () => {
    const script = generateTampermonkeyUserscript(shieldState.blocklist);
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
    toast({
      title: "Userscript Copied!",
      description: "Paste into Tampermonkey or Violentmonkey to block across your entire browser.",
    });
  };

  const copyHosts = () => {
    const hosts = generateHostsBlockFile(shieldState.blocklist);
    navigator.clipboard.writeText(hosts);
    setCopiedHosts(true);
    setTimeout(() => setCopiedHosts(false), 2000);
    toast({
      title: "Hosts File Blocklist Copied!",
      description: "Paste into your terminal or /etc/hosts for system-wide protection.",
    });
  };

  const runUrlTest = () => {
    if (!testUrlInput.trim()) return;
    const testDom = extractDomain(testUrlInput);
    if (isDomainAllowed(testDom, shieldState.allowlist)) {
      setTestResult(`ALLOWED: ${testDom} is on your productive allowlist.`);
    } else if (isDomainBlocked(testDom, shieldState.blocklist)) {
      setTestResult(`BLOCKED: ${testDom} is on your distraction blocklist.`);
    } else {
      setTestResult(`NEUTRAL: ${testDom} is not blocklisted.`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] grid place-items-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-rose-500/40 bg-card p-6 shadow-2xl shadow-rose-950/40 text-foreground overflow-hidden">
        {/* Subtle top indicator glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── STEP 1: INITIAL INTERCEPT ── */}
        {step === "intercept" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-500/15 p-2.5 text-rose-500 border border-rose-500/30 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Buildora Guardian // Distraction Shield
                </span>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Distraction Blocked
                </h3>
              </div>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Intercepted Domain:</span>
                <span className="font-bold text-rose-300">{domain || "Blocked App"}</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                This platform is on your social media blocklist. Opening it will trigger cognitive friction, disrupt your deep work streak, and delay your relocation progress.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span>Productive Allowlist Active:</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                <span>buildora.work</span>·<span>notion.com</span>·<span>github.com</span>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleRemindGoals}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer"
              >
                <span>Remind me of my Germany goals</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleReturnToFocus}
                className="w-full rounded-xl border border-border/80 bg-background/60 px-4 py-2.5 font-utility text-xs font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer"
              >
                Close & Return to Deep Study
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent("portfolio-open-revision-deck"));
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 font-display text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <Brain className="h-4 w-4 text-amber-400" />
                <span>Drill Active Recall Questions Instead →</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBreakLounge(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 font-display text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
              >
                <Headphones className="h-4 w-4 text-cyan-400" />
                <span>Need a Break? YouTube Music & Tech Podcasts →</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: GERMANY GOALS REALITY CHECK ── */}
        {step === "germany_goals" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/15 p-2.5 text-purple-400 border border-purple-500/30 shrink-0">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  Target Destination // Berlin & Munich
                </span>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Your Germany Relocation Reality Check
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/8 p-3">
                <p className="font-mono text-[10px] uppercase text-purple-400 font-semibold">Target Compensation</p>
                <p className="font-display text-base font-bold text-foreground mt-0.5">€75,000 – €85,000+</p>
                <p className="text-[10px] text-muted-foreground">Full-Stack SDE (Node/React/TS)</p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3">
                <p className="font-mono text-[10px] uppercase text-emerald-400 font-semibold">EU Blue Card Pathway</p>
                <p className="font-display text-base font-bold text-emerald-400 mt-0.5">21 Months to PR</p>
                <p className="text-[10px] text-muted-foreground">Shortage threshold: €41,041</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2 text-xs">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                Target European Tech Companies
              </p>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {["Personio", "n8n", "SumUp", "Scalable Capital", "Doctolib"].map((company) => (
                  <span
                    key={company}
                    className="rounded-md border border-border/70 bg-card px-2 py-0.5 text-foreground/90"
                  >
                    {company}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 leading-relaxed italic border-t border-border/40">
                &ldquo;Every 15 minutes lost to mindless scrolling is another week delayed on your German visa and work permit. Protect your momentum.&rdquo;
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleReturnToFocus}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-display text-sm font-bold text-white hover:bg-emerald-500 transition-all shadow-md cursor-pointer"
              >
                <span>Snap out of it — Back to Germany Goals</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCountdownSeconds(5);
                  setStepOverride("forget_dreams");
                }}
                className="w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 font-utility text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                I still want to proceed to {domain || "distraction"} →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: FORGET YOUR DREAMS (FRICTION SCREEN) ── */}
        {step === "forget_dreams" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-600/20 p-2.5 text-rose-400 border border-rose-500/40 shrink-0">
                <Ban className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Critical Decision Gate // Irreversible
                </span>
                <h3 className="font-display text-lg font-bold text-rose-400">
                  Are You Ready to Sacrifice Your Future?
                </h3>
              </div>
            </div>

            <div className="rounded-xl border border-rose-500/50 bg-rose-950/30 p-4 space-y-2.5 text-xs text-rose-100">
              <p className="font-semibold text-rose-200">
                You are about to consciously trade your Germany relocation dreams for short-term stimulation.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-rose-200/80 text-[11px]">
                <li>Opening <strong>{domain}</strong> will grant a maximum of <strong>10 minutes</strong>.</li>
                <li>Immediately following those 10 minutes, a <strong>STRICT 1-HOUR LOCKDOWN</strong> will lock down all social media with zero bypass allowed.</li>
                <li>Your distraction tally will be permanently recorded in your career ledger.</li>
              </ul>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleReturnToFocus}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-display text-sm font-bold text-white hover:bg-emerald-500 transition-all shadow-md cursor-pointer"
              >
                <span>Protect My Dreams — Return to Focus</span>
              </button>

              <button
                type="button"
                disabled={countdownSeconds > 0}
                onClick={handleConfirmForgetDreams}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 font-display text-xs font-bold transition-all cursor-pointer",
                  countdownSeconds > 0
                    ? "border-muted bg-muted/40 text-muted-foreground opacity-70 cursor-not-allowed"
                    : "border-rose-500 bg-rose-600 text-white hover:bg-rose-700 shadow-md animate-pulse"
                )}
              >
                {countdownSeconds > 0
                  ? `Reflect for ${countdownSeconds}s before clicking...`
                  : "Forget your dreams (Start 10m Leash + 1h Lockdown)"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: 10-MINUTE LEASH ACTIVE ── */}
        {step === "leash_active" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400 border border-amber-500/40 shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Emergency Leash // 10 Minutes Total
                </span>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Temporary Access Active
                </h3>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-center space-y-2">
              <p className="font-mono text-xs uppercase text-amber-400 font-semibold tracking-wider">
                Leash Time Remaining
              </p>
              <p className="font-mono text-4xl font-extrabold text-amber-300 tabular-nums">
                {formatCountdownClock(leashRemainingMs)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                In {formatCountdownClock(leashRemainingMs)}, all blocked social media will enter a 1-hour strict lockdown.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleOpenLeashedApp}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-display text-sm font-bold text-black hover:bg-amber-400 transition-all shadow-md cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Launch {domain || "App"} (Timer Running in Background)</span>
              </button>

              <button
                type="button"
                onClick={handleReturnToFocus}
                className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 font-display text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
              >
                End Leash Early & Return to Germany Goals
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: 1-HOUR LOCKDOWN ACTIVE ── */}
        {step === "lockdown_active" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-600/20 p-2.5 text-rose-400 border border-rose-500/50 shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Strict Lockdown // Zero Bypass Allowed
                </span>
                <h3 className="font-display text-lg font-bold text-rose-400">
                  1-Hour Social Media Lockdown Active
                </h3>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-5 text-center space-y-2">
              <p className="font-mono text-xs uppercase text-rose-400 font-semibold tracking-wider">
                Lockdown Remaining
              </p>
              <p className="font-mono text-4xl font-extrabold text-rose-300 tabular-nums">
                {formatCountdownClock(lockdownRemainingMs)}
              </p>
              <p className="text-[11px] text-rose-200/80 leading-relaxed">
                Your 10-minute emergency leash has ended. Social media access is strictly barred for the remainder of this hour to preserve your focus.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2 text-xs">
              <p className="font-semibold text-foreground">Safe Productive Zones Open Right Now:</p>
              <div className="flex flex-col gap-1.5">
                <a
                  href="https://study.buildora.work"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-foreground hover:border-primary/50 transition-colors"
                >
                  <span className="font-medium">Software Developer Bible (study.buildora.work)</span>
                  <ExternalLink className="h-3 w-3 text-primary" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-foreground hover:border-primary/50 transition-colors"
                >
                  <span className="font-medium">GitHub Repositories (github.com)</span>
                  <ExternalLink className="h-3 w-3 text-primary" />
                </a>
                <a
                  href="https://notion.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-foreground hover:border-primary/50 transition-colors"
                >
                  <span className="font-medium">Notion Engineering Workspace (notion.com)</span>
                  <ExternalLink className="h-3 w-3 text-primary" />
                </a>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => setShowBreakLounge(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 font-display text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
              >
                <Headphones className="h-4 w-4 text-cyan-400" />
                <span>Audio Break: YouTube Music & Tech Podcasts →</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-md"
              >
                Close & Keep Studying
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: SETTINGS & BROWSER-WIDE PROTECTION TAB ── */}
        {step === "settings" && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h4 className="font-display font-bold text-sm">Guardian Rules & Browser Protection</h4>
              </div>
              <button
                type="button"
                onClick={() => setStepOverride("intercept")}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-mono"
              >
                ← Back
              </button>
            </div>

            {/* Test URL Form */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
              <p className="font-display text-xs font-bold text-foreground">Test URL Shield Interception</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testUrlInput}
                  onChange={(e) => {
                    setTestUrlInput(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="e.g. instagram.com or notion.com"
                  className="flex-1 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={runUrlTest}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  Test
                </button>
              </div>
              {testResult && (
                <p className="font-mono text-[11px] text-primary">{testResult}</p>
              )}
            </div>

            {/* Allowlist & Blocklist Preview */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1.5">
                <p className="font-bold text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                  <CheckCircle2 className="h-3 w-3" /> ALLOWLIST ({shieldState.allowlist.length})
                </p>
                <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
                  {shieldState.allowlist.map((item) => (
                    <div key={item} className="truncate text-emerald-400">+ {item}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 space-y-1.5">
                <p className="font-bold text-rose-400 flex items-center gap-1 font-mono text-[11px]">
                  <Ban className="h-3 w-3" /> BLOCKLIST ({shieldState.blocklist.length})
                </p>
                <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
                  {shieldState.blocklist.slice(0, 5).map((item) => (
                    <div key={item} className="truncate text-rose-400">- {item}</div>
                  ))}
                  {shieldState.blocklist.length > 5 && (
                    <div className="text-[9px] text-muted-foreground/80">
                      +{shieldState.blocklist.length - 5} more social apps
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Browser-wide protection generator */}
            <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2 text-xs">
              <p className="font-bold text-foreground">Browser-Wide Userscript (Tampermonkey)</p>
              <p className="text-[11px] text-muted-foreground">
                Install this script in Tampermonkey or Violentmonkey to automatically redirect any social media tab to your Germany Shield.
              </p>
              <button
                type="button"
                onClick={copyUserscript}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 py-2 font-mono text-[11px] font-semibold text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                {copiedScript ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedScript ? "Userscript Copied to Clipboard!" : "Copy Tampermonkey Userscript"}
              </button>
            </div>

            {/* System hosts blocker */}
            <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2 text-xs">
              <p className="font-bold text-foreground">System /etc/hosts Blocker (Terminal)</p>
              <p className="text-[11px] text-muted-foreground">
                Block blocked domains at the OS network level on your Mac/Linux laptop during work hours.
              </p>
              <button
                type="button"
                onClick={copyHosts}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 py-2 font-mono text-[11px] font-semibold text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                {copiedHosts ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedHosts ? "Hosts Script Copied!" : "Copy /etc/hosts Script"}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Rules & Settings Link */}
        {step !== "settings" && (
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>Germany Shield Protocol v1.0</span>
            <button
              type="button"
              onClick={() => setStepOverride("settings")}
              className="text-primary hover:underline cursor-pointer"
            >
              Configure Allowlist & Blocklist →
            </button>
          </div>
        )}
      </div>

      {/* Mindful Audio Break Lounge Modal */}
      <StudyBreakLoungeModal
        open={showBreakLounge}
        onClose={() => setShowBreakLounge(false)}
      />
    </div>
  );
}
