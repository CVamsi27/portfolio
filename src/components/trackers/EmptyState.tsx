import type { LucideIcon } from "lucide-react";

/** Consistent empty state for every tracker list. */
export default function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/60 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground/60" />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {hint ? <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
