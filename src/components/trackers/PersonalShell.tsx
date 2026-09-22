import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { TrackerIcon, type TrackerIconName } from "./icons";
import TrackerNavDock from "./TrackerNavDock";
import ChapterHeader from "./ChapterHeader";
import EditorialFrame from "@/components/editorial/EditorialFrame";
import TrackerActionBar from "./TrackerActionBar";
import WorldClockStrip from "./WorldClockStrip";
import { cn } from "@/lib/utils";
import LockdownGate from "./LockdownGate";

export default function PersonalShell({
  icon,
  title,
  subtitle,
  badge,
  actions,
  showBack = true,
  showDock = true,
  children,
}: {
  icon?: TrackerIconName;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: { primary: ReactNode; secondary?: ReactNode };
  showBack?: boolean;
  showDock?: boolean;
  children: ReactNode;
}) {
  return (
    <EditorialFrame surface="archive" className="dossier-frame personal-shell">
      <div className={cn("mx-auto w-full max-w-6xl", showDock ? "pb-28 sm:pb-8" : "pb-8")}>
        {title == null ? null : (
          <ChapterHeader
            compact
            eyebrow="NOVA // Chapter 01"
            title={
              <span className="inline-flex items-center gap-3">
                {icon ? (
                  <span aria-hidden className="dossier-icon-mark hidden sm:inline-flex">
                    <TrackerIcon name={icon} className="h-5 w-5" />
                  </span>
                ) : null}
                <span>{title}</span>
              </span>
            }
            subtitle={subtitle ?? "One clear move, then the next."}
            action={showBack ? (
              <Link href="/hub" className="dossier-back-link">
                <ArrowLeft className="h-3.5 w-3.5" /> Today
              </Link>
            ) : undefined}
            utility={<WorldClockStrip badge={badge} />}
          />
        )}
        {actions ? <TrackerActionBar {...actions} /> : null}
        <LockdownGate>
          <main className="mt-5 space-y-5">{children}</main>
          <TrackerNavDock showDock={showDock} />
        </LockdownGate>
      </div>
    </EditorialFrame>
  );
}
