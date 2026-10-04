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
          <ChapterLabel eyebrow={eyebrow} />
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
