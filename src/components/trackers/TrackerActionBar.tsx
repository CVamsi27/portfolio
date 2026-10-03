import type { ReactNode } from "react";

export default function TrackerActionBar({
  primary,
  secondary,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div data-testid="tracker-action-bar" className="tracker-page-actions flex flex-wrap items-center gap-3">
      {primary}
      {secondary}
    </div>
  );
}
