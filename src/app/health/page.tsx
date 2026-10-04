"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import SectionLinks from "@/components/personal/SectionLinks";
import RoutineReminders from "@/components/personal/RoutineReminders";
import RecoveryTracker from "@/components/personal/RecoveryTracker";
export default function HealthPage() {
  return (
    <RequireAuth>
      <PersonalShell
        showBack={false}
        title="Health"
        icon="scale"
        subtitle="Food, movement and recovery in one place."
      >
        <SectionLinks
          items={[
            {
              href: "/food",
              label: "Food and nutrients",
              description:
                "Log meals, calories, macros and available micronutrients.",
            },
            {
              href: "/workout-tracking",
              label: "Movement",
              description: "Record workouts and exercise history.",
            },
            {
              href: "/weight-loss",
              label: "Body",
              description: "Your weight and body measurements over time.",
            },
            {
              href: "/intermittent-fasting",
              label: "Water and fasting",
              description: "Hydration and your optional eating window.",
            },
          ]}
        />
        <RecoveryTracker />
        <RoutineReminders />
      </PersonalShell>
    </RequireAuth>
  );
}
