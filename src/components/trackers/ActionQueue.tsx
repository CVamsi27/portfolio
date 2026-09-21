import Link from "next/link";
import { ArrowUpRight, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionQueueRow = {
  id: string;
  label: string;
  detail: string;
  href: string;
  tone: "cyan" | "lime" | "amber" | "violet";
  complete?: boolean;
};

const toneClasses = {
  cyan: "bg-[#49E7FF]",
  lime: "bg-[#C8FF3D]",
  amber: "bg-amber-400",
  violet: "bg-fuchsia-400",
} as const;

export default function ActionQueue({ rows }: { rows: ActionQueueRow[] }) {
  return (
    <section data-testid="action-queue" className="border border-border/60 bg-card/50 p-4 sm:p-5" aria-label="Today anchors">
      <div data-testid="hub-anchor-grid">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="dossier-kicker">Action queue // today</p>
          <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight">Four anchors. One clear day.</h2>
        </div>
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{rows.length} anchors</span>
      </div>
      {rows.length ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id} data-complete={row.complete ? "true" : "false"} className={cn("group flex min-w-0 items-center gap-3 border border-border/60 bg-background/40 px-3 py-3 transition-colors hover:border-primary/40", row.complete && "bg-muted/20 opacity-75")}>
              <span className={cn("h-8 w-1 shrink-0", toneClasses[row.tone], row.complete && "opacity-40")} aria-hidden />
              {row.complete ? <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-semibold", row.complete && "text-muted-foreground line-through")}>{row.label}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.detail}</p>
              </div>
              <Link href={row.href} aria-label={`Open ${row.label}`} className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border border-dashed border-border/60 px-3 py-4 text-sm text-muted-foreground">The day is clear. Add one small task or step into focus.</p>
      )}
      </div>
    </section>
  );
}
