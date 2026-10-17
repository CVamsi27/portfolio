import type { ReactNode } from "react";
import ChapterLabel from "@/components/editorial/ChapterLabel";

/**
 * The single page-header primitive for both surfaces: optional chapter
 * breadcrumb, title, context slot (e.g. PageSummary), description, utility
 * slot and actions. Compact mode is the NOVA workspace rhythm; the default
 * mode is the full editorial header.
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  utility,
  context,
  breadcrumb,
  compact = false,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: ReactNode;
  action?: ReactNode;
  utility?: ReactNode;
  context?: ReactNode;
  /** Chapter trail such as `Plan / Tasks`; omit on chapter roots. */
  breadcrumb?: ReactNode;
  compact?: boolean;
}) {
  const crumb =
    breadcrumb !== undefined && breadcrumb !== null ? (
      <nav
        aria-label="Breadcrumb"
        data-testid="chapter-breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        {breadcrumb}
      </nav>
    ) : null;
  if (compact)
    return (
      <header
        data-testid="chapter-header"
        data-editorial-chapter="true"
        className="dossier-chapter-header dossier-chapter-header--compact"
      >
        <div data-testid="personal-section-header" className="nova-page-header">
          <div>
            {crumb}
            <h1 className="font-display font-semibold leading-tight tracking-tight">
              {title}
            </h1>
            {context && <div className="nova-page-context">{context}</div>}
            {(subtitle || utility) && (
              <div className="chapter-context-row">
                {subtitle && <p className="chapter-description">{subtitle}</p>}
                {utility && <div className="dossier-utility">{utility}</div>}
              </div>
            )}
          </div>
          {action && <div className="nova-page-action">{action}</div>}
        </div>
      </header>
    );
  return (
    <header
      data-testid="chapter-header"
      data-editorial-chapter="true"
      className={`dossier-reveal dossier-chapter-header${compact ? " dossier-chapter-header--compact" : ""}`}
    >
      <div
        data-testid="personal-section-header"
        className="chapter-heading-layout"
      >
        <div className="chapter-heading-copy">
          {crumb}
          {!compact && <ChapterLabel eyebrow={eyebrow} />}
          <h1 className="font-display mt-1.5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          ) : null}
          {action ? (
            <div className="chapter-heading-action">{action}</div>
          ) : null}
        </div>
        {utility ? <div className="dossier-utility">{utility}</div> : null}
      </div>
    </header>
  );
}
