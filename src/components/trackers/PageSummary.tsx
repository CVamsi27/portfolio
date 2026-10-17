import { Fragment, type ReactNode } from "react";

/**
 * Data-only page summary: one muted line of readings in the form
 * `value · unit · context` (e.g. `3 sessions · 2h 30m · this week`).
 * Renders nothing when there is no data — never an empty scaffold.
 */
export default function PageSummary({
  parts,
  className,
}: {
  /** Readings already formatted; empty entries are dropped. */
  parts: Array<ReactNode | null | undefined | false>;
  className?: string;
}) {
  const items = parts.filter(
    (part) => part !== null && part !== undefined && part !== false && part !== "",
  );
  if (items.length === 0) return null;
  return (
    <p
      data-testid="page-summary"
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted-foreground ${className ?? ""}`}
    >
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span aria-hidden="true" className="text-border">
              ·
            </span>
          ) : null}
          <span>{item}</span>
        </Fragment>
      ))}
    </p>
  );
}
