import type { ReactNode } from "react";
import ChapterLabel from "@/components/editorial/ChapterLabel";

export default function ChapterHeader({
  eyebrow,
  title,
  subtitle,
  action,
  utility,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: ReactNode;
  action?: ReactNode;
  utility?: ReactNode;
}) {
  return (
    <header
      data-testid="chapter-header"
      data-editorial-chapter="true"
      className="dossier-reveal dossier-chapter-header"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {action ? <div>{action}</div> : <span />}
        {utility ? <div className="dossier-utility">{utility}</div> : null}
      </div>
      <div className="mt-6 max-w-4xl">
        <ChapterLabel eyebrow={eyebrow} />
        <h1 className="font-display mt-2 text-4xl font-black uppercase leading-[0.95] tracking-[-0.05em] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      </div>
    </header>
  );
}
