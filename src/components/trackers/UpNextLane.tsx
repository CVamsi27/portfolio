import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { UpNextCue } from "@/lib/command-deck";

export default function UpNextLane({ cue }: { cue: UpNextCue | null }) {
  return (
    <section data-testid="up-next-lane" className="border border-border/70 bg-card/55 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="dossier-kicker">Up next</p>
          {cue ? (
            <>
              <h2 className="mt-2 truncate font-display text-xl font-bold tracking-tight">{cue.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{cue.detail}</p>
            </>
          ) : (
            <h2 className="mt-2 font-display text-xl font-bold tracking-tight">Choose one small continuation.</h2>
          )}
        </div>
        {cue ? (
          <Link href={cue.href} aria-label={`Open ${cue.title}`} className="shrink-0 rounded-full border border-border px-3 py-2 text-primary transition-colors hover:border-primary">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <Clock3 className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
        )}
      </div>
      {cue?.effortMinutes ? <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">About {cue.effortMinutes} min</p> : null}
    </section>
  );
}
