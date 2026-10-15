"use client";

import { useFasting } from "@/lib/tracker-store";

export default function MealWindowRetention() {
  const store = useFasting();
  return (
    <details className="workspace-disclosure" id="meal-window-retention">
      <summary>Eating-window history retention</summary>
      <label className="field-label">
        Auto-clear saved windows
        <select
          aria-label="Auto-clear saved windows"
          value={store.value.autoClearHours ?? 720}
          onChange={(event) =>
            store.setValue({
              ...store.value,
              autoClearHours: Number(event.target.value) as 24 | 168 | 720,
            })
          }
        >
          <option value={24}>24 hours</option>
          <option value={168}>7 days</option>
          <option value={720}>30 days</option>
        </select>
      </label>
      <p className="text-sm text-muted-foreground">
        Meal-window records older than this duration clear automatically when
        Water &amp; eating window opens. Export a backup before shortening it.
      </p>
    </details>
  );
}
