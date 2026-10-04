"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import FoodTracker from "@/components/nutrition/FoodTracker";
export default function FoodPage() {
  return (
    <RequireAuth>
      <PersonalShell
        icon="scale"
        title="Food"
        subtitle="Log meals, see known nutrients, and keep your own routine."
      >
        <FoodTracker />
      </PersonalShell>
    </RequireAuth>
  );
}
