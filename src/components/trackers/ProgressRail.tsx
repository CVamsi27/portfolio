export default function ProgressRail({
  percent,
  completed,
  total,
}: {
  percent: number;
  completed: number;
  total: number;
}) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <section data-testid="progress-rail" className="border-y border-border/70 py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="dossier-kicker">Momentum</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight">{completed}/{total} anchors complete</p>
        </div>
        <strong className="font-display text-3xl font-black tabular-nums text-[#32b8c8]">{safePercent}%</strong>
      </div>
      <div
        role="progressbar"
        aria-label="Daily momentum"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safePercent}
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
      >
        <span className="block h-full rounded-full bg-[#32b8c8] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${safePercent}%` }} />
      </div>
    </section>
  );
}
