"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  Headphones,
  History,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Unlock,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import StudyBreakLoungeModal from "./StudyBreakLoungeModal";
import { cn } from "@/lib/utils";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useNow } from "@/lib/tracker-store";
import {
  AmbientFocusDrone,
  playAttentionPing,
  playDistractionWarning,
  playSuccessChime,
} from "@/lib/audio-cue";
import {
  computeStudyAnalytics,
  formatStudyClock,
  getClientDeviceId,
  getDeviceDisplayName,
  getNextStudyGoal,
  getStudyElapsedMs,
  getStudyRemainingMs,
  isMobilePhoneDevice,
  type ActiveStudySession,
  type CompletedChapterRecord,
  type NextStudyGoal,
  type StudyAnalytics,
  type StudyChapterRef,
} from "@/lib/study-focus";
import {
  type ExtendedCompletedChapter,
  type RetentionRating,
  getDueRevisionItems,
  getRevisionStatus,
  recordRevision,
  toggleChapterStar,
  buildFlashcard,
} from "@/lib/revision-engine";
import curriculum from "@/data/career-curriculum.json";
import { SimpleRing } from "@/components/trackers/Ring";
import { toast } from "@/components/ui/use-toast";

const emptySubscribe = () => () => {};

export default function DeepStudyCockpitModal({
  open,
  initialChapter,
  dayNumber,
  onClose,
}: {
  open: boolean;
  initialChapter?: StudyChapterRef;
  dayNumber?: number;
  onClose: () => void;
}) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const { value: activeSession, setValue: setActiveSession } =
    useSyncedStorage<ActiveStudySession | null>("study:active_session", null);
  const { value: completedChapters, setValue: setCompletedChapters } =
    useSyncedStorage<ExtendedCompletedChapter[]>("study:completed_chapters", []);
  const { value: careerState, setValue: setCareerState } =
    useSyncedStorage<any>("career_execution_state", {
      version: 1,
      evidenceByItemId: {},
      archivedItems: [],
    });

  // UI state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [strictLockdown, setStrictLockdown] = useState(true);
  const [showDistractionOverlay, setShowDistractionOverlay] = useState(false);
  const [showAttentionCheck, setShowAttentionCheck] = useState(false);
  const [attentionRecallInput, setAttentionRecallInput] = useState("");
  const [attentionSecondsLeft, setAttentionSecondsLeft] = useState(60);
  const [justCompletedGoal, setJustCompletedGoal] = useState<NextStudyGoal | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [selectedSprintMinutes, setSelectedSprintMinutes] = useState<number>(25);
  const [activeTab, setActiveTab] = useState<"focus" | "revision" | "history">("focus");
  const [historySearch, setHistorySearch] = useState("");
  const [revisionIndex, setRevisionIndex] = useState(0);
  const [isRevisionRevealed, setIsRevisionRevealed] = useState(false);
  const [revisionScratchpad, setRevisionScratchpad] = useState("");
  const [distractionRecallInput, setDistractionRecallInput] = useState("");
  const [isDistractionHintRevealed, setIsDistractionHintRevealed] = useState(false);
  const [showBreakLounge, setShowBreakLounge] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [copiedChapterUrl, setCopiedChapterUrl] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const originalTitleRef = useRef<string>("");
  const droneRef = useRef<AmbientFocusDrone | null>(null);
  const now = useNow(1000);

  // Set of completed chapter IDs
  const completedIds = useMemo(
    () => new Set((completedChapters || []).map((c) => c.chapterId)),
    [completedChapters]
  );

  // Study analytics across completed chapters
  const analytics: StudyAnalytics = useMemo(
    () => computeStudyAnalytics(completedChapters || []),
    [completedChapters]
  );

  // Spaced repetition due queue
  const dueRevisionList = useMemo(() => {
    return getDueRevisionItems(completedChapters || []);
  }, [completedChapters]);

  const currentRevisionChapter = dueRevisionList[revisionIndex] || dueRevisionList[0] || null;
  const currentRevisionCard = useMemo(() => {
    if (!currentRevisionChapter) return null;
    return buildFlashcard(currentRevisionChapter);
  }, [currentRevisionChapter]);

  const handleRateRevision = (rating: RetentionRating) => {
    if (!currentRevisionChapter) return;
    const updated = recordRevision(
      completedChapters,
      currentRevisionChapter.chapterId,
      rating,
      revisionScratchpad.trim() ? revisionScratchpad : undefined
    );
    setCompletedChapters(updated);
    playSuccessChime();
    toast({
      title: rating === "hard" ? "Reinforcement Scheduled" : "Retention Advanced!",
      description:
        rating === "hard"
          ? "Interval reset to 1 day for reinforcement."
          : `Stage updated for ${currentRevisionChapter.chapterTitle}.`,
    });
    setIsRevisionRevealed(false);
    setRevisionScratchpad("");
    if (revisionIndex < dueRevisionList.length - 1) {
      setRevisionIndex((prev) => prev + 1);
    } else {
      setRevisionIndex(0);
    }
  };

  const handleToggleStar = (chapterId: string) => {
    const updated = toggleChapterStar(completedChapters, chapterId);
    setCompletedChapters(updated);
  };

  const handleUnlockDistractionWithAnswer = () => {
    if (distractionRecallInput.trim().length < 5 && !isDistractionHintRevealed) {
      toast({
        title: "Active Recall Required to Unlock",
        description: "Write at least 1 key invariant or click 'Need a hint?' to prove your focus.",
      });
      return;
    }
    if (soundEnabled) playSuccessChime();
    setDistractionRecallInput("");
    setIsDistractionHintRevealed(false);
    setShowDistractionOverlay(false);
    resumeTimer();
  };

  // Resolve current active day in curriculum
  const activeDayPlan = useMemo(() => {
    const targetDay = dayNumber || activeSession?.day || 1;
    return curriculum.days.find((d) => d.day === targetDay) || curriculum.days[0];
  }, [dayNumber, activeSession?.day]);

  // Current chapter being studied
  const currentChapter: StudyChapterRef = useMemo(() => {
    if (activeSession) {
      return {
        id: activeSession.chapterId,
        title: activeSession.chapterTitle,
        studyUrl: activeSession.chapterUrl,
        stack: activeSession.stack,
        estimatedMinutes: activeSession.targetMinutes,
      };
    }
    if (initialChapter) return initialChapter;
    return (
      activeDayPlan.chapters[0] || {
        id: "10-frontend/10.1-javascript/01-execution-and-scope/10.1.1.01-execution-context.md",
        title: "Execution Context",
        studyUrl: "https://study.buildora.work/10-frontend/10.1-javascript/01-execution-and-scope/10.1.1.01-execution-context.md",
        stack: "10-frontend",
        estimatedMinutes: 20,
      }
    );
  }, [activeSession, initialChapter, activeDayPlan]);

  // Compute Next Goal
  const nextGoal: NextStudyGoal | null = useMemo(() => {
    return getNextStudyGoal(currentChapter.id, curriculum.days as any, completedIds);
  }, [currentChapter.id, completedIds]);

  // Calculate day completion percentage
  const todayProgress = useMemo(() => {
    const totalToday = activeDayPlan.chapters.length || 1;
    const completedTodayCount = activeDayPlan.chapters.filter((ch) =>
      completedIds.has(ch.id)
    ).length;
    return {
      completed: completedTodayCount,
      total: totalToday,
      percent: Math.round((completedTodayCount / totalToday) * 100),
    };
  }, [activeDayPlan, completedIds]);

  // Preserve and restore document title
  useEffect(() => {
    if (!open) return;
    originalTitleRef.current = document.title;
    return () => {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, [open]);

  // Listen for global break lounge open triggers
  useEffect(() => {
    const handleOpenBreak = () => setShowBreakLounge(true);
    window.addEventListener("portfolio-open-break-lounge", handleOpenBreak);
    return () => window.removeEventListener("portfolio-open-break-lounge", handleOpenBreak);
  }, []);

  // ─── ACTIONS ────────────────────────────────────────────────────────────────
  const pauseTimer = useCallback(() => {
    setActiveSession((prev) => {
      if (!prev || prev.pausedAt !== undefined) return prev;
      return { ...prev, pausedAt: Date.now() };
    });
  }, [setActiveSession]);

  const resumeTimer = useCallback(() => {
    setActiveSession((prev) => {
      if (!prev || prev.pausedAt === undefined) return prev;
      const pauseDuration = Date.now() - prev.pausedAt;
      return {
        ...prev,
        pausedMs: prev.pausedMs + pauseDuration,
        pausedAt: undefined,
      };
    });
    setShowDistractionOverlay(false);
    if (originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }
  }, [setActiveSession]);

  // Clean up ambient audio drone on unmount
  useEffect(() => {
    return () => {
      if (droneRef.current) {
        droneRef.current.stop();
        droneRef.current = null;
      }
    };
  }, []);

  const toggleAmbientDrone = useCallback(() => {
    if (!droneRef.current) {
      droneRef.current = new AmbientFocusDrone();
    }
    if (ambientPlaying) {
      droneRef.current.stop();
      setAmbientPlaying(false);
      toast({
        title: "Ambient Sound Off",
        description: "432Hz Alpha focus tone silenced.",
      });
    } else {
      droneRef.current.start(0.06);
      setAmbientPlaying(true);
      toast({
        title: "Ambient Focus Sound Active",
        description: "432Hz Alpha focus tone engaged to drown out environmental distractions.",
      });
    }
  }, [ambientPlaying]);

  const startSession = useCallback(
    (chapter: StudyChapterRef, day: number, date: string, customMinutes?: number) => {
      const duration = customMinutes || selectedSprintMinutes || chapter.estimatedMinutes || 25;
      const newSession: ActiveStudySession = {
        id: `study_${Date.now().toString(36)}`,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterUrl: chapter.studyUrl,
        stack: chapter.stack || "General",
        day,
        date,
        startedAt: Date.now(),
        pausedMs: 0,
        targetMinutes: duration,
        distractionCount: 0,
        attentionChecksTotal: 0,
        attentionChecksPassed: 0,
        strictLockdown: true,
        notes: "",
        originDeviceId: getClientDeviceId(),
        originDeviceType: isMobilePhoneDevice() ? "mobile" : "desktop",
        originDeviceName: getDeviceDisplayName(),
        blockMobileDevices: true,
      };
      setActiveSession(newSession, { immediate: true });
    },
    [setActiveSession, selectedSprintMinutes]
  );

  // ─── TAB SWITCH & DISTRACTION MONITORING ─────────────────────────────────────
  useEffect(() => {
    if (!open || !activeSession) return;

    const handleDistraction = () => {
      // User switched tab or unfocused window
      if (document.visibilityState === "hidden" || !document.hasFocus()) {
        if (soundEnabled) playDistractionWarning();
        document.title = "[DISTRACTION DETECTED] Return to Study!";

        setActiveSession((prev) => {
          if (!prev) return prev;
          const isPaused = prev.pausedAt !== undefined;
          return {
            ...prev,
            distractionCount: prev.distractionCount + 1,
            // In strict lockdown, pause timer immediately
            pausedAt: strictLockdown && !isPaused ? Date.now() : prev.pausedAt,
          };
        });

        if (strictLockdown) {
          setShowDistractionOverlay(true);
        }
      } else {
        // Returned to tab
        document.title = originalTitleRef.current || "NOVA | Deep Study Cockpit";
      }
    };

    const onVisibilityChange = () => handleDistraction();
    const onBlur = () => handleDistraction();
    const onFocus = () => {
      if (!strictLockdown) {
        document.title = originalTitleRef.current;
      }
    };

    const onFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull && strictLockdown && activeSession && !showDistractionOverlay) {
        if (soundEnabled) playDistractionWarning();
        setShowDistractionOverlay(true);
      }
    };

    // BeforeUnload confirmation
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You have an active deep study session in progress. Leave?";
      return e.returnValue;
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, [open, activeSession, strictLockdown, soundEnabled, showDistractionOverlay, setActiveSession]);

  // ─── PERIODIC ATTENTION CHECK TIMER (EVERY 15 MINUTES) ──────────────────────
  useEffect(() => {
    if (!open || !activeSession || activeSession.pausedAt !== undefined) return;

    // Check attention every 15 minutes of elapsed study
    const timer = setInterval(() => {
      if (soundEnabled) playAttentionPing();
      setShowAttentionCheck(true);
      setAttentionSecondsLeft(60);
      setActiveSession((prev) =>
        prev ? { ...prev, attentionChecksTotal: prev.attentionChecksTotal + 1 } : prev
      );
    }, 15 * 60 * 1000);

    return () => clearInterval(timer);
  }, [open, activeSession, soundEnabled, setActiveSession]);

  // Attention check countdown
  useEffect(() => {
    if (!showAttentionCheck) return;
    const interval = setInterval(() => {
      setAttentionSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer ran out! Auto-pause session due to lapse
          if (soundEnabled) playDistractionWarning();
          pauseTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showAttentionCheck, soundEnabled, pauseTimer]);

  const toggleTimer = () => {
    if (activeSession?.pausedAt !== undefined) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not permitted
    }
  };

  // Confirm attention check
  const handleConfirmAttention = () => {
    setShowAttentionCheck(false);
    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            attentionChecksPassed: prev.attentionChecksPassed + 1,
            notes: attentionRecallInput.trim()
              ? `${prev.notes}\n• [Recall Invariant]: ${attentionRecallInput.trim()}`
              : prev.notes,
          }
        : prev
    );
    setAttentionRecallInput("");
    if (activeSession?.pausedAt !== undefined) {
      resumeTimer();
    }
    toast({
      title: "Attention Verified",
      description: "Deep study sprint resumed at maximum focus.",
    });
  };

  // MARK CHAPTER COMPLETE
  const handleMarkChapterDone = () => {
    if (!activeSession) return;
    if (soundEnabled) playSuccessChime();

    const elapsedMs = getStudyElapsedMs(activeSession, now);
    const durationMinutes = Math.max(1, Math.round(elapsedMs / (60 * 1000)));

    const record: CompletedChapterRecord = {
      chapterId: currentChapter.id,
      chapterTitle: currentChapter.title,
      stack: currentChapter.stack || "General",
      day: activeSession.day,
      date: activeSession.date,
      completedAt: new Date().toISOString(),
      durationMinutes,
      distractions: activeSession.distractionCount,
      notes: (activeSession.notes || "").trim(),
    };

    // 1. Save completed chapter
    setCompletedChapters((prev) => [record, ...(prev || [])]);

    // 2. Mark corresponding roadmap item in career execution state
    const itemId = `career:${activeSession.date}:study`;
    setCareerState((prev: any) => ({
      ...prev,
      evidenceByItemId: {
        ...(prev.evidenceByItemId || {}),
        [itemId]: {
          evidence: {
            value: `Studied: ${currentChapter.title}. Invariant Notes: ${(activeSession.notes || "").trim() || "Completed in deep study cockpit."}`,
            sourceUrl: currentChapter.studyUrl,
            confirmed: true,
          },
          completedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
        },
      },
    }));

    // 3. Set Next Goal for immediate celebration & prompt
    if (nextGoal) {
      setJustCompletedGoal(nextGoal);
    }

    // 4. Reset active session
    setActiveSession(null);

    toast({
      title: "Chapter Completed!",
      description: `Marked "${currentChapter.title}" as complete with ${record.distractions} distractions.`,
    });
  };

  // Start Next Chapter Immediately
  const handleStartNextChapter = (next: NextStudyGoal) => {
    setJustCompletedGoal(null);
    const newSession: ActiveStudySession = {
      id: `study_${Date.now().toString(36)}`,
      chapterId: next.chapter.id,
      chapterTitle: next.chapter.title,
      chapterUrl: next.chapter.studyUrl,
      stack: next.chapter.stack || "General",
      day: next.day,
      date: next.date,
      startedAt: Date.now(),
      pausedMs: 0,
      targetMinutes: next.chapter.estimatedMinutes || 25,
      distractionCount: 0,
      attentionChecksTotal: 0,
      attentionChecksPassed: 0,
      strictLockdown: true,
      notes: "",
    };
    setActiveSession(newSession);
    toast({
      title: "Next Goal Activated",
      description: `Now studying: ${next.chapter.title}`,
    });
  };

  if (!mounted || !open) return null;

  const isPaused = activeSession?.pausedAt !== undefined;
  const elapsedMs = activeSession ? getStudyElapsedMs(activeSession, now) : 0;
  const targetMs = (activeSession?.targetMinutes || 25) * 60 * 1000;
  const timePercent = Math.min(100, Math.round((elapsedMs / targetMs) * 100));

  return createPortal(
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Deep Study & Distraction Prevention Cockpit"
      className="fixed inset-0 z-[120] flex flex-col bg-background text-foreground animate-in fade-in-0 duration-200"
    >
      {/* ─── COCKPIT TOP CONTROL BAR ────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-card/95 px-4 shadow-xs backdrop-blur-md">
        {/* Left: Topic Title & Stack */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-foreground line-clamp-1">
                {currentChapter.title}
              </span>
              <span className="hidden sm:inline rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                Day {activeDayPlan.day}
              </span>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground line-clamp-1">
              {currentChapter.stack} · {currentChapter.estimatedMinutes || 25} min target
            </p>
          </div>
        </div>

        {/* Center: Live Timer & Distraction Status OR Start Sprint CTA */}
        {activeSession ? (
          <div className="flex items-center gap-4">
            {/* Distraction Shield Indicator */}
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("portfolio-trigger-distraction-shield", {
                    detail: { url: "https://instagram.com" },
                  })
                )
              }
              className={cn(
                "hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-semibold border transition-all cursor-pointer hover:scale-105 active:scale-95",
                (activeSession.distractionCount || 0) === 0
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-500"
              )}
              title="Click to view Germany Goal Guardian & Distraction Shield"
            >
              {(activeSession.distractionCount || 0) === 0 ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              )}
              <span>
                {(activeSession.distractionCount || 0) === 0
                  ? "Distraction Shield: Active"
                  : `${activeSession.distractionCount} Tab Switches`}
              </span>
            </button>

            {/* 10 PM Bedtime Curfew Indicator */}
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("portfolio-trigger-night-curfew", {
                    detail: { openSettings: true },
                  })
                )
              }
              className="hidden md:flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-semibold border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="10:00 PM Bedtime Curfew & Phone Lockdown Settings"
            >
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
              <span>10 PM Curfew</span>
            </button>

            {/* Clock & Controls */}
            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-sm sm:text-base font-bold tabular-nums text-foreground">
                {formatStudyClock(elapsedMs)}
              </span>
              <button
                type="button"
                onClick={toggleTimer}
                className="ml-1 flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
                title={isPaused ? "Resume Timer" : "Pause Timer"}
              >
                {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-500" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => startSession(currentChapter, activeDayPlan.day, activeDayPlan.date)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 font-display text-xs font-bold text-primary-foreground hover:opacity-90 active:scale-95 shadow-xs transition-all cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Start Deep Study Sprint ({currentChapter.estimatedMinutes || 25}m)</span>
            </button>
          </div>
        )}

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Ambient 432Hz Focus Drone Toggle */}
          <button
            type="button"
            onClick={toggleAmbientDrone}
            className={cn(
              "flex h-8 items-center gap-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
              ambientPlaying
                ? "border-primary bg-primary/20 text-primary shadow-xs"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
            title={ambientPlaying ? "432Hz Alpha Focus Drone: Playing (click to mute)" : "Enable 432Hz Alpha Focus Drone (sound generator)"}
          >
            <Headphones className={cn("h-3.5 w-3.5", ambientPlaying && "animate-pulse")} />
            <span className="hidden sm:inline text-[11px] font-mono">
              {ambientPlaying ? "432Hz On" : "432Hz Audio"}
            </span>
          </button>

          {/* Mindful Audio Break Lounge Button */}
          <button
            type="button"
            onClick={() => setShowBreakLounge(true)}
            className="flex h-8 items-center gap-1.5 px-2.5 rounded-lg border border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
            title="Take a Break: YouTube Music & Top 10 Tech Podcasts"
          >
            <Coffee className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px]">Break Lounge</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground transition-colors"
            title={soundEnabled ? "Audio Cues Enabled" : "Mute Audio Cues"}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {/* Fullscreen Lockdown Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Strict Fullscreen Lockdown"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Toggle Side Panel */}
          <button
            type="button"
            onClick={() => setSidePanelOpen((prev) => !prev)}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Brain className="h-3.5 w-3.5 text-primary" />
            <span>{sidePanelOpen ? "Hide Progress" : "Show Progress"}</span>
          </button>

          {/* Close / Minimize */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-1"
            title="Minimize Cockpit (Timer continues)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ─── MAIN STUDY CANVAS & READER ─────────────────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left/Center Pane: Embedded Study Reader */}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-muted/10">
          {/* Reader Sub-Bar */}
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2 text-xs">
            <div className="flex items-center gap-2 overflow-hidden text-muted-foreground">
              <Globe className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="font-mono text-[11px] truncate">
                {currentChapter.studyUrl}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIframeKey((prev) => prev + 1);
                  toast({
                    title: "Reader Reloaded",
                    description: "Refreshed study frame content.",
                  });
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                title="Reload study reader iframe"
              >
                <RotateCw className="h-3 w-3" />
                <span className="hidden sm:inline">Reload</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (navigator?.clipboard) {
                    await navigator.clipboard.writeText(currentChapter.studyUrl);
                    setCopiedChapterUrl(true);
                    setTimeout(() => setCopiedChapterUrl(false), 2000);
                    toast({
                      title: "Link Copied!",
                      description: `Copied chapter URL: ${currentChapter.title}`,
                    });
                  }
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                title="Copy chapter link to clipboard"
              >
                {copiedChapterUrl ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{copiedChapterUrl ? "Copied" : "Copy Link"}</span>
              </button>

              <a
                href={currentChapter.studyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-utility text-xs text-primary hover:underline ml-1"
              >
                <span>Open externally</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Embedded Study Iframe */}
          <div className="relative flex-1 w-full bg-background overflow-hidden">
            <iframe
              key={iframeKey}
              src={currentChapter.studyUrl}
              title={`Study: ${currentChapter.title}`}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </main>

        {/* Right Pane: Goal Tracking, Invariants, Notes & Mastered History */}
        {sidePanelOpen && (
          <aside className="w-full md:w-88 lg:w-96 border-l border-border/80 bg-card p-4 sm:p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            <div>
              {/* Tab Selector: Focus Sprint vs Active Recall Revision vs Mastered History */}
              <div className="flex rounded-xl bg-muted/40 p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("focus")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                    activeTab === "focus"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Brain className="h-3.5 w-3.5 text-primary" />
                  <span>Focus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("revision")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer relative",
                    activeTab === "revision"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                  <span>Recall{dueRevisionList.length > 0 ? ` (${dueRevisionList.length})` : ""}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                    activeTab === "history"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <History className="h-3.5 w-3.5 text-primary" />
                  <span>Mastered</span>
                </button>
              </div>

              {activeTab === "focus" ? (
                <>
                  {/* Daily Progress Widget */}
                  <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-utility text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Today&apos;s Curriculum Progress
                      </span>
                      <span className="font-mono text-xs font-bold text-primary">
                        {todayProgress.percent}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${todayProgress.percent}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>{todayProgress.completed} of {todayProgress.total} chapters completed</span>
                      <span>Day {activeDayPlan.day} of 100</span>
                    </div>

                    {/* Sprint Duration Preset Chips */}
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-1 text-xs">
                      <span className="font-utility text-[11px] text-muted-foreground">Sprint Block:</span>
                      <div className="flex items-center gap-1">
                        {[15, 25, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => {
                              setSelectedSprintMinutes(mins);
                              if (activeSession && activeSession.pausedAt !== undefined) {
                                setActiveSession((prev) => (prev ? { ...prev, targetMinutes: mins } : prev));
                              }
                            }}
                            className={cn(
                              "rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold transition-all cursor-pointer",
                              (activeSession?.targetMinutes || selectedSprintMinutes) === mins
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Session Action: Start Sprint or Mark Complete */}
                  {!activeSession ? (
                    <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-4 text-center">
                      <ShieldCheck className="h-7 w-7 text-primary mx-auto mb-2" />
                      <h4 className="font-display font-bold text-sm text-foreground">Anti-Distraction Shield</h4>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        Activate tab-switch monitoring, attention recall pings &amp; focused timing for this chapter.
                      </p>
                      <button
                        type="button"
                        onClick={() => startSession(currentChapter, activeDayPlan.day, activeDayPlan.date, selectedSprintMinutes)}
                        className="mt-3.5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 font-display text-sm font-bold text-primary-foreground hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-md"
                      >
                        <Play className="h-4 w-4" />
                        <span>Begin Deep Study Sprint ({selectedSprintMinutes}m)</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleMarkChapterDone}
                      className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 font-display text-sm font-bold text-primary-foreground shadow-md hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark Chapter Complete</span>
                    </button>
                  )}

                  {/* Up Next / Next Goal Card */}
                  {nextGoal && (
                    <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-primary">
                          <Flame className="h-3.5 w-3.5" />
                          UP NEXT / NEXT GOAL
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {nextGoal.isToday ? "Today's Queue" : `Day ${nextGoal.day}`}
                        </span>
                      </div>
                      <h4 className="mt-1 font-display text-sm font-bold text-foreground">
                        {nextGoal.chapter.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                        Est. {nextGoal.chapter.estimatedMinutes || 20} mins · {nextGoal.chapter.stack}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleStartNextChapter(nextGoal)}
                        className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-card py-1.5 px-3 font-utility text-xs font-semibold text-foreground hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <span>Jump to Next Chapter</span>
                        <ArrowRight className="h-3.5 w-3.5 text-primary" />
                      </button>
                    </div>
                  )}

                  {/* Quick Invariants & Notes Scratchpad */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="study-notes" className="font-utility text-xs font-semibold text-foreground">
                        Chapter Invariants &amp; Key Ideas
                      </label>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Auto-saved as verification evidence
                      </span>
                    </div>
                    <textarea
                      id="study-notes"
                      rows={4}
                      value={activeSession?.notes || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveSession((prev) => (prev ? { ...prev, notes: val } : prev));
                      }}
                      placeholder="Note key invariant, code example, or failure mode..."
                      className="mt-2 w-full rounded-xl border border-border/80 bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none shadow-inner"
                    />
                  </div>

                  {/* Distraction Defenses Status */}
                  <div className="mt-4 space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Strict Tab-Switch Guard:</span>
                      <button
                        type="button"
                        onClick={() => setStrictLockdown((prev) => !prev)}
                        className={cn(
                          "rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors",
                          strictLockdown
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {strictLockdown ? "ENFORCED" : "OFF"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Attention Checks:</span>
                      <span className="font-mono font-semibold text-foreground">
                        {activeSession?.attentionChecksPassed || 0} passed / {activeSession?.attentionChecksTotal || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Distractions:</span>
                      <span
                        className={cn(
                          "font-mono font-bold",
                          (activeSession?.distractionCount || 0) === 0 ? "text-emerald-500" : "text-amber-500"
                        )}
                      >
                        {activeSession?.distractionCount || 0} tab switches
                      </span>
                    </div>
                  </div>

                  {/* All-time Study Analytics Mini-Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-2">
                      <span className="block font-mono text-sm font-bold text-foreground">{analytics.totalCompleted}</span>
                      <span className="block text-[10px] text-muted-foreground font-utility">Mastered</span>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-2">
                      <span className="block font-mono text-sm font-bold text-primary">{analytics.totalMinutes}m</span>
                      <span className="block text-[10px] text-muted-foreground font-utility">Focused</span>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-2">
                      <span className="block font-mono text-sm font-bold text-emerald-500">{analytics.distractionFreePercentage}%</span>
                      <span className="block text-[10px] text-muted-foreground font-utility">Clean Focus</span>
                    </div>
                  </div>
                </>
              ) : activeTab === "revision" ? (
                /* Active Recall Revision Tab */
                <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                  {/* Spaced Repetition Due Queue Header */}
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                        <RotateCcw className="h-4 w-4" />
                        <span>Due for Revision ({dueRevisionList.length})</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">Ebbinghaus SRS</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Active recall flashcards for mastered topics. Review before forgetting sets in.
                    </p>
                  </div>

                  {currentRevisionChapter && currentRevisionCard ? (
                    <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-3 shadow-xs">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="inline-block rounded-md bg-primary/15 text-primary text-[10px] font-mono font-semibold px-1.5 py-0.5 mb-1">
                            Day {currentRevisionCard.day} · {currentRevisionCard.stack}
                          </span>
                          <h4 className="font-display text-xs font-bold text-foreground leading-snug">
                            {currentRevisionCard.chapterTitle}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleStar(currentRevisionChapter.chapterId)}
                          className="text-muted-foreground hover:text-amber-400 transition-colors p-1"
                          title={currentRevisionChapter.starred ? "Unstar topic" : "Star as high-yield topic"}
                        >
                          <Star className={cn("h-4 w-4", currentRevisionChapter.starred && "fill-amber-400 text-amber-400")} />
                        </button>
                      </div>

                      {/* Stage & Overdue info */}
                      {(() => {
                        const stat = getRevisionStatus(currentRevisionChapter);
                        return (
                          <div className="flex items-center justify-between text-[10px] font-mono rounded bg-muted/30 px-2 py-1">
                            <span className="text-muted-foreground">Stage {stat.stage} ({stat.intervalDays}d interval)</span>
                            <span className={stat.daysOverdue > 0 ? "text-rose-400 font-bold" : "text-amber-400 font-medium"}>
                              {stat.daysOverdue > 0 ? `${stat.daysOverdue}d overdue` : "Due today"}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Interview Recall Prompt */}
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                          Active Recall Question
                        </p>
                        <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                          {currentRevisionCard.interviewQuestion}
                        </p>
                      </div>

                      {/* Scratchpad */}
                      <div>
                        <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                          Mental Recall / Notes Scratchpad:
                        </label>
                        <textarea
                          value={revisionScratchpad}
                          onChange={(e) => setRevisionScratchpad(e.target.value)}
                          rows={2}
                          placeholder="Type your recall invariants before checking..."
                          className="w-full rounded-lg border border-border/70 bg-background p-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                        />
                      </div>

                      {/* Reveal Answer / Notes Toggle */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setIsRevisionRevealed((prev) => !prev)}
                          className="w-full rounded-lg border border-border/70 bg-muted/30 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          {isRevisionRevealed ? "Hide Verified Notes" : "Reveal Verified Notes & Solution"}
                        </button>

                        {isRevisionRevealed && (
                          <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 space-y-1.5 animate-fadeIn">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Your Mastered Notes</p>
                            <p className="text-xs text-foreground/90 leading-relaxed font-mono whitespace-pre-wrap">
                              {currentRevisionCard.notes || "No custom notes recorded during study sprint. Check curriculum practice task below."}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-1">Practice Task</p>
                            <p className="text-[11px] text-muted-foreground">{currentRevisionCard.practiceTask}</p>
                          </div>
                        )}
                      </div>

                      {/* Self-Rating SRS Buttons */}
                      <div className="space-y-1 pt-1">
                        <p className="text-[10px] font-mono text-muted-foreground text-center">Rate your retention to reschedule:</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRateRevision("hard")}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            Hard (1d)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRateRevision("good")}
                            className="rounded-lg border border-amber-500/30 bg-amber-500/10 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                          >
                            Good (+1)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRateRevision("easy")}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          >
                            Easy (+2)
                          </button>
                        </div>
                      </div>

                      {/* Study Again In Cockpit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const ch = curriculum.days
                            .flatMap((d) => d.chapters)
                            .find((c) => c.id === currentRevisionChapter.chapterId);
                          if (ch) {
                            startSession(ch, currentRevisionChapter.day, currentRevisionChapter.date);
                            setActiveTab("focus");
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Re-read this Chapter in Cockpit</span>
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 py-8 px-4 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                      <p className="font-display text-xs font-bold text-foreground">Zero Topics Overdue!</p>
                      <p className="text-[11px] text-muted-foreground">
                        You are 100% on track with spaced repetition. The forgetting curve is conquered.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("history")}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <span>Browse all {completedChapters.length} mastered chapters →</span>
                      </button>
                    </div>
                  )}

                  {/* Due Queue List below */}
                  {dueRevisionList.length > 1 && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">
                        Other Due Topics ({dueRevisionList.length}):
                      </p>
                      {dueRevisionList.map((item, idx) => {
                        const stat = getRevisionStatus(item);
                        return (
                          <button
                            key={item.chapterId}
                            type="button"
                            onClick={() => {
                              setRevisionIndex(idx);
                              setIsRevisionRevealed(false);
                              setRevisionScratchpad("");
                            }}
                            className={cn(
                              "w-full flex items-center justify-between rounded-lg border p-2 text-left transition-all cursor-pointer text-xs",
                              idx === revisionIndex
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border/60 bg-muted/10 text-muted-foreground hover:bg-muted/30"
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold truncate text-[11px]">{item.chapterTitle}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{item.stack}</p>
                            </div>
                            <span className="font-mono text-[9px] text-amber-400 shrink-0">
                              {stat.daysOverdue > 0 ? `${stat.daysOverdue}d overdue` : "Due today"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Mastered Chapters History Tab */
                <div className="space-y-3">
                  {/* Search filter */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Filter mastered chapters..."
                      className="w-full rounded-xl border border-border/70 bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none font-mono"
                    />
                  </div>

                  {completedChapters && completedChapters.length > 0 ? (
                    <div className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1">
                      {completedChapters
                        .filter((c) =>
                          historySearch.trim()
                            ? c.chapterTitle.toLowerCase().includes(historySearch.toLowerCase()) ||
                              c.stack.toLowerCase().includes(historySearch.toLowerCase()) ||
                              c.notes.toLowerCase().includes(historySearch.toLowerCase())
                            : true
                        )
                        .map((item, idx) => (
                          <div
                            key={`${item.chapterId}-${idx}`}
                            className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1.5 transition-all hover:border-primary/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-display text-xs font-bold text-foreground leading-snug">
                                {item.chapterTitle}
                              </h5>
                              <span
                                className={cn(
                                  "rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold shrink-0",
                                  item.distractions === 0
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                )}
                              >
                                {item.distractions === 0 ? "Clean Focus" : `${item.distractions} alerts`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                              <span>{item.durationMinutes}m focused</span>
                              <span>·</span>
                              <span className="truncate">{item.stack}</span>
                            </div>

                            {item.notes && (
                              <p className="rounded-lg bg-background/80 p-2 font-mono text-[10px] text-foreground/80 leading-relaxed line-clamp-3">
                                {item.notes}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const ch = curriculum.days
                                  .flatMap((d) => d.chapters)
                                  .find((c) => c.id === item.chapterId);
                                if (ch) {
                                  startSession(ch, item.day, item.date);
                                  setActiveTab("focus");
                                }
                              }}
                              className="mt-1 inline-flex items-center gap-1 font-utility text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                            >
                              <span>Re-read in Cockpit →</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 py-10 text-center space-y-2">
                      <History className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                      <p className="font-display text-xs font-bold text-foreground">No Chapters Mastered Yet</p>
                      <p className="text-[11px] text-muted-foreground px-4">
                        Complete your first chapter sprint and your verification notes will be logged here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full text-center font-utility text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close Cockpit (Session continues in background)
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ─── MODAL 1: DISTRACTION / TAB-SWITCH OPAQUE QUESTION GATE ──────── */}
      {showDistractionOverlay && (
        <div className="fixed inset-0 z-[250] flex flex-col justify-between bg-slate-950/98 backdrop-blur-3xl text-white p-6 sm:p-10 overflow-y-auto animate-in fade-in-0 duration-200">
          <header className="flex items-center justify-between border-b border-white/10 pb-4 max-w-3xl w-full mx-auto">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Tab Switch Intercepted // Study Attention Guard
                </span>
                <h3 className="font-display text-sm font-bold text-white">
                  Active Focus Checkpoint for {currentChapter.title}
                </h3>
              </div>
            </div>
            <div className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-xs font-mono font-bold text-rose-300">
              {activeSession?.distractionCount || 1} Tab Switch{(activeSession?.distractionCount || 1) > 1 ? "es" : ""}
            </div>
          </header>

          <main className="max-w-3xl w-full mx-auto py-8 space-y-6">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex items-start gap-3">
              <Flame className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-300">
                  Germany Blue Card Stakes (€75k–€85k Target in Berlin/Munich)
                </p>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  You navigated away from your study reader. In strict lockdown mode, your timer is paused.
                  Prove your neural engagement: answer this relevant interview question from today&apos;s curriculum before unlocking!
                </p>
              </div>
            </div>

            {/* RELEVANT QUESTION */}
            <div className="rounded-2xl border border-white/15 bg-slate-900/90 p-6 sm:p-8 space-y-4 shadow-2xl backdrop-blur-xl">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  Curriculum Interview Question
                </span>
                <h2 className="mt-1.5 font-display text-lg sm:text-xl font-extrabold text-white leading-snug">
                  {activeDayPlan.interviewQuestions[0] ||
                    `What are the critical architectural invariants, trade-offs, and failure modes of ${currentChapter.title}?`}
                </h2>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-400">
                  Your Active Recall Answer / Invariant:
                </label>
                <textarea
                  rows={4}
                  value={distractionRecallInput}
                  onChange={(e) => setDistractionRecallInput(e.target.value)}
                  placeholder="Explain the invariant in your own words to unlock your study session..."
                  className="w-full rounded-xl border border-white/20 bg-slate-950/80 p-3.5 font-mono text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDistractionHintRevealed((prev) => !prev)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isDistractionHintRevealed ? "Hide Model Answer" : "Need a hint? Reveal Model Answer"}</span>
                </button>
              </div>

              {isDistractionHintRevealed && (
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-2 font-mono text-xs text-slate-300 animate-in fade-in-0 duration-150">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Model Guidance from Curriculum:
                  </span>
                  <p className="leading-relaxed">
                    {activeDayPlan.practiceTask || activeDayPlan.mission}
                  </p>
                </div>
              )}
            </div>
          </main>

          <footer className="border-t border-white/10 pt-4 max-w-3xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-slate-400">
              German companies (Personio, n8n, SumUp) screen for verbal precision and mental composure under pressure.
            </span>
            <button
              type="button"
              onClick={handleUnlockDistractionWithAnswer}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 text-xs sm:text-sm transition-all shadow-xl shadow-amber-500/20 cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Verify Answer &amp; Resume Study Reader</span>
            </button>
          </footer>
        </div>
      )}

      {/* ─── MODAL 2: ATTENTION CHECK / RECALL OPAQUE QUESTION GATE ─────── */}
      {showAttentionCheck && (
        <div className="fixed inset-0 z-[250] flex flex-col justify-between bg-slate-950/98 backdrop-blur-3xl text-white p-6 sm:p-10 overflow-y-auto animate-in fade-in-0 duration-150">
          <header className="flex items-center justify-between border-b border-white/10 pb-4 max-w-3xl w-full mx-auto">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/40">
                <Brain className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                  15-Minute Focus Checkpoint // Periodic Attention Gate
                </span>
                <h3 className="font-display text-sm font-bold text-white">
                  Active Attention Check for {currentChapter.title}
                </h3>
              </div>
            </div>
            <div className="rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 font-mono text-xs font-bold text-amber-400 tabular-nums">
              {attentionSecondsLeft}s remaining
            </div>
          </header>

          <main className="max-w-3xl w-full mx-auto py-8 space-y-6">
            <div className="rounded-2xl border border-white/15 bg-slate-900/90 p-6 sm:p-8 space-y-4 shadow-2xl backdrop-blur-xl">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                  Active Recall Invariant Question
                </span>
                <h2 className="mt-1.5 font-display text-lg sm:text-xl font-extrabold text-white leading-snug">
                  {activeDayPlan.interviewQuestions[1] ||
                    activeDayPlan.interviewQuestions[0] ||
                    `What is the primary architectural invariant you just studied in ${currentChapter.title}?`}
                </h2>
                <p className="mt-2 text-xs text-slate-300">
                  Write at least 1 key invariant or rule you just read to trigger active recall and prevent passive reading illusions.
                </p>
              </div>

              <div className="space-y-1.5">
                <textarea
                  rows={4}
                  value={attentionRecallInput}
                  onChange={(e) => setAttentionRecallInput(e.target.value)}
                  placeholder="e.g. In React 19, server actions passed across boundaries must be serializable; closures capture the lexical scope..."
                  className="w-full rounded-xl border border-white/20 bg-slate-950/80 p-3.5 font-mono text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none shadow-inner"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs font-mono text-slate-400">
                <span className="text-primary font-bold">Goal:</span> Complete 25m focus sprint with zero mind-wandering to maintain 100% retention on today&apos;s chapter.
              </div>
            </div>
          </main>

          <footer className="border-t border-white/10 pt-4 max-w-3xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-slate-400">
              Active recall at regular intervals doubles long-term synaptic retention.
            </span>
            <button
              type="button"
              onClick={handleConfirmAttention}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-2.5 text-xs sm:text-sm transition-all shadow-xl shadow-primary/20 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Confirm Attention &amp; Continue Study Sprint</span>
            </button>
          </footer>
        </div>
      )}

      {/* ─── MODAL 3: CELEBRATION & NEXT GOAL MODAL ────────────────────── */}
      {justCompletedGoal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/90 backdrop-blur-lg animate-in zoom-in-95 duration-200">
          <div className="max-w-md w-full rounded-2xl border border-emerald-500/50 bg-card p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500 animate-bounce">
              <Trophy className="h-8 w-8" />
            </div>

            <h3 className="font-display text-xl font-bold text-foreground">
              Chapter Mastered!
            </h3>

            <p className="text-xs text-muted-foreground">
              Progress saved and evidence recorded in your verified career log.
            </p>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-left">
              <span className="font-utility text-[11px] font-bold text-primary uppercase">
                Up Next:
              </span>
              <h4 className="mt-1 font-display text-sm font-bold text-foreground">
                {justCompletedGoal.chapter.title}
              </h4>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                Est. {justCompletedGoal.chapter.estimatedMinutes || 20} mins · {justCompletedGoal.chapter.stack}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleStartNextChapter(justCompletedGoal)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-display text-sm font-bold text-primary-foreground hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <span>Start Next Chapter Now</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setJustCompletedGoal(null);
                  onClose();
                }}
                className="w-full rounded-xl border border-border/80 bg-card py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Take a 5-Minute Break &amp; Exit Cockpit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mindful Audio Break Lounge Modal (YouTube Music & Tech Podcasts) */}
      <StudyBreakLoungeModal
        open={showBreakLounge}
        onClose={() => setShowBreakLounge(false)}
      />
    </div>,
    document.body
  );
}
