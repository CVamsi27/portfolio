import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Consistent empty state for every list and panel.
 * Copy rules: positive title, one-line hint, one primary action, optional
 * secondary link. Never negative boilerplate or zero-value grids.
 */
export default function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  secondary,
  appearance = "plain",
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
  secondary?: ReactNode;
  appearance?: "framed" | "plain";
}) {
  return (
    <div
      className={appearance === "plain"
        ? "py-4"
        : "flex flex-col items-center rounded-2xl border border-dashed border-border/60 px-6 py-10 text-center"}
    >
      {appearance === "framed" && Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground/60" />
        </span>
      )}
      <p className={appearance === "plain" ? "text-base font-semibold" : "mt-3 text-sm font-semibold"}>
        {title}
      </p>
      {hint ? (
        <p className={appearance === "plain"
          ? "mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground"
          : "mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground"}>
          {hint}
        </p>
      ) : null}
      {action || secondary ? (
        <div className={appearance === "plain"
          ? "mt-4 flex flex-wrap items-center gap-x-4 gap-y-2"
          : "mt-4 flex flex-col items-center gap-2"}>
          {action}
          {secondary}
        </div>
      ) : null}
    </div>
  );
}
