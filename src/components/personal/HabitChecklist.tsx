"use client";
import { useNow } from "@/lib/tracker-store";
import { useState } from "react";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { zonedDate } from "@/lib/routine-reminders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export type Habit = {
  id: string;
  name: string;
  updatedAt: number;
  deleted?: boolean;
};
export type HabitCompletion = {
  id: string;
  habitId: string;
  date: string;
  done: boolean;
  updatedAt: number;
  deleted?: boolean;
};
export default function HabitChecklist() {
  const items = useSyncedStorage<Record<string, Habit>>(
    "habits:items",
    {},
    { accountScoped: true, records: true },
  );
  const history = useSyncedStorage<Record<string, HabitCompletion>>(
    "habits:history",
    {},
    { accountScoped: true, records: true },
  );
  const [name, setName] = useState("");
  const now = useNow(30_000);
  const date = zonedDate(now);
  const active = Object.values(items.value).filter((item) => !item.deleted);
  return (
    <section className="rounded-xl border border-border p-4 space-y-3">
      <h2 className="font-semibold">Small habits</h2>
      {active.map((item) => {
        const id = `${item.id}:${date}`;
        return (
          <div
            key={item.id}
            className="flex gap-2 items-center justify-between"
          >
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={history.value[id]?.done === true}
                onChange={(e) =>
                  history.setValue((previous) => ({
                    ...previous,
                    [id]: {
                      id,
                      habitId: item.id,
                      date,
                      done: e.target.checked,
                      updatedAt: Math.max(
                        Date.now(),
                        (previous[id]?.updatedAt ?? 0) + 1,
                      ),
                    },
                  }))
                }
              />
              {item.name}
            </label>
            <Button
              variant="ghost"
              aria-label={`Remove ${item.name}`}
              onClick={() =>
                items.setValue((previous) => ({
                  ...previous,
                  [item.id]: {
                    ...item,
                    deleted: true,
                    updatedAt: Math.max(Date.now(), item.updatedAt + 1),
                  },
                }))
              }
            >
              Remove
            </Button>
          </div>
        );
      })}
      {active.length < 5 && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || active.length >= 5) return;
            const id = crypto.randomUUID();
            items.setValue((previous) => ({
              ...previous,
              [id]: { id, name: name.trim(), updatedAt: Date.now() },
            }));
            setName("");
          }}
        >
          <Input
            aria-label="New habit"
            value={name}
            maxLength={150}
            onChange={(e) => setName(e.target.value)}
            placeholder="One small daily action"
          />
          <Button type="submit" disabled={!name.trim()}>
            Add
          </Button>
        </form>
      )}
      <p className="text-xs text-muted-foreground">
        Up to five habits · today’s checklist · removing a habit keeps its
        history.
      </p>
    </section>
  );
}
