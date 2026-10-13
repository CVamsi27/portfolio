"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import GermanyGallery from "./GermanyGallery";

type Props = {
  goalTitle: string;
  why: string;
  reminder: string;
  nextMilestone?: string;
  completed: number;
  total: number;
  actionHref: string;
  saved: boolean;
  copied: boolean;
  onNextReminder: () => void;
  onSave: () => void;
  onCopy: () => void;
};

export default function FocusScene({
  goalTitle,
  why,
  reminder,
  nextMilestone,
  completed,
  total,
  actionHref,
  saved,
  copied,
  onNextReminder,
  onSave,
  onCopy,
}: Props) {
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
      <GermanyGallery />
      <div className="goal-inspiration__story">
        <h2 data-testid="focus-goal">{goalTitle}</h2>
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
                {complete
                  ? "Reflect on my progress"
                  : actionHref === "/goal"
                    ? "Review goal"
                    : "Open Roadmap"}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            {(complete || actionHref !== "/goal") && (
              <Link
                href="/goal"
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
              >
                Review my goal
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
