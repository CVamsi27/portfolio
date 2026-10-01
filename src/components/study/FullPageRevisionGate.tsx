"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Globe,
  Lock,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Unlock,
  Volume2,
  VolumeX,
  X,
  Zap,
  Headphones,
} from "lucide-react";
import {
  type ExtendedCompletedChapter,
  type HighYieldFlashcard,
  type RetentionRating,
  getRevisionStatus,
  getDueRevisionItems,
  getStarredItems,
  recordRevision,
  toggleChapterStar,
  buildFlashcard,
  HIGH_YIELD_CURRICULUM_PRESETS,
} from "@/lib/revision-engine";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { playSuccessChime, playAttentionPing, playDistractionWarning } from "@/lib/audio-cue";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

interface FullPageRevisionGateProps {
  open: boolean;
  onClose: () => void;
  onOpenStudyCockpit?: (chapter: {
    id: string;
    title: string;
    studyUrl: string;
    stack?: string;
  }) => void;
}

export default function FullPageRevisionGate({
  open,
  onClose,
  onOpenStudyCockpit,
}: FullPageRevisionGateProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const { value: completedChapters, setValue: setCompletedChapters } =
    useSyncedStorage<ExtendedCompletedChapter[]>("study:completed_chapters", []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [scratchpad, setScratchpad] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedInSession, setCompletedInSession] = useState<Set<string>>(() => new Set());
  const { toast } = useToast();

  const dueItems = useMemo(() => {
    return getDueRevisionItems(completedChapters || []);
  }, [completedChapters]);

  // Construct active question queue:
  // If there are due chapters, use due chapters.
  // If no chapters are due or completed yet, fall back to high-yield curriculum presets so user always has relevant questions!
  const activeDeck: HighYieldFlashcard[] = useMemo(() => {
    if (dueItems.length > 0) {
      return dueItems.map((item) => buildFlashcard(item));
    }
    if ((completedChapters || []).length > 0) {
      return completedChapters.map((item) => buildFlashcard(item));
    }
    // High-yield fallback presets from curriculum
    return HIGH_YIELD_CURRICULUM_PRESETS.map((preset, idx) => ({
      chapterId: preset.chapterId,
      chapterTitle: preset.title,
      stack: preset.topic,
      day: idx + 1,
      date: new Date().toISOString().slice(0, 10),
      interviewQuestion: preset.question,
      practiceTask: preset.answer,
      mission: "State the core invariant, failure mode, and trade-off before checking the answer.",
      studyUrl: preset.studyUrl,
      notes: preset.answer,
      timesRevised: 0,
      stage: 0,
      starred: true,
    }));
  }, [dueItems, completedChapters]);

  const currentCard = activeDeck[currentIndex] || activeDeck[0] || null;

  // Audio prompt on opening gate
  useEffect(() => {
    if (open && soundEnabled) {
      playAttentionPing();
    }
  }, [open, soundEnabled]);

  const handleNext = useCallback(() => {
    setIsAnswerRevealed(false);
    setScratchpad("");
    setCurrentIndex((prev) => (prev < activeDeck.length - 1 ? prev + 1 : 0));
  }, [activeDeck.length]);

  const handlePrev = useCallback(() => {
    setIsAnswerRevealed(false);
    setScratchpad("");
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeDeck.length - 1));
  }, [activeDeck.length]);

  // Keyboard navigation
  const handleRateRef = useRef<(rating: RetentionRating) => void>(() => {});

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" && (e.metaKey || !isInput)) {
        handleNext();
      } else if (e.key === "ArrowLeft" && (e.metaKey || !isInput)) {
        handlePrev();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        setIsAnswerRevealed((prev) => !prev);
      } else if (!isInput) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setIsAnswerRevealed((prev) => !prev);
        } else if (e.key === "1") {
          e.preventDefault();
          handleRateRef.current?.("hard");
        } else if (e.key === "2") {
          e.preventDefault();
          handleRateRef.current?.("good");
        } else if (e.key === "3") {
          e.preventDefault();
          handleRateRef.current?.("easy");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, handleNext, handlePrev]);

  const handleRate = useCallback(
    (rating: RetentionRating) => {
      if (!currentCard) return;
      if (soundEnabled) playSuccessChime();

      // Mark as completed in current session
      setCompletedInSession((prev) => new Set(prev).add(currentCard.chapterId));

      // Update SRS schedule in synced storage
      const updated = recordRevision(
        completedChapters || [],
        currentCard.chapterId,
        rating,
        scratchpad.trim() ? scratchpad : undefined
      );
      setCompletedChapters(updated);

      toast({
        title: rating === "hard" ? "Reinforcement Scheduled (1d)" : "Retention Advanced!",
        description:
          rating === "hard"
            ? "Interval reset to 1 day for reinforcement."
            : `Stage advanced for ${currentCard.chapterTitle}.`,
      });

      // Advance to next card or complete
      if (currentIndex < activeDeck.length - 1) {
        setIsAnswerRevealed(false);
        setScratchpad("");
        setCurrentIndex((prev) => prev + 1);
      } else {
        toast({
          title: "All Questions Answered!",
          description: "Spaced repetition drill complete. Long-term memory locked in.",
        });
        onClose();
      }
    },
    [
      activeDeck.length,
      completedChapters,
      currentCard,
      currentIndex,
      onClose,
      scratchpad,
      setCompletedChapters,
      soundEnabled,
      toast,
    ]
  );

  useEffect(() => {
    handleRateRef.current = handleRate;
  }, [handleRate]);

  const handleToggleStar = useCallback(() => {
    if (!currentCard) return;
    const updated = toggleChapterStar(completedChapters || [], currentCard.chapterId);
    setCompletedChapters(updated);
    toast({
      title: currentCard.starred ? "Unstarred" : "Starred High-Yield Priority",
      description: `Updated priority flag for ${currentCard.chapterTitle}`,
    });
  }, [completedChapters, currentCard, setCompletedChapters, toast]);

  const handleSnooze = useCallback((minutes = 30) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("study:revision_gate_snoozed_until", String(Date.now() + minutes * 60 * 1000));
    }
    toast({
      title: `Revision Gate Snoozed for ${minutes}m`,
      description: "Focus on your active roadmap tasks. Gate will remind you afterwards.",
    });
    onClose();
  }, [onClose, toast]);

  if (!mounted || !open || !currentCard) {
    return null;
  }

  const answeredCount = completedInSession.size;
  const progressPct = activeDeck.length > 0 ? Math.round((answeredCount / activeDeck.length) * 100) : 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Active Recall Revision Gate"
      className="fixed inset-0 z-[200] flex flex-col justify-between bg-slate-950/98 text-slate-100 backdrop-blur-3xl overflow-y-auto animate-in fade-in-0 duration-200"
    >
      {/* ─── TOP HEADER BAR ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <RotateCcw className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-white tracking-wide">
                Spaced Repetition Active Recall Gate
              </span>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                Ebbinghaus SRS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>Berlin/Munich Target · €75k–€85k Blue Card</span>
              <span>·</span>
              <span className="text-amber-400 font-semibold">
                {dueItems.length > 0 ? `${dueItems.length} Topics Due Today` : "High-Yield Curriculum Drills"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title={soundEnabled ? "Mute Chimes" : "Enable Audio Chimes"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Snooze button */}
          <button
            type="button"
            onClick={() => handleSnooze(30)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
            title="Snooze this recall gate for 30 minutes"
          >
            <span>Snooze 30m</span>
          </button>

          {/* Unlock / Close */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            title="Dismiss Gate (Return to Roadmap)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ─── MAIN QUESTION CANVAS ────────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col justify-center space-y-6">
        {/* Progress & Stepper */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              Question {currentIndex + 1} of {activeDeck.length}
            </span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-amber-300 font-bold">
              Day {currentCard.day} · {currentCard.stack}
            </span>
            {currentCard.starred && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                <Star className="h-3 w-3 fill-amber-400" /> Starred High-Yield
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleStar}
              className="text-slate-400 hover:text-amber-400 transition-colors p-1"
              title="Toggle star / priority flag"
            >
              <Star className={cn("h-4 w-4", currentCard.starred && "fill-amber-400 text-amber-400")} />
            </button>
            <span>{answeredCount} of {activeDeck.length} answered</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* OPAQUE QUESTION CARD */}
        <div className="rounded-2xl border border-white/15 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Question Tag */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block rounded-md bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Active Recall Drill · Explain Aloud First
              </span>
              <h2 className="mt-2 font-display text-xl sm:text-2xl font-extrabold text-white leading-snug tracking-tight">
                {currentCard.interviewQuestion}
              </h2>
            </div>
          </div>

          {/* Senior Interview Invariant Probes */}
          <div className="grid gap-2 sm:grid-cols-3 pt-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                1. The Invariant
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                What mathematical or architectural guarantee must NEVER break in production?
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                2. Failure Mode
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                What happens when the network partitions or memory/threads exhaust?
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
                3. The Trade-Off
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                What did you sacrifice? (e.g. latency vs consistency, write speed vs read cost)
              </p>
            </div>
          </div>

          {/* User Recall Scratchpad */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Mental Recall Scratchpad:</span>
              <span className="text-[10px] text-slate-500">Formulate your explanation before checking answer</span>
            </label>
            <textarea
              rows={4}
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
              placeholder="Type your explanation or invariants here (e.g., The transactional outbox prevents dual-write anomalies by writing domain events to an outbox table in the SAME database transaction as the entity...)"
              className="w-full rounded-xl border border-white/15 bg-slate-950/80 p-3.5 font-mono text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none shadow-inner"
            />
          </div>

          {/* Reveal Button & Model Solution */}
          <div>
            <button
              type="button"
              onClick={() => setIsAnswerRevealed((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 sm:px-6 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 py-2.5 text-xs sm:text-sm font-bold text-slate-200 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>{isAnswerRevealed ? "Hide Verified Model Solution" : "Reveal Verified Model Invariants & Solution"}</span>
              </div>
              <kbd className="hidden sm:inline-block rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-white/15">
                Space / ⌘Enter
              </kbd>
            </button>

            {isAnswerRevealed && (
              <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 space-y-3 animate-in fade-in-0 duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                    Verified Model Invariant &amp; Practice Solution
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">Curriculum Ground Truth</span>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-3.5 border border-white/10 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {currentCard.notes || currentCard.practiceTask}
                </div>

                {currentCard.practiceTask && currentCard.practiceTask !== currentCard.notes && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="block font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Practice Verification Task
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentCard.practiceTask}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Retention Self-Assessment Rating Buttons */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="text-xs font-mono text-center text-slate-400">
              Rate your retention to reschedule this topic along the Ebbinghaus forgetting curve:
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleRate("hard")}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-all cursor-pointer group active:scale-95 shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-400" />
                  <span className="font-bold text-xs sm:text-sm">Hard</span>
                  <kbd className="hidden sm:inline-block rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-mono text-rose-300 border border-rose-500/30">1</kbd>
                </div>
                <span className="text-[10px] font-mono text-rose-400/80 mt-0.5">Reset to 1d Interval</span>
              </button>
              <button
                type="button"
                onClick={() => handleRate("good")}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all cursor-pointer group active:scale-95 shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-bold text-xs sm:text-sm">Good</span>
                  <kbd className="hidden sm:inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/30">2</kbd>
                </div>
                <span className="text-[10px] font-mono text-amber-400/80 mt-0.5">Advance +1 Stage</span>
              </button>
              <button
                type="button"
                onClick={() => handleRate("easy")}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-all cursor-pointer group active:scale-95 shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-xs sm:text-sm">Easy</span>
                  <kbd className="hidden sm:inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">3</kbd>
                </div>
                <span className="text-[10px] font-mono text-emerald-400/80 mt-0.5">Advance +2 Stages</span>
              </button>
            </div>
          </div>
        </div>

        {/* Study Chapter in Cockpit button */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              onOpenStudyCockpit?.({
                id: currentCard.chapterId,
                title: currentCard.chapterTitle,
                studyUrl: currentCard.studyUrl,
                stack: currentCard.stack,
              });
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-medium"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Open &amp; Re-read this chapter in Deep Study Cockpit →</span>
          </button>

          <a
            href={currentCard.studyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <span>study.buildora.work</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </main>

      {/* ─── BOTTOM NAVIGATION & UNLOCK BAR ──────────────────────────────── */}
      <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-950/90 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent("portfolio-open-break-lounge"));
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
            title="Mindful Audio Break: YouTube Music & Top 10 Tech Podcasts"
          >
            <Headphones className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Take an Audio Break</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span>Unlock Screen &amp; Resume Roadmap</span>
          </button>
        </div>
      </footer>
    </div>,
    document.body
  );
}
