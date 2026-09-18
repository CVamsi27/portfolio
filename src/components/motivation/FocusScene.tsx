"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, Check, Copy, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TRACKER_BRAND } from "@/lib/brand";
import { enterFullscreen, exitFullscreen, focusModeLabel } from "@/lib/focus-mode";
import ChapterLabel from "@/components/editorial/ChapterLabel";

type FocusSceneProps = {
  goalTitle: string;
  goalLabel: string;
  goalPct: number;
  nextMilestone: string;
  streak: number;
  quote: string;
  quoteTag?: string;
  saved?: boolean;
  copied?: boolean;
  onStartAction: () => void;
  onShuffle: () => void;
  onSave: () => void;
  onCopy?: () => void;
  onOpenGoal: () => void;
  media?: { imageUrl?: string; imageAlt?: string; attribution?: string };
};

export default function FocusScene({
  goalTitle,
  goalLabel,
  goalPct,
  nextMilestone,
  streak,
  quote,
  quoteTag = "Daily",
  saved = false,
  copied = false,
  onStartAction,
  onShuffle,
  onSave,
  onCopy,
  onOpenGoal,
  media,
}: FocusSceneProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const safePct = Math.max(0, Math.min(100, goalPct));

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const onFullscreenChange = () => {
      setActive(document.fullscreenElement === scene);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) setActive(false);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const toggleFocusMode = async () => {
    if (active) {
      await exitFullscreen();
      setActive(false);
      return;
    }

    // Keep the layout fallback active even when fullscreen is unsupported or rejected.
    await enterFullscreen(sceneRef.current as HTMLElement);
    setActive(true);
  };

  return (
    <section
      ref={sceneRef}
      data-testid="focus-scene"
      data-editorial-reveal
      data-focus-active={active ? "true" : "false"}
      data-reduced-motion="supported"
      aria-label="Motivation focus scene"
      className={cn(
        "focus-scene dossier-reveal relative isolate flex min-h-[calc(100svh-var(--app-header-height))] flex-col overflow-hidden border border-white/10 bg-[#0b0d12] px-5 py-5 text-white shadow-[10px_10px_0_rgba(255,59,48,0.22)] sm:px-8 sm:py-8 lg:px-12",
        active && "focus-scene--active",
      )}
    >
      {media?.imageUrl ? (
        <img
          data-testid="focus-media"
          src={media.imageUrl}
          alt={media.imageAlt || "Motivational visual"}
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55"
        />
      ) : null}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,16,20,0.96)_0%,rgba(7,16,20,0.72)_48%,rgba(7,16,20,0.52)_100%),linear-gradient(180deg,rgba(7,16,20,0.2),rgba(7,16,20,0.88)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,rgba(200,255,61,0.16),transparent_26%),radial-gradient(circle_at_8%_80%,rgba(255,59,48,0.2),transparent_30%)] motion-safe:animate-pulse" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(115deg,transparent_0_48%,rgba(255,255,255,0.08)_49%,transparent_50%),linear-gradient(180deg,transparent_0_72%,rgba(200,255,61,0.06)_73%,transparent_74%)] [background-size:38rem_38rem,100%_100%]" />

      <header className="flex items-start justify-between gap-4">
        <div>
          <ChapterLabel eyebrow="Motivation // Focus sequence" />
          <p className="mt-2 font-utility text-[10px] uppercase tracking-[0.12em] text-white/55">
            {active ? "Focus channel active" : "One clear move for today"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          aria-pressed={active}
          onClick={toggleFocusMode}
          className="shrink-0 border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
        >
          {active ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
          {focusModeLabel(active)}
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end lg:gap-16">
          <div>
            <p className="font-utility text-xs font-bold uppercase tracking-[0.22em] text-[#c8ff3d]">Current objective · {goalLabel}</p>
            <h1 data-testid="focus-goal" className="mt-4 max-w-4xl font-display text-5xl font-black leading-[0.95] tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl">
              {goalTitle}
            </h1>
            <div className="mt-8 max-w-2xl border-l-2 border-[#ff554d] pl-5 sm:pl-6">
              <p className="font-utility text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">Quote of the day · {quoteTag}</p>
              <blockquote className="mt-3 font-display text-2xl font-bold leading-tight text-white/95 sm:text-3xl">
                &ldquo;{quote}&rdquo;
              </blockquote>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="border border-white/15 bg-white/[0.04] p-4">
              <div className="flex items-end justify-between gap-3">
                <p className="font-utility text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Goal signal</p>
                <p className="font-display text-3xl font-black text-[#c8ff3d]">{safePct}%</p>
              </div>
              <div className="mt-3 h-2 bg-white/10" role="progressbar" aria-label="Goal progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safePct}>
                <span className="block h-full bg-[#c8ff3d] transition-[width] duration-500" style={{ width: `${safePct}%` }} />
              </div>
            </div>
            <div className="border border-white/15 bg-white/[0.04] p-4">
              <p className="font-utility text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Next milestone</p>
              <p className="mt-2 text-sm font-semibold leading-snug text-white/90">{nextMilestone}</p>
            </div>
            <div className="border border-white/15 bg-white/[0.04] p-4">
              <p className="font-utility text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Active streak</p>
              <p className="mt-2 font-display text-3xl font-black text-white">{streak} <span className="text-sm font-bold text-white/55">days</span></p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
          <Button type="button" onClick={onStartAction} className="bg-[#ff554d] text-white shadow-[5px_5px_0_rgba(200,255,61,0.72)] hover:bg-[#ff6a63]">
            <ArrowRight className="mr-2 h-4 w-4" /> Start next action
          </Button>
          <Button type="button" variant="outline" onClick={onShuffle} className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white">
            <Sparkles className="mr-2 h-4 w-4" /> Shuffle
          </Button>
          <Button type="button" variant="ghost" title="Save affirmation" onClick={onSave} className="text-white/75 hover:bg-white/10 hover:text-white">
            <Bookmark className={cn("mr-2 h-4 w-4", saved && "fill-current")} />
            {saved ? "Saved" : "Save"}
          </Button>
          {onCopy ? (
            <Button type="button" variant="ghost" onClick={onCopy} className="text-white/75 hover:bg-white/10 hover:text-white">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" onClick={onOpenGoal} className="text-white/75 hover:bg-white/10 hover:text-white">
            Open goal
          </Button>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 font-utility text-[10px] uppercase tracking-[0.14em] text-white/45">
        <span>{media?.attribution ? `${media.attribution} · ` : ""}{TRACKER_BRAND.name} · Signal locked to your current objective</span>
        <span>{active ? "Esc to exit" : "Enter focus to clear the field"}</span>
      </footer>
    </section>
  );
}
