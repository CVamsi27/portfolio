"use client";

import { useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import FocusScene from "@/components/motivation/FocusScene";
import Modal from "@/components/trackers/Modal";
import RequireAuth from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserPrefs, displayGoalTitle } from "@/lib/user-prefs";
import { dateKey, milestonesFor } from "@/lib/trackers";
import {
  useCustomQuotes,
  useGoalState,
  useMigrateGoal,
  newCustomQuote,
} from "@/lib/tracker-store";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { goalEncouragement } from "@/lib/goal-motivation";

export default function MotivationPage() {
  useMigrateGoal();
  const { prefs } = useUserPrefs();
  const { value: goal } = useGoalState();
  const { value: favs, setValue: setFavs } = useSyncedStorage<string[]>(
    "motivation:favs",
    [],
  );
  const { value: custom, setValue: setCustom } = useCustomQuotes();
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [offset, setOffset] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [notice, setNotice] = useState("");
  const encouragement = goalEncouragement(
    prefs.goalCategory,
    prefs.goalCountry,
  );
  const deck = [
    ...encouragement.reminders,
    ...(custom ?? []).map((item) => item.text),
  ];
  const seed = Array.from(dateKey()).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  const reminder = deck[(seed + offset) % deck.length];
  const milestones = milestonesFor(
    goal ?? { metricByDay: {}, milestonesByCategory: {} },
    prefs.goalCategory,
  );
  const completed = milestones.filter((item) => item.done).length;
  const next = milestones.find((item) => !item.done)?.title;
  const toggleSave = () => {
    setFavs((previous) =>
      (previous ?? []).includes(reminder)
        ? (previous ?? []).filter((item) => item !== reminder)
        : [...(previous ?? []), reminder],
    );
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reminder);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };
  const add = () => {
    if (!draft.trim()) return;
    const item = newCustomQuote(draft.trim(), "Mine");
    setCustom((previous) => [...(previous ?? []), item]);
    setDraft("");
    setNotice("Your reminder was added.");
  };
  const actionHref = ["relocation", "career", "learning"].includes(
    prefs.goalCategory,
  )
    ? "/roadmap"
    : "/goal";

  return (
    <RequireAuth>
      <TrackerShell
        icon="flame"
        title="Motivation"
        eyebrow="Your purpose"
        subtitle={null}
      >
        <FocusScene
          goalTitle={displayGoalTitle(prefs)}
          why={encouragement.why}
          reminder={reminder}
          nextMilestone={next}
          completed={completed}
          total={milestones.length}
          actionHref={actionHref}
          saved={(favs ?? []).includes(reminder)}
          copied={copyState === "copied"}
          onNextReminder={() => {
            setOffset((value) => value + 1);
            setCopyState("idle");
          }}
          onSave={toggleSave}
          onCopy={copy}
          onPersonalReminders={() => setRemindersOpen(true)}
        />
        {copyState === "failed" && (
          <p role="status" className="text-sm text-muted-foreground">
            Couldn’t copy this reminder. You can select and copy its text.
          </p>
        )}
        <Modal
          open={remindersOpen}
          onClose={() => setRemindersOpen(false)}
          title="Personal reminders"
        >
          <div className="space-y-5">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                add();
              }}
              className="space-y-2"
            >
              <label
                htmlFor="personal-reminder"
                className="text-sm font-medium"
              >
                Your reminder
              </label>
              <Input
                id="personal-reminder"
                placeholder="Why this goal matters to me…"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={600}
              />
              <Button type="submit" disabled={!draft.trim()}>
                Add reminder
              </Button>
              {notice && (
                <p role="status" className="text-sm text-muted-foreground">
                  {notice}
                </p>
              )}
            </form>
            <section aria-label="Your own words">
              <h3 className="font-semibold">Your own words</h3>
              {(custom ?? []).length ? (
                <ul className="mt-2 space-y-3">
                  {(custom ?? []).map((item) => (
                    <li
                      key={item.id}
                      className="space-y-1 border-b border-border pb-2"
                    >
                      <p className="text-sm break-words">{item.text}</p>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setCustom((previous) =>
                            (previous ?? []).filter(
                              (value) => value.id !== item.id,
                            ),
                          )
                        }
                        aria-label={`Remove personal reminder: ${item.text}`}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a reason, a promise to yourself, or words you want to
                  remember.
                </p>
              )}
            </section>
            <section aria-label="Saved reminders">
              <h3 className="font-semibold">Saved reminders</h3>
              {(favs ?? []).length ? (
                <ul className="mt-2 space-y-3">
                  {(favs ?? []).map((item) => (
                    <li
                      key={item}
                      className="space-y-1 border-b border-border pb-2"
                    >
                      <p className="text-sm break-words">{item}</p>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setFavs((previous) =>
                            (previous ?? []).filter((value) => value !== item),
                          )
                        }
                        aria-label={`Remove saved reminder: ${item}`}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Save a reminder from the page to find it here.
                </p>
              )}
            </section>
          </div>
        </Modal>
      </TrackerShell>
    </RequireAuth>
  );
}
