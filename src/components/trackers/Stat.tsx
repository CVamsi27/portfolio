import { cn } from "@/lib/utils";

/** One stat tile — shared by fasting / goal / workout / motivation boards. */
export default function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-center shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 font-semibold tabular-nums", accent && "text-primary")}>
        {value}
      </p>
    </div>
  );
}
