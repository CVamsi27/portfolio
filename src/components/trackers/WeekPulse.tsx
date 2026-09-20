import { cn } from "@/lib/utils";

export type WeekPulseDay = {
  key: string;
  label: string;
  activityCount: number;
  focusMinutes: number;
  isToday?: boolean;
};

export default function WeekPulse({ days }: { days: WeekPulseDay[] }) {
  const maxActivity = Math.max(1, ...days.map((day) => day.activityCount));

  return (
    <section data-testid="week-pulse" className="border border-border/60 bg-card/50 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="dossier-kicker">Week pulse // seven days</p>
          <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight">Small signals compound.</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">activity + focus time</span>
      </div>
      <ol className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const height = Math.max(8, Math.round((day.activityCount / maxActivity) * 100));
          return (
            <li key={day.key} aria-label={`${day.label}: ${day.activityCount} activities, ${day.focusMinutes} focus minutes`} className={cn("min-w-0 text-center", day.isToday && "text-primary")}>
              <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.12em]">{day.label}</span>
              <span className="mx-auto mt-2 flex h-16 max-w-8 items-end bg-muted/50 p-1">
                <span className="block w-full bg-primary/70 transition-[height] duration-500 motion-reduce:transition-none" style={{ height: `${height}%` }} />
              </span>
              <span className="mt-1 block truncate text-[10px] tabular-nums text-muted-foreground">{day.focusMinutes}m</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
