"use client";
import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useUserPrefs } from "@/lib/user-prefs";
import { useAuth } from "@/lib/auth-store";
import { scopedLocalKey } from "@/lib/record-merge";

/**
 * Presence check for a stored key: true once the store has been saved at
 * least once. Reads localStorage into a boolean snapshot (stable by value)
 * and deliberately does not go through `useSyncedStorage`'s parsed-value
 * cache, which is shared per key and assumes one initial per reader.
 */
function useStoredKey(key: string) {
  const { user, configured } = useAuth();
  const localKey = scopedLocalKey(key, user?.id ?? null, configured, true);
  const subscribe = useCallback(
    (onChange: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === localKey) onChange();
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
    [localKey],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(localKey) !== null,
    () => false,
  );
}

/**
 * First-run setup card on Today. Every step is derived from an existing
 * stored key, so the card self-dismisses the moment the workspace is
 * configured and never returns for returning users (questionnaire done).
 */
export default function TodaySetupCard() {
  const { prefs } = useUserPrefs();
  const modulesChosen = useStoredKey("personal:modules");
  const remindersChosen = useStoredKey("reminders");
  const goalDone =
    Boolean(prefs.goalTitle.trim()) || prefs.goalCategory !== "general";
  const steps = [
    { id: "goal", label: "Set your goal", href: "/goal", done: goalDone },
    {
      id: "modules",
      label: "Choose your modules",
      href: "/settings#modules",
      done: modulesChosen,
    },
    {
      id: "reminders",
      label: "Turn on reminders",
      href: "/settings#reminders",
      done: remindersChosen,
    },
  ];
  if (prefs.questionnaireDone || steps.every((step) => step.done)) return null;
  return (
    <section
      className="nova-setup-card"
      data-testid="today-setup-card"
      aria-label="Workspace setup"
    >
      <div>
        <strong>Set up your workspace</strong>
        <small>Three quick choices and Today starts working for you.</small>
      </div>
      <ul>
        {steps.map((step) => (
          <li key={step.id} data-done={step.done || undefined}>
            {step.done ? (
              <CheckCircle2 aria-hidden className="nova-setup-icon" />
            ) : (
              <Circle aria-hidden className="nova-setup-icon" />
            )}
            <Link href={step.href}>{step.label}</Link>
            <span className="sr-only">{step.done ? "Done" : "To do"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
