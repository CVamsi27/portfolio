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
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        accent
          ? "border-[color-mix(in_srgb,var(--color-dossier-lime)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-dossier-lime)_10%,transparent)]"
          : "border-border/60 bg-card hover:border-primary/30",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 font-semibold tabular-nums", accent && "text-primary")}>
        {value}
      </p>
    </div>
  );
}
