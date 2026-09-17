import { cn } from "@/lib/utils";

export default function SignalRule({
  value,
  label,
  className,
}: {
  value?: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className={cn("editorial-rule", className)}>
      {label ? <span className="sr-only">{label}</span> : null}
      <span
        className="editorial-rule-fill"
        style={{ width: value === undefined ? "100%" : `${clamped}%` }}
        role={value === undefined ? undefined : "progressbar"}
        aria-label={value === undefined ? undefined : label}
        aria-valuemin={value === undefined ? undefined : 0}
        aria-valuemax={value === undefined ? undefined : 100}
        aria-valuenow={value === undefined ? undefined : clamped}
      />
    </div>
  );
}
