"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import {
  dayQuality,
  nutritionReviewEntries,
  validNutritionDay,
  canEditNutritionProgram,
  type NutritionDay,
} from "@/lib/nutrition-program";
import { displayNutrient, type FoodEntry } from "@/lib/nutrition";

const labels = {
  "not-logged": "Not logged",
  partial: "Partial log",
  complete: "Reviewed complete",
  estimated: "Estimated complete",
  fasting: "Confirmed fasting",
};
type Props = { date: string; entries: FoodEntry[] };
export default function NutritionDayQuality(props: Props) {
  const { user, configured } = useAuth();
  const scope = configured ? (user?.id ?? "signed-out") : "local";
  return <DayReview key={`${scope}:${props.date}`} {...props} />;
}
function DayReview({ date, entries }: { date: string; entries: FoodEntry[] }) {
  const store = useSyncedStorage<Record<string, NutritionDay>>(
    "nutrition:days",
    {},
    { accountScoped: true, records: true },
  );
  const canEdit = canEditNutritionProgram(
    isSupabaseConfigured(),
    process.env.NEXT_PUBLIC_NUTRITION_PROGRAM_ENABLED,
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const quality = dayQuality(date, entries, store.value[date]);
  const dated = nutritionReviewEntries(date, entries);
  const active = dated.filter((entry) => entry.deleted !== true);
  const save = (status: NutritionDay["status"]) => {
    if (!canEdit) {
      setError(
        "Cloud day reviews are read-only until the nutrition storage upgrade is verified.",
      );
      return;
    }
    setError("");
    setMessage("");
    const record: NutritionDay = {
      id: date,
      status,
      updatedAt: Math.max(
        Date.now(),
        ...dated.map((e) => e.updatedAt).filter(Number.isFinite),
      ),
    };
    if (!validNutritionDay(record)) {
      setError("Choose a valid date before reviewing intake.");
      return;
    }
    if (status === "fasting" && active.length) {
      setError(
        "Food is logged for this date. Reconcile it before confirming fasting.",
      );
      return;
    }
    if ((status === "complete" || status === "estimated") && !active.length) {
      setError("Add food first, or explicitly confirm fasting.");
      return;
    }
    try {
      store.setValue((previous) => ({ ...previous, [date]: record }));
      setConfirming(false);
      setMessage(`Day marked ${labels[status].toLowerCase()}.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save day review.",
      );
    }
  };
  return (
    <section
      aria-label="Nutrition day review"
      className="rounded-xl border border-border p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Review this day</h2>
        <span className="text-sm">{labels[quality.status]}</span>
      </div>
      <p className="text-sm text-muted-foreground">{quality.reason}</p>
      {quality.energy !== null && (
        <p className="text-sm">
          {displayNutrient(quality.energy)} kcal recorded
          {quality.eligible ? " · Included in known complete-day intake" : ""}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Review all meals, drinks and portions. This confirms the log, not
        whether you met a target.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!canEdit}
          onClick={() => save("partial")}
          aria-pressed={quality.status === "partial"}
        >
          Keep partial
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => save("complete")}
          disabled={!canEdit || !active.length}
          aria-pressed={quality.status === "complete"}
        >
          Mark complete
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => save("estimated")}
          disabled={!canEdit || !active.length}
          aria-pressed={quality.status === "estimated"}
        >
          Mark estimated
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setConfirming(true);
            setError("");
            setMessage("");
          }}
          disabled={!canEdit || !!active.length}
        >
          Confirm fasting
        </Button>
      </div>
      {!canEdit && (
        <p role="status" className="text-sm text-muted-foreground">
          Cloud day reviews are read-only until nutrition migration 0012 is
          applied and verified. Existing reviews remain available.
        </p>
      )}
      {confirming && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-sm">
            Confirm no caloric food or drinks on {date}? An empty log alone does
            not mean fasting.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!canEdit}
              onClick={() => save("fasting")}
            >
              Yes, no caloric intake
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {store.status === "error" && !error && (
        <p role="alert" className="text-sm text-destructive">
          Day review sync failed. Your saved device copy will retry when
          connected.
        </p>
      )}
    </section>
  );
}
