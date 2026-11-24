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

  if (isMark) {
    return (
      <span
        data-testid="vamsi-mark"
        aria-label={label}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center border border-[var(--portfolio-rule)] font-display text-sm font-medium text-[var(--portfolio-ink)]",
          className,
        )}
      >
        VK
      </span>
    );
  }

  return (
    <span
      data-testid="vamsi-mark"
      aria-label={label}
      className={cn("inline-flex items-baseline gap-2.5", className)}
    >
      <span className="font-display text-[1.35rem] font-normal leading-none tracking-[-0.025em] text-[var(--portfolio-ink)]">
        Vamsi Krishna
      </span>
      <span
        aria-hidden="true"
        className="hidden h-3 w-px bg-[var(--portfolio-rule)] sm:inline-block"
      />
      <span className="hidden font-sans text-xs font-normal tracking-[-0.01em] text-[var(--portfolio-muted)] sm:inline">
        Full Stack Engineer
      </span>
    </span>
  );
}
