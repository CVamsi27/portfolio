import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { TrackerIcon, type TrackerIconName } from "./icons";
import TrackerNavDock from "./TrackerNavDock";
import ChapterHeader from "./ChapterHeader";
import EditorialFrame from "@/components/editorial/EditorialFrame";
import TelemetryLine from "@/components/editorial/TelemetryLine";
import TrackerActionBar from "./TrackerActionBar";

export default function TrackerShell({
  icon,
  title,
  subtitle,
  badge,
  actions,
  children,
}: {
  icon?: TrackerIconName;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  actions?: { primary: ReactNode; secondary?: ReactNode };
  children: ReactNode;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <EditorialFrame surface="archive" className="dossier-frame">
      <div className="mx-auto w-full max-w-6xl pb-24 sm:pb-8">
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
        action={
          <Link href="/trackers" className="dossier-back-link">
            <ArrowLeft className="h-3.5 w-3.5" /> Tracker Hub
          </Link>
        }
        utility={
          <TelemetryLine
            items={[
              { label: "Today", value: today },
              ...(badge ? [{ label: "Status", value: badge }] : []),
            ]}
          />
        }
      />
      {actions ? <TrackerActionBar {...actions} /> : null}
      <main className="mt-6 space-y-5">{children}</main>
      <TrackerNavDock />
      </div>
    </EditorialFrame>
  );
}
