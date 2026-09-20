import type { ReactNode } from "react";

export default function TrackerActionBar({
  primary,
  secondary,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <section data-testid="tracker-action-bar" data-editorial-reveal className="flex flex-col gap-4 border border-border/60 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <p className="dossier-kicker">Today&apos;s action</p>
        <p className="mt-1 text-sm text-muted-foreground">Make one useful move, then let the rest of the system follow.</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {primary}
        {secondary ? <span className="text-muted-foreground/50">·</span> : null}
        {secondary}
      </div>
    </section>
  );
}
