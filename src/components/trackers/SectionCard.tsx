import type { ReactNode } from "react";

/**
 * Shared titled section container for workspace pages: one panel surface,
 * one heading row, one action slot. Keeps section rhythm consistent without
 * each page re-declaring panel chrome.
 */
export default function SectionCard({
  title,
  description,
  action,
  children,
  className,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const hasHeader = Boolean(title || description || action);
  return (
    <section id={id} className={`workspace-panel min-w-0 ${className ?? ""}`}>
      {hasHeader ? (
        <header className="workspace-heading">
          <div className="min-w-0">
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {action ? (
            <div className="flex flex-none items-center gap-2">{action}</div>
          ) : null}
        </header>
      ) : null}
      <div className={hasHeader ? "mt-4" : undefined}>{children}</div>
    </section>
  );
}
