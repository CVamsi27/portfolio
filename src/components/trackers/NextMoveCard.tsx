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
    <section data-testid="next-move-card" data-editorial-action className="overflow-hidden border border-[#2b474d] bg-[#102027] text-[#f4f0e7]">
      <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-7">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#32b8c8]">Next move</p>
          <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.8rem,6vw,3.5rem)] font-black leading-[0.95] tracking-[-0.055em]">
            {action.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#a9b4af]">{summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Link
            href={action.href}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#c9ff4f] px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#102027] transition-transform hover:-translate-y-0.5"
          >
            {actionLabel[action.kind]}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link
            href={focusHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#527078] px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#f4f0e7] transition-colors hover:border-[#32b8c8] hover:text-[#32b8c8]"
          >
            <Play className="h-3.5 w-3.5" aria-hidden /> Focus
          </Link>
        </div>
      </div>
    </section>
  );
}
