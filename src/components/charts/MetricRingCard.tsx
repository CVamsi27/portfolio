"use client";
import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import ProgressBar, { type ProgressTone } from "./ProgressBar";

const TONE_RING: Record<ProgressTone, string> = {
  primary: "stroke-primary",
  emerald: "stroke-emerald-500",
  amber: "stroke-amber-500",
  sky: "stroke-sky-500",
  violet: "stroke-violet-500",
  rose: "stroke-rose-500",
};

const TONE_BG: Record<ProgressTone, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export default function MetricRingCard({
  label,
  value,
  sublabel,
  delta,
  progress,
  ring = false,
  tone = "primary",
  icon,
  href,
  className,
}: {
  label: string;
  value: string;
  sublabel?: string;
  delta?: string | null;
  progress?: { current: number; target: number; unit?: string };
  ring?: boolean;
  tone?: ProgressTone;
  icon?: ReactNode;
  href?: string;
  className?: string;
}) {
  const pct = progress
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (progress.current / (progress.target > 0 ? progress.target : 1)) *
              100,
          ),
        ),
      )
    : null;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    pct !== null ? circumference - (pct / 100) * circumference : circumference;

  const body = (
    <div
      className={cn(
        "group relative flex h-full flex-col justify-between gap-3 rounded-2xl border border-border/70 bg-card/90 p-4 shadow-xs transition-all",
        href && "hover:border-primary/40 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            {icon && (
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-lg",
                  TONE_BG[tone],
                )}
              >
                {icon}
              </span>
            )}
            <p className="text-xs font-medium text-muted-foreground truncate">
              {label}
            </p>
          </div>
          <p className="font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          {sublabel && (
            <p className="text-xs text-muted-foreground leading-snug">
              {sublabel}
            </p>
          )}
        </div>
        {ring && pct !== null && (
          <div className="relative h-12 w-12 shrink-0">
            <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                strokeWidth="4.5"
                className="stroke-muted/70"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={cn(
                  "transition-all duration-500 ease-out",
                  TONE_RING[tone],
                )}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-semibold tabular-nums text-foreground">
              {pct}%
            </span>
          </div>
        )}
      </div>

      {!ring && progress && (
        <ProgressBar
          value={progress.current}
          max={progress.target}
          unit={progress.unit}
          tone={tone}
          compact
        />
      )}

      {delta && (
        <span className="inline-flex w-fit items-center rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {delta}
        </span>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  );
}
