"use client";
import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import WeeklyReview from "@/components/review/WeeklyReview";

export default function ReviewPage() {
  return (
    <RequireAuth>
      <PersonalShell
        icon="log"
        title="Weekly review"
        eyebrow="Progress"
        subtitle={null}
      >
        <Suspense fallback={<p>Loading review…</p>}>
          <WeeklyReview />
        </Suspense>
      </PersonalShell>
    </RequireAuth>
  );
}
