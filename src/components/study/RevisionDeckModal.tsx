"use client";

import Modal from "@/components/trackers/Modal";
import { useMemo, useState } from "react";
import {
  RotateCcw,
  Sparkles,
  Star,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ChevronRight,
  X,
  Shuffle,
  ArrowRight,
  Filter,
  Search,
  Brain,
  Trophy,
  ShieldCheck,
  Flame,
  Layers,
} from "lucide-react";
import {
  type ExtendedCompletedChapter,
  type RetentionRating,
  getRevisionStatus,
  getDueRevisionItems,
  getStarredItems,
  recordRevision,
  toggleChapterStar,
  buildFlashcard,
  getRevisionMetrics,
  HIGH_YIELD_CURRICULUM_PRESETS,
} from "@/lib/revision-engine";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { playSuccessChime, playAttentionPing } from "@/lib/audio-cue";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface RevisionDeckModalProps {
  open: boolean;
  onClose: () => void;
  onOpenStudyCockpit?: (chapter: {
    id: string;
    title: string;
    studyUrl: string;
    stack?: string;
  }) => void;
}

type RevisionTab = "due" | "starred" | "roulette" | "all";

export default function RevisionDeckModal({
  open,
  onClose,
  onOpenStudyCockpit,
}: RevisionDeckModalProps) {
  const { value: completedChapters, setValue: setCompletedChapters } =
    useSyncedStorage<ExtendedCompletedChapter[]>(
      "study:completed_chapters",
      [],
    );

  const [activeTab, setActiveTab] = useState<RevisionTab>("due");
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [recallScratchpad, setRecallScratchpad] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [rouletteIndex, setRouletteIndex] = useState(0);

  const { toast } = useToast();

  const metrics = useMemo(() => {
    return getRevisionMetrics(completedChapters);
  }, [completedChapters]);

  const dueItems = useMemo(() => {
    return getDueRevisionItems(completedChapters);
  }, [completedChapters]);

  const starredItems = useMemo(() => {
    return getStarredItems(completedChapters);
  }, [completedChapters]);

  const currentDeck = useMemo(() => {
    if (activeTab === "starred") return starredItems;
    if (activeTab === "all") {
      return (completedChapters || []).filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.chapterTitle.toLowerCase().includes(q) ||
          item.stack.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
        );
      });
    }
    return dueItems;
  }, [activeTab, dueItems, starredItems, completedChapters, searchQuery]);

  const currentItem = currentDeck[activeCardIndex] || currentDeck[0] || null;

  const currentFlashcard = useMemo(() => {
    if (!currentItem) return null;
    return buildFlashcard(currentItem);
  }, [currentItem]);

  if (!open) return null;

  const handleNextCard = () => {
    setIsAnswerRevealed(false);
    setRecallScratchpad("");
    if (activeCardIndex < currentDeck.length - 1) {
      setActiveCardIndex((prev) => prev + 1);
    } else {
      setActiveCardIndex(0);
    }
  };

  const handleRating = (rating: RetentionRating) => {
    if (!currentItem) return;

    const updated = recordRevision(
      completedChapters,
      currentItem.chapterId,
      rating,
      recallScratchpad.trim()
        ? `${currentItem.notes || ""}\n\n[Revision Note]: ${recallScratchpad}`
        : undefined,
    );
    setCompletedChapters(updated);

    if (rating === "easy" || rating === "good") {
      playSuccessChime();
    } else {
      playAttentionPing();
    }

    toast({
      title:
        rating === "easy"
          ? "Mastery Reinforced!"
          : rating === "good"
            ? "Retention Recorded"
            : "Interval Reset to 1 Day",
      description: `Next revision for "${currentItem.chapterTitle}" scheduled in Spaced Repetition queue.`,
    });

    handleNextCard();
  };

  const handleToggleStar = (chapterId: string) => {
    const updated = toggleChapterStar(completedChapters, chapterId);
    setCompletedChapters(updated);
    toast({
      title: "Priority Updated",
      description: "Chapter marked as high-yield for interview review.",
    });
  };

  const handleRollRoulette = () => {
    playAttentionPing();
    setIsAnswerRevealed(false);
    setRecallScratchpad("");
    setRouletteIndex(
      (prev) => (prev + 1) % HIGH_YIELD_CURRICULUM_PRESETS.length,
    );
  };

  const activeRouletteItem = HIGH_YIELD_CURRICULUM_PRESETS[rouletteIndex];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Learning recall"
      className="max-w-3xl"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-border/80 bg-card p-6 shadow-2xl text-foreground flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary border border-primary/20 shrink-0">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                  Spaced Repetition // Active Recall
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  {metrics.retentionRate}% Retention Rate
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Revision & Knowledge Refresh Deck
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close recall"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-4 gap-2 py-3 border-b border-border/40 shrink-0 text-center">
          <div className="rounded-xl bg-muted/20 p-2 border border-border/40">
            <p className="font-mono text-[9px] uppercase text-muted-foreground font-semibold">
              Due Today
            </p>
            <p className="font-display text-base font-bold text-amber-400 tabular-nums">
              {metrics.dueTodayCount}
            </p>
          </div>
          <div className="rounded-xl bg-muted/20 p-2 border border-border/40">
            <p className="font-mono text-[9px] uppercase text-muted-foreground font-semibold">
              Starred High-Yield
            </p>
            <p className="font-display text-base font-bold text-primary tabular-nums">
              {metrics.starredCount}
            </p>
          </div>
          <div className="rounded-xl bg-muted/20 p-2 border border-border/40">
            <p className="font-mono text-[9px] uppercase text-muted-foreground font-semibold">
              Total Mastered
            </p>
            <p className="font-display text-base font-bold text-foreground tabular-nums">
              {metrics.totalMastered}
            </p>
          </div>
          <div className="rounded-xl bg-muted/20 p-2 border border-border/40">
            <p className="font-mono text-[9px] uppercase text-muted-foreground font-semibold">
              Revisions Done
            </p>
            <p className="font-display text-base font-bold text-emerald-400 tabular-nums">
              {metrics.totalRevisionsDone}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("due");
              setActiveCardIndex(0);
              setIsAnswerRevealed(false);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold transition-colors cursor-pointer",
              activeTab === "due"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <span>Due Today</span>
            {metrics.dueTodayCount > 0 && (
              <span className="rounded-full bg-background/30 px-1.5 py-0.2 font-mono text-[9px]">
                {metrics.dueTodayCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("starred");
              setActiveCardIndex(0);
              setIsAnswerRevealed(false);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold transition-colors cursor-pointer",
              activeTab === "starred"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>High-Yield & Starred ({metrics.starredCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("roulette");
              setIsAnswerRevealed(false);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold transition-colors cursor-pointer",
              activeTab === "roulette"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span>Curriculum Roulette</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setActiveCardIndex(0);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold transition-colors cursor-pointer ml-auto",
              activeTab === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Mastered ({metrics.totalMastered})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* ── MODE 1 & 2: FLASHCARD ACTIVE RECALL (DUE OR STARRED) ── */}
          {(activeTab === "due" || activeTab === "starred") && (
            <>
              {currentItem && currentFlashcard ? (
                <div className="rounded-2xl border border-border/80 bg-muted/15 p-5 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                          {currentFlashcard.stack}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          Day {currentFlashcard.day} · SRS Stage{" "}
                          {currentFlashcard.stage}/5
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {currentFlashcard.timesRevised} revisions done
                        </span>
                      </div>
                      <h4 className="font-display text-base font-bold text-foreground mt-1">
                        {currentFlashcard.chapterTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleStar(currentItem.chapterId)}
                        className={cn(
                          "rounded-lg p-2 border transition-colors cursor-pointer",
                          currentItem.starred
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                            : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground",
                        )}
                        title={
                          currentItem.starred
                            ? "Starred as high-yield"
                            : "Star as high-yield"
                        }
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            currentItem.starred && "fill-amber-400",
                          )}
                        />
                      </button>

                      <span className="font-mono text-xs text-muted-foreground">
                        {activeCardIndex + 1}/{currentDeck.length}
                      </span>
                    </div>
                  </div>

                  {/* Active Recall Challenge */}
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5" /> Active Recall Challenge
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                      {currentFlashcard.interviewQuestion}
                    </p>
                  </div>

                  {/* Recall Scratchpad */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-muted-foreground flex items-center justify-between">
                      <span>
                        Jot down your recall invariant before revealing:
                      </span>
                      <span className="text-[10px] opacity-70">
                        Optional practice
                      </span>
                    </label>
                    <textarea
                      value={recallScratchpad}
                      onChange={(e) => setRecallScratchpad(e.target.value)}
                      placeholder="State the core mechanism, complexity, or system invariants here…"
                      rows={2}
                      className="w-full rounded-xl border border-border/70 bg-background/60 p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Reveal Answer Button */}
                  {!isAnswerRevealed ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAnswerRevealed(true);
                        playAttentionPing();
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Reveal Verified Invariants & Answers</span>
                    </button>
                  ) : (
                    /* Revealed Invariant Section */
                    <div className="space-y-4 pt-2 border-t border-border/40 animate-in fade-in duration-200">
                      {currentFlashcard.notes ? (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1">
                          <p className="font-mono text-[10px] font-bold uppercase text-emerald-400">
                            Your Saved Mastered Notes
                          </p>
                          <p className="font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {currentFlashcard.notes}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1 text-xs">
                          <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                            Curriculum Challenge
                          </p>
                          <p className="text-foreground/90">
                            {currentFlashcard.practiceTask}
                          </p>
                        </div>
                      )}

                      {/* Reader Jump */}
                      {onOpenStudyCockpit && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-border/60 bg-muted/20 text-xs">
                          <span className="text-muted-foreground text-[11px]">
                            Need a deep refresher on this entire topic?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenStudyCockpit({
                                id: currentFlashcard.chapterId,
                                title: currentFlashcard.chapterTitle,
                                studyUrl: currentFlashcard.studyUrl,
                                stack: currentFlashcard.stack,
                              });
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 font-utility text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            <span>Open Cockpit Reader →</span>
                          </button>
                        </div>
                      )}

                      {/* Self Rating Bar */}
                      <div className="space-y-1.5 pt-1">
                        <p className="font-mono text-[10px] uppercase text-muted-foreground font-semibold text-center">
                          Rate your retention quality to adjust Spaced
                          Repetition interval
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleRating("hard")}
                            className="flex flex-col items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 hover:bg-rose-500/20 transition-all cursor-pointer text-center"
                          >
                            <span className="font-display text-xs font-bold text-rose-400">
                              Hard / Forgot
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground">
                              Reset to 1d
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRating("good")}
                            className="flex flex-col items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 hover:bg-amber-500/20 transition-all cursor-pointer text-center"
                          >
                            <span className="font-display text-xs font-bold text-amber-400">
                              Good / Recalled
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground">
                              Advance interval
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRating("easy")}
                            className="flex flex-col items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 hover:bg-emerald-500/20 transition-all cursor-pointer text-center"
                          >
                            <span className="font-display text-xs font-bold text-emerald-400">
                              Easy / Mastered
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground">
                              Jump interval
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 py-16 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <p className="font-display text-base font-bold text-foreground">
                    {activeTab === "due"
                      ? "All Caught Up on Revision!"
                      : "No Starred High-Yield Topics Yet"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {activeTab === "due"
                      ? "Zero chapters are due for spaced repetition right now. Complete more daily roadmap chapters or try Curriculum Roulette!"
                      : "Star chapters in your Mastered list or Cockpit to build your high-yield interview refresh deck."}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── MODE 3: CURRICULUM ROULETTE (HIGH-YIELD DRILL) ── */}
          {activeTab === "roulette" && activeRouletteItem && (
            <div className="rounded-2xl border border-border/80 bg-muted/15 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-400">
                  {activeRouletteItem.topic}
                </span>
                <button
                  type="button"
                  onClick={handleRollRoulette}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1 font-mono text-[11px] font-semibold text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <Shuffle className="h-3 w-3" /> Roll Next Drill
                </button>
              </div>

              <div>
                <h4 className="font-display text-base font-bold text-foreground">
                  {activeRouletteItem.title}
                </h4>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-1.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                  Architectural Challenge
                </p>
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  {activeRouletteItem.question}
                </p>
              </div>

              {!isAnswerRevealed ? (
                <button
                  type="button"
                  onClick={() => setIsAnswerRevealed(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Reveal Production Answer</span>
                </button>
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2 animate-in fade-in duration-200">
                  <p className="font-mono text-[10px] font-bold uppercase text-emerald-400">
                    Production Architecture Invariant
                  </p>
                  <p className="font-mono text-xs text-foreground/90 leading-relaxed">
                    {activeRouletteItem.answer}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleRollRoulette}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-display text-xs font-bold text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    >
                      Next Random Drill →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MODE 4: ALL MASTERED CORPUS BROWSER ── */}
          {activeTab === "all" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search mastered chapters by title, stack, notes…"
                  className="w-full rounded-xl border border-border/70 bg-card pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none font-mono"
                />
              </div>

              {currentDeck.length > 0 ? (
                <div className="space-y-2">
                  {currentDeck.map((item) => {
                    const status = getRevisionStatus(item);
                    return (
                      <div
                        key={item.chapterId}
                        className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary">
                                {item.stack}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                Stage {status.stage}/5
                              </span>
                              {status.isDue ? (
                                <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-amber-400">
                                  Due for Review
                                </span>
                              ) : (
                                <span className="font-mono text-[9px] text-muted-foreground">
                                  Due: {status.nextDueFormatted}
                                </span>
                              )}
                            </div>
                            <h5 className="font-display text-xs font-bold text-foreground mt-1 truncate">
                              {item.chapterTitle}
                            </h5>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleStar(item.chapterId)}
                            className={cn(
                              "p-1.5 rounded-lg border cursor-pointer shrink-0 transition-colors",
                              item.starred
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                : "text-muted-foreground border-border/60 hover:text-foreground",
                            )}
                          >
                            <Star
                              className={cn(
                                "h-3.5 w-3.5",
                                item.starred && "fill-amber-400",
                              )}
                            />
                          </button>
                        </div>

                        {item.notes && (
                          <p className="rounded-lg bg-muted/20 p-2 font-mono text-[10px] text-muted-foreground line-clamp-2">
                            {item.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.durationMinutes}m focused ·{" "}
                            {item.revisionCount || 0} revisions
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              onOpenStudyCockpit?.({
                                id: item.chapterId,
                                title: item.chapterTitle,
                                studyUrl: `https://study.buildora.work/${item.chapterId}`,
                                stack: item.stack,
                              });
                              onClose();
                            }}
                            className="font-utility text-xs font-semibold text-primary hover:underline cursor-pointer"
                          >
                            Refresh in Cockpit →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 py-12 text-center text-xs text-muted-foreground">
                  No chapters matching your search filter.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
