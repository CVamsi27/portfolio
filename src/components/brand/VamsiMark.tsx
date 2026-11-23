import { cn } from "@/lib/utils";

type VamsiMarkProps = {
  variant?: "mark" | "wordmark";
  label?: string;
  className?: string;
};

export default function VamsiMark({
  variant = "wordmark",
  label = "Vamsi Krishna",
  className,
}: VamsiMarkProps) {
  const isMark = variant === "mark";

  return (
    <span
      data-testid="vamsi-mark"
      aria-label={label}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span
        aria-hidden="true"
        className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--portfolio-ink)] bg-[var(--portfolio-ink)] font-mono text-[11px] font-semibold tracking-tighter text-[var(--portfolio-paper)]"
      >
        VK
        <span className="absolute -right-[2px] -top-[2px] h-1.5 w-1.5 bg-[var(--portfolio-accent)]" />
      </span>
      {!isMark ? (
        <span className="flex items-baseline gap-2">
          <span className="font-display text-xl leading-none tracking-[-0.02em] text-[var(--portfolio-ink)]">
            Vamsi Krishna
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--portfolio-muted)] sm:inline">
            SYS/ENG
          </span>
        </span>
      ) : null}
    </span>
  );
}
