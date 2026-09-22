import type { ReactNode } from "react";
import type { TrackerIconName } from "./icons";
import PersonalShell from "./PersonalShell";

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
  return <PersonalShell {...{ icon, title, subtitle, badge, actions, showBack, showDock, children }} />;
}
