"use client";

import { LOCKDOWN_PLATFORMS, type LockdownPlatform } from "@/lib/lockdown";
import { useLockdownPreferences } from "@/lib/lockdown-store";

export default function DevicePreparation({ compact = false }: { compact?: boolean }) {
  const { value: preferences, setValue } = useLockdownPreferences();

  const togglePlatform = (platform: LockdownPlatform) => {
    setValue({
      ...preferences,
      deviceChecklist: {
        ...preferences.deviceChecklist,
        [platform]: !preferences.deviceChecklist[platform],
      },
    });
  };

  return (
    <section data-testid="device-preparation" className={compact ? "border-t border-white/10 pt-4" : "dossier-panel"}>
      <div>
        <p className="dossier-kicker">Device preparation</p>
        <h2 className="mt-1 font-display text-lg font-bold">Make the boundary real on your device.</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          NOVA//OS can protect this app. It cannot disable other apps or turn on system Do Not Disturb for you.
        </p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {LOCKDOWN_PLATFORMS.map((platform) => (
          <label key={platform.id} className="flex min-h-11 cursor-pointer items-start gap-3 border border-border/60 bg-card/40 p-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[var(--color-dossier-lime)]"
              checked={preferences.deviceChecklist[platform.id]}
              onChange={() => togglePlatform(platform.id)}
              aria-label={`${platform.label} setup complete`}
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{platform.label}</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{platform.steps.join(" ")}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
