"use client";

import { useEffect, useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import FocusScene from "@/components/motivation/FocusScene";
import Modal from "@/components/trackers/Modal";
import RequireAuth from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useUserPrefs,
  GOAL_CATEGORIES,
  displayGoalTitle,
} from "@/lib/user-prefs";
import { dateKey, milestonesFor } from "@/lib/trackers";
import {
  useCustomQuotes,
  useGoalState,
  useMigrateGoal,
  newCustomQuote,
} from "@/lib/tracker-store";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import {
  fallbackMotivationMedia,
  type MotivationMedia,
} from "@/lib/motivation-media";
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
  const { value: mediaCache, setValue: setMediaCache } = useSyncedStorage<
    Record<string, MotivationMedia>
  >("motivation:media", {});
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
  const country =
    prefs.goalCategory === "relocation" ? prefs.goalCountry : undefined;
  const mediaKey = `v2:goal:${prefs.goalCategory}:${country ?? "none"}`;
  const fallback = useMemo(
    () => fallbackMotivationMedia("goal", prefs.goalCategory, country),
    [prefs.goalCategory, country],
  );
  const media = mediaCache?.[mediaKey] ?? fallback;

  useEffect(() => {
    if (!prefs.questionnaireDone) return;
    const cached = mediaCache?.[mediaKey];
    if (cached && Date.now() - cached.fetchedAt < 86_400_000) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      source: "goal",
      category: prefs.goalCategory,
    });
    if (country) params.set("country", country);
    fetch(`/api/motivation-media?${params}`, { signal: controller.signal })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Unavailable")),
      )
      .then((result: MotivationMedia) => {
        if (!controller.signal.aborted)
          setMediaCache((previous) => ({
            ...(previous ?? {}),
            [mediaKey]: result,
          }));
      })
      .catch(() => {
        /* Local goal-aware scene stays usable without the service. */
      });
    return () => controller.abort();
  }, [
    prefs.questionnaireDone,
    prefs.goalCategory,
    country,
    mediaKey,
    mediaCache,
    setMediaCache,
  ]);

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
  const label =
    GOAL_CATEGORIES.find((item) => item.id === prefs.goalCategory)?.label ??
    "Your goal";
  const actionHref = ["relocation", "career", "learning"].includes(
    prefs.goalCategory,
  )
    ? "/roadmap"
    : "/goal";

  return (
    <RequireAuth>
      <TrackerShell
        icon="flame"
        title={null}
        eyebrow="Your purpose"
        subtitle="Keep your goal close. Take one meaningful step today."
      >
        <FocusScene
          goalTitle={displayGoalTitle(prefs)}
          goalLabel={label}
          why={encouragement.why}
          reminder={reminder}
          nextMilestone={next}
          completed={completed}
          total={milestones.length}
          actionHref={actionHref}
          saved={(favs ?? []).includes(reminder)}
          copied={copyState === "copied"}
          media={media}
          onNextReminder={() => {
            setOffset((value) => value + 1);
            setCopyState("idle");
          }}
          onSave={toggleSave}
          onCopy={copy}
        />
        {copyState === "failed" && (
          <p role="status" className="text-sm text-muted-foreground">
            Couldn’t copy this reminder. You can select and copy its text.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Keep words that bring you back to your purpose.
          </p>
          <Button variant="ghost" onClick={() => setRemindersOpen(true)}>
            Personal reminders
          </Button>
        </div>
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
