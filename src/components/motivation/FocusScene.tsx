"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bookmark, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MotivationMedia } from "@/lib/motivation-media";

type Props = {
  goalTitle: string;
  goalLabel: string;
  why: string;
  reminder: string;
  nextMilestone?: string;
  completed: number;
  total: number;
  actionHref: string;
  saved: boolean;
  copied: boolean;
  media: MotivationMedia;
  onNextReminder: () => void;
  onSave: () => void;
  onCopy: () => void;
};

export default function FocusScene({
  goalTitle,
  goalLabel,
  why,
  reminder,
  nextMilestone,
  completed,
  total,
  actionHref,
  saved,
  copied,
  media,
  onNextReminder,
  onSave,
  onCopy,
}: Props) {
  const [failedImage, setFailedImage] = useState<string>();
  const imageVisible = media.imageUrl && failedImage !== media.imageUrl;
  const complete = total > 0 && completed === total;
  return (
    <section
      id="focus-scene"
      data-testid="focus-scene"
      data-editorial-chapter="true"
      data-reduced-motion="supported"
      aria-label="Your goal and motivation"
      className="goal-inspiration"
    >
      <div className="goal-inspiration__story">
        <p className="goal-inspiration__eyebrow" data-editorial-kicker>
          Motivation · The future you’re working toward
        </p>
        <h1 data-testid="focus-goal">{goalTitle}</h1>
        <p className="goal-inspiration__why" data-testid="goal-why">
          {why}
        </p>
        <div className="goal-inspiration__reminder">
          <p className="goal-inspiration__eyebrow">A reminder for today</p>
          <blockquote>{reminder}</blockquote>
          <div className="flex flex-wrap gap-1 mt-3">
            <Button variant="ghost" onClick={onNextReminder}>
              Another reminder
            </Button>
            <Button
              variant="ghost"
              onClick={onSave}
              aria-pressed={saved}
              aria-label={saved ? "Unsave reminder" : "Save reminder"}
            >
              <Bookmark
                className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`}
                aria-hidden
              />
              {saved ? "Saved" : "Save"}
            </Button>
            <Button variant="ghost" onClick={onCopy} aria-label="Copy reminder">
              {copied ? (
                <Check className="mr-2 h-4 w-4" aria-hidden />
              ) : (
                <Copy className="mr-2 h-4 w-4" aria-hidden />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        <div data-testid="focus-next-action" className="goal-inspiration__next">
          <p className="goal-inspiration__eyebrow">
            {complete ? "Look how far you’ve come" : "Your next step"}
          </p>
          <p className="font-semibold mt-2">
            {complete
              ? "You completed every milestone. Take a moment to recognise what you’ve built."
              : (nextMilestone ?? "Choose one small step toward your goal.")}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {completed} of {total} milestones complete
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Button asChild>
              <Link href={complete ? "/log" : actionHref}>
                {complete ? "Reflect on my progress" : "Open my plan"}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Link
              href="/goal"
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
            >
              Review my goal
            </Link>
          </div>
        </div>
      </div>
      <figure className="goal-inspiration__visual">
        {imageVisible ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-testid="focus-media"
            src={`/api/motivation-image?url=${encodeURIComponent(media.imageUrl!)}`}
            alt={media.imageAlt || `${goalLabel} inspiration`}
            onError={() => setFailedImage(media.imageUrl)}
          />
        ) : (
          <div className="goal-inspiration__horizon" aria-hidden />
        )}
        <figcaption>
          <span data-testid="focus-scene-category">
            {media.categoryLabel ?? goalLabel}
          </span>
          {imageVisible && media.sourceUrl ? (
            <a href={media.sourceUrl} target="_blank" rel="noopener noreferrer">
              {media.attribution ?? "Image source"}
            </a>
          ) : null}
        </figcaption>
      </figure>
    </section>
  );
}
