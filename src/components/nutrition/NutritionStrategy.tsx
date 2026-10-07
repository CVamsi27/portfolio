"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import {
  programForDate,
  validProgram,
  canEditNutritionProgram,
  type NutritionProgram,
} from "@/lib/nutrition-program";
import { displayNutrient } from "@/lib/nutrition";

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const fields = ["energy", "protein", "carbs", "fat"] as const;
const names = {
  energy: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
};
type DraftDay = Record<(typeof fields)[number], string>;
const emptyDays = (): DraftDay[] =>
  weekdays.map(() => ({ energy: "", protein: "", carbs: "", fat: "" }));
const goals = { loss: "Loss", maintain: "Maintenance", gain: "Gain" };
export default function NutritionStrategy({ date }: { date: string }) {
  const store = useSyncedStorage<Record<string, NutritionProgram>>(
    "nutrition:programs",
    {},
    { accountScoped: true, records: true },
  );
  const canEdit = canEditNutritionProgram(
    isSupabaseConfigured(),
    process.env.NEXT_PUBLIC_NUTRITION_PROGRAM_ENABLED,
  );
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<NutritionProgram["mode"]>("manual");
  const [goal, setGoal] = useState<NutritionProgram["goal"]>("maintain");
  const [startDate, setStartDate] = useState(date);
  const [days, setDays] = useState<DraftDay[]>(emptyDays);
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const active = programForDate(store.value, date);
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const today = active?.days[weekday];
  const history = Object.values(store.value)
    .filter((p) => validProgram(p) && !p.deleted)
    .sort(
      (a, b) =>
        b.startDate.localeCompare(a.startDate) || b.updatedAt - a.updatedAt,
    );
  const totals = Object.fromEntries(
    fields.map((field) => [
      field,
      days.reduce((sum, day) => sum + (Number(day[field]) || 0), 0),
    ]),
  ) as Record<(typeof fields)[number], number>;
  const create = () => {
    if (!canEdit) return;
    setMode(active?.mode ?? "manual");
    setGoal(active?.goal ?? "maintain");
    setStartDate(date);
    setDays(
      active
        ? active.days.map(
            (day) =>
              Object.fromEntries(
                fields.map((field) => [field, String(day[field])]),
              ) as DraftDay,
          )
        : emptyDays(),
    );
    setBudget(
      active
        ? String(active.days.reduce((sum, day) => sum + day.energy, 0))
        : "",
    );
    setError("");
    setMessage("");
    setEditing(true);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) {
      setError(
        "Cloud program editing is read-only until the nutrition storage upgrade is verified.",
      );
      return;
    }
    setError("");
    setMessage("");
    const program: NutritionProgram = {
      id: crypto.randomUUID(),
      startDate,
      mode,
      goal,
      days: days.map(
        (day) =>
          Object.fromEntries(
            fields.map((field) => [field, Number(day[field])]),
          ) as NutritionProgram["days"][number],
      ),
      updatedAt: Date.now(),
    };
    if (
      days.some((day) => fields.some((field) => !day[field].trim())) ||
      !validProgram(program)
    ) {
      setError(
        "Enter a valid start date, positive daily calories and non-negative grams for all macros.",
      );
      return;
    }
    if (
      mode === "flexible" &&
      (!budget.trim() ||
        !Number.isFinite(Number(budget)) ||
        Number(budget) <= 0 ||
        Math.abs(totals.energy - Number(budget)) > 0.01)
    ) {
      setError(
        "The seven daily calorie amounts must equal your chosen weekly calorie budget.",
      );
      return;
    }
    try {
      store.setValue((previous) => ({ ...previous, [program.id]: program }));
      setEditing(false);
      setMessage(
        "Program saved. Earlier versions and food records are preserved.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save nutrition program.",
      );
    }
  };
  return (
    <section
      aria-label="Nutrition strategy"
      className="rounded-xl border border-border p-4 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Nutrition strategy</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={create}
          disabled={!canEdit}
        >
          New program
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Use your own calorie and macro plan. Manual and flexible programs never
        adjust your targets automatically.
      </p>
      {today && active ? (
        <div className="space-y-2">
          <p className="text-sm">
            {goals[active.goal]} ·{" "}
            {active.mode === "flexible"
              ? "Your weekly allocation"
              : "Manual targets"}{" "}
            · From {active.startDate}
          </p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fields.map((field) => (
              <div key={field}>
                <dt className="text-xs text-muted-foreground">
                  {names[field]}
                </dt>
                <dd className="font-medium">
                  {displayNutrient(today[field])}{" "}
                  {field === "energy" ? "kcal" : "g"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className="text-sm">
          No program applies to {date}. Add targets you already use, including
          an externally prescribed plan.
        </p>
      )}
      {!canEdit && (
        <p role="status" className="text-sm text-muted-foreground">
          Cloud program editing is read-only until nutrition migration 0012 is
          applied and verified. Existing programs remain available.
        </p>
      )}
      {editing && (
        <form onSubmit={save} className="space-y-4 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm">
              Program mode
              <select
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as NutritionProgram["mode"])
                }
                className="w-full rounded-md border border-border bg-background p-2"
              >
                <option value="manual">Manual daily targets</option>
                <option value="flexible">Flexible weekly allocation</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              Goal
              <select
                value={goal}
                onChange={(e) =>
                  setGoal(e.target.value as NutritionProgram["goal"])
                }
                className="w-full rounded-md border border-border bg-background p-2"
              >
                <option value="loss">Loss</option>
                <option value="maintain">Maintenance</option>
                <option value="gain">Gain</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              Program start date
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background p-2"
              />
            </label>
          </div>
          {mode === "flexible" && (
            <label className="block space-y-1 text-sm">
              Your weekly calorie budget
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="block w-full rounded-md border border-border bg-background p-2"
              />
              <span className="block text-xs text-muted-foreground">
                Choose the budget yourself, then distribute it across seven
                days.
              </span>
            </label>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setDays((previous) => previous.map(() => ({ ...previous[0] })))
            }
          >
            Copy Sunday targets to all days
          </Button>
          <div className="space-y-3">
            {weekdays.map((name, index) => (
              <fieldset
                key={name}
                className="rounded-lg border border-border p-3"
              >
                <legend className="px-1 text-sm font-medium">{name}</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {fields.map((field) => (
                    <label key={field} className="space-y-1 text-xs">
                      {names[field]} ({field === "energy" ? "kcal" : "g"})
                      <input
                        aria-label={`${name} ${names[field].toLowerCase()}`}
                        type="number"
                        inputMode="decimal"
                        min={field === "energy" ? "0.01" : "0"}
                        step="any"
                        required
                        value={days[index][field]}
                        onChange={(e) =>
                          setDays((previous) =>
                            previous.map((day, i) =>
                              i === index
                                ? { ...day, [field]: e.target.value }
                                : day,
                            ),
                          )
                        }
                        className="w-full rounded-md border border-border bg-background p-2 text-sm"
                      />
                    </label>
                  ))}
                </div>
                {fields.every(
                  (field) =>
                    days[index][field].trim() !== "" &&
                    Number.isFinite(Number(days[index][field])),
                ) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    4/4/9 macro estimate:{" "}
                    {displayNutrient(
                      Number(days[index].protein) * 4 +
                        Number(days[index].carbs) * 4 +
                        Number(days[index].fat) * 9,
                    )}{" "}
                    kcal · Entered calories:{" "}
                    {displayNutrient(Number(days[index].energy))} kcal. These
                    can differ due to rounding, fibre or label methods.
                  </p>
                )}
              </fieldset>
            ))}
          </div>
          <p className="text-sm">
            Weekly allocation: {displayNutrient(totals.energy)} kcal ·{" "}
            {displayNutrient(totals.protein)} g protein ·{" "}
            {displayNutrient(totals.carbs)} g carbs ·{" "}
            {displayNutrient(totals.fat)} g fat
            {mode === "flexible" && budget.trim()
              ? ` · Budget difference: ${displayNutrient(totals.energy - Number(budget))} kcal`
              : ""}
          </p>
          <div className="flex gap-2">
            <Button type="submit">Save program</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      {history.length > 0 && (
        <details>
          <summary className="cursor-pointer py-2 text-sm font-medium">
            Program history ({history.length})
          </summary>
          <ul className="space-y-3 text-sm">
            {history.map((program) => (
              <li key={program.id} className="border-t border-border pt-2">
                From {program.startDate} · {goals[program.goal]} ·{" "}
                {program.mode}
                <p className="text-xs text-muted-foreground">
                  Weekly calories:{" "}
                  {displayNutrient(
                    program.days.reduce((sum, day) => sum + day.energy, 0),
                  )}{" "}
                  kcal{program.startDate > date ? " · Scheduled" : ""}
                </p>
                <dl className="grid gap-1 mt-2">
                  {program.days.map((day, i) => (
                    <div
                      key={weekdays[i]}
                      className="flex flex-wrap justify-between gap-x-2"
                    >
                      <dt>{weekdays[i]}</dt>
                      <dd>
                        {displayNutrient(day.energy)} kcal · P{" "}
                        {displayNutrient(day.protein)} / C{" "}
                        {displayNutrient(day.carbs)} / F{" "}
                        {displayNutrient(day.fat)} g
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </details>
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
          Program sync failed. Your saved device copy will retry when connected.
        </p>
      )}
    </section>
  );
}
