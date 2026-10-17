import PersonalBackLink from "./PersonalBackLink";
import { Suspense, type ReactNode } from "react";
import WorkspaceProgressLead from "@/components/progress/WorkspaceProgressLead";
import { type TrackerIconName } from "./icons";
import TrackerNavDock from "./TrackerNavDock";
import PageHeader from "./PageHeader";
import EditorialFrame from "@/components/editorial/EditorialFrame";
import { cn } from "@/lib/utils";
import RoutineNotifier from "@/components/personal/RoutineNotifier";
import LockdownGate from "./LockdownGate";

const DEFAULT_EYEBROWS: Partial<Record<TrackerIconName, string>> = {
  todo: "Planning",
  log: "Quick capture",
  timer: "Health",
  workout: "Health",
  flag: "Planning",
  scale: "Health",
  archive: "Library",
  settings: "Preferences",
};

export default function PersonalShell({
  icon,
  title,
  subtitle,
  eyebrow,
  badge,
  actions,
  context,
  progress = true,
  showBack = false,
  showDock = true,
  children,
}: {
  icon?: TrackerIconName;
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  badge?: ReactNode;
  actions?: { primary: ReactNode; secondary?: ReactNode };
  context?: ReactNode;
  progress?: boolean;
  showBack?: boolean;
  showDock?: boolean;
  children: ReactNode;
}) {
  const effectiveEyebrow =
    eyebrow ?? (icon ? DEFAULT_EYEBROWS[icon] : undefined) ?? "Planning";

  return (
    <EditorialFrame surface="archive" className="dossier-frame personal-shell">
      <div
        className={cn(
          "mx-auto w-full max-w-6xl",
          showDock ? "pb-28 lg:pb-8" : "pb-8",
        )}
      >
        {title == null ? null : (
          <PageHeader
            compact
            eyebrow={effectiveEyebrow}
            title={
              <span className="inline-flex items-center gap-3">
                <span>{title}</span>
              </span>
            }
            subtitle={subtitle}
            context={context}
            action={
              actions?.primary ?? (showBack ? <PersonalBackLink /> : undefined)
            }
            utility={badge}
          />
        )}
        {icon === "login" ? (
          <div className="personal-content mt-5 space-y-5">{children}</div>
        ) : (
          <LockdownGate>
            <RoutineNotifier />
            <div className="personal-content mt-5 space-y-5">
              {progress && (
                <Suspense fallback={null}>
                  <WorkspaceProgressLead />
                </Suspense>
              )}
              {children}
            </div>
            <TrackerNavDock showDock={showDock} />
          </LockdownGate>
        )}
      </div>
    </EditorialFrame>
  );
}
