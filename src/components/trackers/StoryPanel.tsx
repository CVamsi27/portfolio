import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import ChapterLabel from "@/components/editorial/ChapterLabel";

const toneClasses = {
  archive: "dossier-story-archive",
  signal: "dossier-story-signal",
  violet: "dossier-story-violet",
} as const;

export default function StoryPanel({
  eyebrow,
  title,
  children,
  action,
  tone = "archive",
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "archive" | "signal" | "violet";
}) {
  return (
    <section data-editorial-reveal className={cn("dossier-panel dossier-story", toneClasses[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <ChapterLabel eyebrow={eyebrow} /> : null}
          <h2 className="font-display mt-2 text-xl font-extrabold tracking-tight">{title}</h2>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="mt-4 text-sm leading-relaxed text-muted-foreground">{children}</div> : null}
    </section>
  );
}
