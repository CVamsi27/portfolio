"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import CaptureWorkspace from "@/components/daily/CaptureWorkspace";
import JournalWorkspace from "@/components/daily/JournalWorkspace";

const RETIRED_HEALTH_TYPES = new Set([
  "food",
  "water",
  "exercise",
  "weight",
  "sleep",
]);

function CapturePage() {
  const params = useSearchParams();
  const router = useRouter();
  const requestedType = params.get("type") ?? "";
  useEffect(() => {
    if (RETIRED_HEALTH_TYPES.has(requestedType)) {
      router.replace("/health?notice=retired-manual");
    }
  }, [requestedType, router]);
  return (
    <RequireAuth>
      <PersonalShell
        icon="log"
        title={
          params.get("view") === "journal" ? "Daily reflection" : "Quick capture"
        }
        eyebrow="Capture"
        subtitle={null}
      >
        {params.get("view") === "journal" ? (
          <JournalWorkspace />
        ) : (
          <CaptureWorkspace
            key={params.toString()}
            initialType={requestedType}
            initialDate={params.get("date") ?? undefined}
            returnTo={params.get("returnTo") ?? "/hub"}
          />
        )}
      </PersonalShell>
    </RequireAuth>
  );
}

export default function LogPage() {
  return (
    <Suspense fallback={<p>Loading capture…</p>}>
      <CapturePage />
    </Suspense>
  );
}
