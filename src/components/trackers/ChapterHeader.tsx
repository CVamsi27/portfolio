import type { ReactNode } from "react";
import ChapterLabel from "@/components/editorial/ChapterLabel";

export default function ChapterHeader({
  eyebrow,
  title,
  subtitle,
  action,
  utility,
  compact = false,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: ReactNode;
  action?: ReactNode;
  utility?: ReactNode;
  compact?: boolean;
}) {
  if (compact)
    return (
      <header
        data-testid="chapter-header"
        data-editorial-chapter="true"
        className="dossier-chapter-header dossier-chapter-header--compact"
      >
        <div data-testid="personal-section-header">
          <h1 className="font-display font-semibold leading-tight tracking-tight">
            {title}
          </h1>
          {(action || subtitle || utility) && (
            <div className="chapter-context-row">
              {action}
              {subtitle && (
                <details className="chapter-help">
                  <summary>About this page</summary>
                  <p>{subtitle}</p>
                </details>
              )}
              {utility && <div className="dossier-utility">{utility}</div>}
            </div>
          )}
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
