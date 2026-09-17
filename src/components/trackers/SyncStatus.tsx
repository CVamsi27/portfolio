import { Check, Cloud, CloudOff, TriangleAlert } from "lucide-react";
import type { SyncStatus as SyncStatusValue } from "@/lib/use-synced-storage";
import { cn } from "@/lib/utils";

const states: Record<SyncStatusValue, { label: string; tone: string; Icon: typeof Cloud }> = {
  "local-only": { label: "Local only", tone: "text-muted-foreground", Icon: CloudOff },
  syncing: { label: "Syncing…", tone: "text-amber-500", Icon: Cloud },
  synced: { label: "Synced", tone: "text-dossier-lime", Icon: Check },
  error: { label: "Sync error", tone: "text-dossier-red", Icon: TriangleAlert },
};

export default function SyncStatus({ status }: { status: SyncStatusValue }) {
  const state = states[status];
  const { Icon } = state;

  return (
    <span
      aria-live="polite"
      className={cn("dossier-sync-status", state.tone)}
      title={state.label}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{state.label}</span>
    </span>
  );
}
