"use client";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import {
  DEFAULT_SHIELD_STATE,
  type DistractionShieldState,
} from "@/lib/distraction-shield";
export default function ProtectionPreferences() {
  const guard = useSyncedStorage<boolean>("personal:guard-opt-in", false, {
    accountScoped: true,
  });
  const shield = useSyncedStorage<DistractionShieldState>(
    "distraction_shield_state",
    DEFAULT_SHIELD_STATE,
  );
  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="font-semibold">Optional distraction guard</h2>
      <label className="mt-2 flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={guard.value}
          onChange={(e) => {
            guard.setValue(e.target.checked);
            shield.setValue((previous) => ({
              ...previous,
              enabled: e.target.checked,
              activeLeash: null,
              lockdownUntil: null,
            }));
          }}
        />
        Prompt before opening distracting external links
      </label>
      <p className="text-sm text-muted-foreground">
        Normal navigation remains available during focus. Each prompt lets you
        continue, keep working or turn the guard off.
      </p>
    </section>
  );
}
