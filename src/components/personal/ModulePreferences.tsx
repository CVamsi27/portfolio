"use client";
import { DEFAULT_MODULES, usePersonalModules } from "@/lib/personal-modules";
const labels = {
  food: "Food and nutrients",
  routine: "Meal and supplement routine",
  study: "Study timetable",
  recovery: "Recovery check-in",
  habits: "Habit checklist",
  fasting: "Fasting",
  movement: "Movement",
};
export default function ModulePreferences() {
  const store = usePersonalModules();
  return (
    <section className="rounded-xl border border-border p-4" id="modules">
      <h2 className="font-semibold">Today modules</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose what belongs on your day. Turning a module off keeps its records.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {Object.keys(DEFAULT_MODULES).map((key) => {
          const id = key as keyof typeof DEFAULT_MODULES;
          return (
            <label
              key={id}
              className="flex min-h-11 items-center gap-3 text-sm"
            >
              <input
                type="checkbox"
                checked={store.value[id] ?? DEFAULT_MODULES[id]}
                onChange={(e) =>
                  store.setValue((previous) => ({
                    ...previous,
                    [id]: e.target.checked,
                  }))
                }
              />
              {labels[id]}
            </label>
          );
        })}
      </div>
    </section>
  );
}
