import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import type { NextAction } from "@/lib/command-deck";

const actionLabel: Record<NextAction["kind"], string> = {
  fast: "Open fasting",
  "weigh-in": "Log weigh-in",
  commitment: "Open commitment",
  milestone: "Open milestone",
  todo: "Start this move",
  workout: "Log workout",
  goal: "Log progress",
  reflection: "Write reflection",
};

export default function NextMoveCard({
  action,
  summary,
  focusHref = "/motivation",
}: {
  action: NextAction;
  summary: string;
  focusHref?: string;
}) {
  return (
    <section data-testid="next-move-card" data-editorial-action className="overflow-hidden border rounded-2xl border-border bg-card text-card-foreground">
      <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-7">
        <div>
          <p className="text-sm font-semibold text-primary">Next move</p>
          <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.5rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
            {action.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Link
            href={action.href}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            {actionLabel[action.kind]}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link
            href={focusHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Play className="h-3.5 w-3.5" aria-hidden /> Focus
          </Link>
        </div>
      </div>
    </section>
  );
}
