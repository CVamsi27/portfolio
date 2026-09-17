import { cn } from "@/lib/utils";

export type RingSegment = {
  /** 0..1 progress fill for this segment. */
  value: number;
  /** Tailwind-ish stroke color, e.g. "#3b82f6" or "var(--color-primary)". */
  color: string;
  label?: string;
};

const GAP_DEG = 6; // gap between segments

/**
 * Apple-Fitness-style multi-segment progress ring. Each segment fills
 * independently (0..1) with rounded caps; the center is a render slot.
 */
export default function Ring({
  segments,
  size = 200,
  thickness = 14,
  className,
  children,
}: {
  segments: RingSegment[];
  size?: number;
  thickness?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const total = segments.length || 1;
  const sweep = 360 / total;
  const r = (100 - thickness / 2) / 2; // viewBox is 100×100
  const circ = 2 * Math.PI * r;
  const gapPct = (GAP_DEG / 360) * circ;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        {/* track */}
        {segments.map((seg, i) => {
          const offsetDeg = i * sweep + GAP_DEG / 2;
          const dash = circ * (sweep / 360) - gapPct;
          return (
            <circle
              key={`track-${i}`}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              strokeWidth={thickness}
              stroke="currentColor"
              className="text-muted"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={-circ * (offsetDeg / 360)}
              strokeLinecap="round"
            />
          );
        })}
        {/* fills */}
        {segments.map((seg, i) => {
          const offsetDeg = i * sweep + GAP_DEG / 2;
          const dash = circ * (sweep / 360) - gapPct;
          const fill = circ * (sweep / 360) * Math.min(1, Math.max(0, seg.value)) - gapPct;
          return (
            <circle
              key={`fill-${i}`}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              strokeWidth={thickness}
              stroke={seg.color}
              strokeDasharray={`${Math.max(0, fill)} ${circ}`}
              strokeDashoffset={-circ * (offsetDeg / 360)}
              strokeLinecap="round"
              className="transition-all duration-700"
              style={{ filter: seg.value > 0 ? `drop-shadow(0 0 3px ${seg.color})` : undefined }}
            />
          );
        })}
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Simple single-arc ring for timers (fasting, rest countdown). */
export function SimpleRing({
  pct,
  size = 200,
  thickness = 12,
  from = "#3b82f6",
  to = "#8b5cf6",
  className,
  children,
}: {
  pct: number;
  size?: number;
  thickness?: number;
  from?: string;
  to?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const r = (100 - thickness / 2) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth={thickness} stroke="currentColor" className="text-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          stroke={`url(#ring-grad-${from.replace(/[^a-z0-9]/gi, "")})`}
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * clamped) / 100}
          className="transition-[stroke-dashoffset] duration-500"
        />
        <defs>
          <linearGradient id={`ring-grad-${from.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
      ) : null}
    </div>
  );
}
