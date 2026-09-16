import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = { value: T; label: string };

/** Modern segmented control — one shape for every toggle/filter on trackers. */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  variant = "solid",
  label,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  variant?: "solid" | "soft";
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-muted/50 p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "truncate rounded-xl px-3 py-1.5 text-sm font-medium transition-all",
            value === o.value
              ? variant === "solid"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
