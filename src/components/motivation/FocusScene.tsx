"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  Check,
  Copy,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TRACKER_BRAND } from "@/lib/brand";
import { enterFullscreen, exitFullscreen, focusModeLabel } from "@/lib/focus-mode";
import ChapterLabel from "@/components/editorial/ChapterLabel";

type FocusMedia = {
  imageUrl?: string;
  imageAlt?: string;
  attribution?: string;
  sourceUrl?: string;
  provider?: string;
  destinationKey?: string;
  isFallback?: boolean;
};

type FocusSceneProps = {
  goalTitle: string;
  goalLabel: string;
  goalPct: number;
  nextMilestone: string;
  nextAction: string;
  streak: number;
  quote: string;
  quoteTag?: string;
  quoteAuthor?: string;
  destination?: string;
  categoryLabel?: string;
  rationale?: string;
  saved?: boolean;
  copied?: boolean;
  onStartAction: () => void;
  onShuffle: () => void;
  onSave: () => void;
  onCopy?: () => void;
  onOpenGoal: () => void;
  onRefreshMedia: () => void;
  mediaLoading?: boolean;
  media?: FocusMedia;
};

export default function FocusScene({
  goalTitle,
  goalLabel,
  goalPct,
  nextMilestone,
  nextAction,
  streak,
  quote,
  quoteTag = "Daily",
  quoteAuthor,
  destination,
  categoryLabel,
  rationale,
  saved = false,
  copied = false,
  onStartAction,
  onShuffle,
  onSave,
  onCopy,
  onOpenGoal,
  onRefreshMedia,
  mediaLoading = false,
  media,
}: FocusSceneProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState<string | undefined>();
  const [readyImageKey, setReadyImageKey] = useState<string | undefined>();
  const [displayedMedia, setDisplayedMedia] = useState<{ key: string; media?: FocusMedia }>(() => ({
    key: media?.imageUrl ?? "fallback",
    media,
  }));
  const safePct = Math.max(0, Math.min(100, goalPct));
  const mediaLabel = destination ?? goalLabel;
  const sourceLabel = media?.attribution ?? media?.provider ?? "View image source";
  const mediaKey = media?.imageUrl ?? "fallback";
  const shownMedia = displayedMedia.media;
  const pendingMedia = displayedMedia.key === mediaKey ? undefined : media;
  const imageFailed = Boolean(shownMedia?.imageUrl && failedImageUrl === displayedMedia.key);
  const pendingImageFailed = Boolean(pendingMedia?.imageUrl && failedImageUrl === mediaKey);
  const relayedImageUrl = shownMedia?.imageUrl ? `/api/motivation-image?url=${encodeURIComponent(shownMedia.imageUrl)}` : undefined;
  const pendingRelayedImageUrl = pendingMedia?.imageUrl ? `/api/motivation-image?url=${encodeURIComponent(pendingMedia.imageUrl)}` : undefined;

  const commitPendingImage = () => {
    if (!pendingMedia) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayedMedia({ key: mediaKey, media: pendingMedia });
      return;
    }
    setReadyImageKey(mediaKey);
    window.setTimeout(() => {
      setDisplayedMedia({ key: mediaKey, media: pendingMedia });
      setReadyImageKey(undefined);
    }, 650);
  };

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
      id="focus-scene"
      data-testid="focus-scene"
      data-editorial-reveal
      data-focus-active={active ? "true" : "false"}
      data-reduced-motion="supported"
      aria-label="Motivation focus scene"
      className={cn(
        "focus-scene dossier-reveal relative isolate flex min-h-0 flex-col overflow-hidden border border-white/10 bg-[#071014] py-5 text-white shadow-[10px_10px_0_rgba(255,59,48,0.22)] sm:py-8",
        active && "focus-scene--active",
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,rgba(200,255,61,0.12),transparent_28%),radial-gradient(circle_at_8%_80%,rgba(255,59,48,0.16),transparent_30%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(115deg,transparent_0_48%,rgba(255,255,255,0.08)_49%,transparent_50%),linear-gradient(180deg,transparent_0_72%,rgba(200,255,61,0.06)_73%,transparent_74%)] [background-size:38rem_38rem,100%_100%]" />

      <header className="flex items-start justify-between gap-4">
        <div>
          <ChapterLabel eyebrow={destination ? `Focus transmission / ${destination}` : "Focus transmission"} />
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

      <div className="focus-scene__grid">
        <figure className="focus-scene__media">
          {shownMedia?.imageUrl ? (
            // Remote public-art media is normalized server-side and kept behind a readable overlay.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              data-testid="focus-media"
              src={relayedImageUrl}
              alt={shownMedia.imageAlt || `${mediaLabel} motivation image`}
              className={cn(imageFailed && "focus-scene__media-image--failed")}
              onError={() => setFailedImageUrl(displayedMedia.key)}
            />
          ) : null}
          {pendingMedia?.imageUrl && !pendingImageFailed ? (
            // Keep the displayed image underneath until this replacement is ready.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              data-testid="focus-media-pending"
              src={pendingRelayedImageUrl}
              alt={pendingMedia.imageAlt || `${mediaLabel} motivation image`}
              className={cn("focus-scene__media-pending", readyImageKey === mediaKey && "is-ready")}
              onLoad={commitPendingImage}
              onError={() => {
                setFailedImageUrl(mediaKey);
                if (shownMedia?.isFallback) setFailedImageUrl(displayedMedia.key);
              }}
            />
          ) : null}
          {!shownMedia?.imageUrl || imageFailed ? (
            <div className="focus-scene__media-fallback" role="img" aria-label={`${mediaLabel} local motivation fallback`} />
          ) : null}
          <div aria-hidden className="focus-scene__media-overlay" />
          <div className="focus-scene__media-label">
            <span data-testid="focus-scene-category" className="focus-scene__eyebrow">Scene // {categoryLabel ?? mediaLabel}</span>
            <strong>{mediaLabel}</strong>
          </div>
          <figcaption className="focus-scene__source">
            {media?.sourceUrl ? (
              <a href={media.sourceUrl} target="_blank" rel="noopener noreferrer">
                {sourceLabel} <ExternalLink aria-hidden className="h-3 w-3" />
              </a>
            ) : (
              <span>{media?.attribution ?? "LOCAL FALLBACK"}</span>
            )}
          </figcaption>
        </figure>

        <div className="focus-scene__brief">
          <div className="focus-scene__brief-heading">
            <p className="focus-scene__eyebrow">Current objective · {goalLabel}</p>
            <h1 data-testid="focus-goal">{goalTitle}</h1>
          </div>

          <div className="focus-scene__quote">
            <p className="focus-scene__eyebrow">Quote of the day · {quoteTag}</p>
            <blockquote>&ldquo;{quote}&rdquo;</blockquote>
            {quoteAuthor ? <p className="focus-scene__quote-author">— {quoteAuthor}</p> : null}
          </div>

          {rationale ? <p data-testid="focus-media-rationale" className="focus-scene__rationale">{rationale}</p> : null}

          <div className="focus-scene__next-action" data-testid="focus-next-action">
            <p className="focus-scene__eyebrow">Next action</p>
            <p>{nextAction}</p>
          </div>

          <div className="focus-scene__signals">
            <div className="focus-scene__signal focus-scene__signal--progress">
              <div className="flex items-end justify-between gap-3">
                <p className="focus-scene__eyebrow">Goal signal</p>
                <p className="font-display text-3xl font-black text-[#c8ff3d]">{safePct}%</p>
              </div>
              <div className="mt-3 h-2 bg-white/10" role="progressbar" aria-label="Goal progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safePct}>
                <span className="block h-full bg-[#c8ff3d] transition-[width] duration-500" style={{ width: `${safePct}%` }} />
              </div>
            </div>
            <div className="focus-scene__signal">
              <p className="focus-scene__eyebrow">Next milestone</p>
              <p>{nextMilestone}</p>
            </div>
            <div className="focus-scene__signal">
              <p className="focus-scene__eyebrow">Active streak</p>
              <p className="font-display text-3xl font-black">{streak} <span className="text-sm font-bold text-white/55">days</span></p>
            </div>
          </div>

          <div className="focus-scene__actions">
            <Button type="button" onClick={onStartAction} className="bg-[#ff554d] text-white shadow-[5px_5px_0_rgba(200,255,61,0.72)] hover:bg-[#ff6a63]">
              <ArrowRight className="mr-2 h-4 w-4" /> Start next action
            </Button>
            <Button type="button" variant="outline" onClick={onRefreshMedia} disabled={mediaLoading} className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white">
              <RefreshCw className={cn("mr-2 h-4 w-4", mediaLoading && "animate-spin")} />
              {mediaLoading ? "Refreshing…" : "Refresh transmission"}
            </Button>
            <Button type="button" variant="outline" onClick={onOpenGoal} className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white">
              Open goal
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            <Button type="button" variant="ghost" onClick={onShuffle} className="text-white/75 hover:bg-white/10 hover:text-white">
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
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 font-utility text-[10px] uppercase tracking-[0.14em] text-white/45">
        <span>{TRACKER_BRAND.name} · Signal locked to your current objective</span>
        <span>{active ? "Esc to exit" : "Enter focus to clear the field"}</span>
      </footer>
    </section>
  );
}
