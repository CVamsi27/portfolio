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

export default function TrackerShell({
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
  title: string;
  subtitle: string;
  badge?: ReactNode;
  actions?: { primary: ReactNode; secondary?: ReactNode };
  /** The command center is the root of the personal app, not a child chapter. */
  showBack?: boolean;
  /** Utility pages can opt out of the mobile action dock. */
  showDock?: boolean;
  children: ReactNode;
}) {
  return (
    <EditorialFrame surface="archive" className="dossier-frame">
      <div className={cn("mx-auto w-full max-w-6xl", showDock ? "pb-24 sm:pb-8" : "pb-8")}>
      <ChapterHeader
        eyebrow="NOVA//OS // Chapter 01"
        title={
          <span className="inline-flex items-center gap-3">
            {icon ? (
              <span aria-hidden className="dossier-icon-mark hidden sm:inline-flex">
                <TrackerIcon name={icon} className="h-6 w-6" />
              </span>
            ) : null}
            <span>{title}</span>
          </span>
        }
        subtitle={subtitle}
        action={showBack ? (
          <Link href="/hub" className="dossier-back-link">
            <ArrowLeft className="h-3.5 w-3.5" /> Hub
          </Link>
        ) : undefined}
        utility={<WorldClockStrip badge={badge} />}
      />
      {actions ? <TrackerActionBar {...actions} /> : null}
      <main className="mt-6 space-y-5">{children}</main>
      <TrackerNavDock showDock={showDock} />
      </div>
    </EditorialFrame>
  );
}
