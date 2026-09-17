import { cn } from "@/lib/utils";

export type Bar = { label: string; value: number };

/**
 * Compact bar chart for weekly / 14-day series. Pure CSS — no chart lib.
 * Bars scale to the max value; zero-value bars render as dim stubs.
 */
export default function MiniBars({
  data,
  unit,
  className,
  highlightLast = true,
  height = 64,
}: {
  data: Bar[];
  unit?: string;
  className?: string;
  highlightLast?: boolean;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  // One accessible summary for the whole series (role=img); the decorative
  // bars stay silent so screen readers get the data exactly once.
  const summary = data.map((d) => `${d.label}: ${d.value}${unit ? ` ${unit}` : ""}`).join(", ");
  return (
    <div className={cn("flex items-end gap-1.5", className)} role="img" aria-label={summary}>
      {data.map((d, i) => {
        const isLast = highlightLast && i === data.length - 1;
        const h = Math.max(4, Math.round((d.value / max) * height));
        return (
          <div key={`${d.label}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className={cn("text-[10px] font-semibold tabular-nums", d.value ? "text-foreground" : "text-muted-foreground/50")}>
              {d.value || ""}
            </span>
            <div
              title={`${d.label}: ${d.value}${unit ? ` ${unit}` : ""}`}
              className={cn(
                "w-full rounded-md transition-all",
                d.value
                  ? isLast
                    ? "bg-gradient-to-t from-primary to-fuchsia-500 shadow-md shadow-primary/25"
                    : "bg-gradient-to-t from-primary/80 to-fuchsia-500/70"
                  : "bg-muted",
              )}
              style={{ height: `${h}px` }}
            />
            <span className="w-full truncate text-center text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
