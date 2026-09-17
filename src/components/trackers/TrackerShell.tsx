import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { TrackerIcon, type TrackerIconName } from "./icons";
import TrackerNavDock from "./TrackerNavDock";
import ChapterHeader from "./ChapterHeader";

export default function TrackerShell({
  icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon?: TrackerIconName;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="dossier-frame mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-16 lg:px-10">
      <ChapterHeader
        eyebrow="Personal Suite // Chapter 01"
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
          <>
            <span className="dossier-date">{today}</span>
            {badge}
          </>
        }
      />
      <main className="mt-8 space-y-5">{children}</main>
      <TrackerNavDock />
    </div>
  );
}
