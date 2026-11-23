"use client";
import { DEFAULT_MODULES, usePersonalModules } from "@/lib/personal-modules";

const ACTIVE_MODULES: Array<{
  id: keyof typeof DEFAULT_MODULES;
  label: string;
  hint: string;
}> = [
  {
    id: "study",
    label: "Career & study timetable",
    hint: "Show daily hiring blocks and study.buildora.work assignments on Today & Plan.",
  },
  {
    id: "habits",
    label: "Daily habit checklist",
    hint: "Optional checklist panel on Today.",
  },
];

export default function ModulePreferences() {
  const store = usePersonalModules();
  return (
    <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-3" id="modules">
      <div>
        <h2 className="font-display text-base font-semibold">Workspace modules</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Health metrics sync automatically via Google Health Connect. Manual food, water, workout, and fasting modules have been retired.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ACTIVE_MODULES.map((mod) => (
          <label
            key={mod.id}
            className="flex min-h-11 items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0"
              checked={store.value[mod.id] ?? DEFAULT_MODULES[mod.id]}
              onChange={(e) =>
                store.setValue((previous) => ({
                  ...previous,
                  [mod.id]: e.target.checked,
                }))
              }
            />
            <span>
              <strong className="block font-medium">{mod.label}</strong>
              <span className="text-xs text-muted-foreground">{mod.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
