"use client";
import { cn } from "@/lib/utils";

export type ProgressTone =
  | "primary"
  | "emerald"
  | "amber"
  | "sky"
  | "violet"
  | "rose";

const TONE_BAR: Record<ProgressTone, string> = {
  primary: "bg-primary",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
};

const TONE_TEXT: Record<ProgressTone, string> = {
  primary: "text-primary",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  sky: "text-sky-600 dark:text-sky-400",
  violet: "text-violet-600 dark:text-violet-400",
  rose: "text-rose-600 dark:text-rose-400",
};

export default function ProgressBar({
  label,
  value,
  max,
  unit,
  hint,
  tone = "primary",
  compact = false,
  className,
}: {
  label?: string;
  value: number;
  max: number;
  unit?: string;
  hint?: string;
  tone?: ProgressTone;
  compact?: boolean;
  className?: string;
}) {
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.max(0, Math.min(100, Math.round((value / safeMax) * 100)));
  const fmt = (n: number) =>
    Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || hint) && (
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-medium text-foreground truncate">{label}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            <strong className={cn("font-semibold", TONE_TEXT[tone])}>
              {fmt(value)}
            </strong>
            <span>
              {" "}
              / {fmt(max)}
              {unit ? ` ${unit}` : ""}
            </span>
            <span className="ml-1.5 font-mono text-[11px] opacity-75">
              {clamped}%
            </span>
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(safeMax)}
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted/80",
          compact ? "h-1.5" : "h-2.5",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            TONE_BAR[tone],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
