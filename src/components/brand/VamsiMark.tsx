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
      className={cn("inline-flex items-center gap-2", className)}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="h-8 w-8 shrink-0"
        fill="none"
      >
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path
          d="M8 8.5 13.1 23 16 15.2 18.9 23 24 8.5"
          stroke="var(--portfolio-paper, #f4f1ea)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 24.5h12"
          stroke="var(--portfolio-accent, #315cff)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {!isMark ? (
        <span className="font-display text-sm font-semibold tracking-[-0.03em]">
          Vamsi Krishna
        </span>
      ) : null}
    </span>
  );
}
