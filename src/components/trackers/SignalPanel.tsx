import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import ChapterLabel from "@/components/editorial/ChapterLabel";
import SignalRule from "@/components/editorial/SignalRule";

const toneClasses = {
  red: "dossier-signal-red",
  lime: "dossier-signal-lime",
  violet: "dossier-signal-violet",
} as const;

export default function SignalPanel({
  label,
  value,
  detail,
  progress,
  tone = "red",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  progress?: number;
  tone?: "red" | "lime" | "violet";
}) {
  const safeProgress = Math.max(0, Math.min(100, progress ?? 0));

  return (
    <section data-editorial-reveal className={cn("dossier-panel dossier-signal", toneClasses[tone])}>
      <ChapterLabel eyebrow={label} />
      <p className="font-display mt-3 text-3xl font-black tracking-tight sm:text-4xl">
        {value}
      </p>
      {detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}
      {progress !== undefined ? (
        <SignalRule className="mt-5" value={safeProgress} label={`${label} progress`} />
      ) : null}
    </section>
  );
}
