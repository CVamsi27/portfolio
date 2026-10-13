"use client";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import {
  DEFAULT_FOCUS_PREFERENCES,
  focusPreferences,
  type FocusPreferences as Preferences,
} from "@/lib/focus-preferences";
export default function FocusPreferences() {
  const store = useSyncedStorage<Preferences>(
    "focus:preferences",
    DEFAULT_FOCUS_PREFERENCES,
    { accountScoped: true },
  );
  const value = focusPreferences(store.value);
  return (
    <section className="workspace-panel space-y-4">
      <h2 className="font-display text-xl">Session defaults</h2>
      <label className="field-label">
        Session mode
        <select
          value={value.mode}
          onChange={(event) =>
            store.setValue({
              ...value,
              mode: event.target.value === "open" ? "open" : "timed",
            })
          }
        >
          <option value="timed">Timed</option>
          <option value="open">Open-ended</option>
        </select>
      </label>
      <label className="field-label">
        Default duration
        <select
          value={value.plannedMinutes}
          onChange={(event) =>
            store.setValue({
              ...value,
              plannedMinutes: Number(
                event.target.value,
              ) as Preferences["plannedMinutes"],
            })
          }
        >
          {[25, 50, 90].map((minutes) => (
            <option value={minutes} key={minutes}>
              {minutes} minutes
            </option>
          ))}
        </select>
      </label>
      <label className="flex gap-3 items-center min-h-11 text-sm">
        <input
          type="checkbox"
          checked={value.fullscreen}
          onChange={(event) =>
            store.setValue({ ...value, fullscreen: event.target.checked })
          }
        />
        Fullscreen by default
      </label>
      {store.status === "error" && (
        <p role="status">
          Defaults are saved on this device. Cloud sync needs attention.
        </p>
      )}
    </section>
  );
}
