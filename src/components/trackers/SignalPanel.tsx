import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    <section className={cn("dossier-panel dossier-signal", toneClasses[tone])}>
      <p className="dossier-kicker">{label}</p>
      <p className="font-display mt-3 text-3xl font-black tracking-tight sm:text-4xl">
        {value}
      </p>
      {detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}
      {progress !== undefined ? (
        <div
          className="dossier-progress-track mt-5"
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeProgress}
        >
          <span className="dossier-progress-fill" style={{ width: `${safeProgress}%` }} />
        </div>
      ) : null}
    </section>
  );
}
