"use client";

import { useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { SyncBadge } from "@/components/auth/AuthButton";
import { dateKey } from "@/lib/trackers";
import { cn } from "@/lib/utils";

type Todo = { id: string; text: string; done: boolean; date: string };

export default function TodoPage() {
  const { value: todos, setValue: setTodos, status } = useSyncedStorage<Todo[]>("todos", []);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<"today" | "all" | "done">("today");

  const today = dateKey();
  const visible = useMemo(() => {
    if (filter === "today") return todos.filter((t) => t.date === today);
    if (filter === "done") return todos.filter((t) => t.done);
    return todos;
  }, [todos, filter, today]);

  const todayList = todos.filter((t) => t.date === today);
  const doneToday = todayList.filter((t) => t.done).length;
  const pct = todayList.length ? Math.round((doneToday / todayList.length) * 100) : 0;

  const add = () => {
    const v = text.trim();
    if (!v) return;
    setTodos([...todos, { id: `${Date.now()}`, text: v, done: false, date: today }]);
    setText("");
  };

  return (
    <RequireAuth>
    <TrackerShell
      icon="☑"
      title="Todo"
      subtitle="Quick daily list. Everything defaults to today — check it off, clear it, start fresh tomorrow."
      badge={<SyncBadge status={status} />}
    >
      <Card>
        <CardContent className="p-5">
          <div className="flex gap-2">
            <Input
              placeholder="Add a task + Enter"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button onClick={add}>Add</Button>
          </div>
          <div className="mt-3 flex items-center gap-1 rounded-xl bg-muted/50 p-1">
            {(["today", "all", "done"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  filter === f ? "bg-background shadow" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "today" ? `Today (${todayList.length})` : f}
              </button>
            ))}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {doneToday}/{todayList.length} done today · {pct}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing here. Add your first task above — keep it under 5 items for a quick day.
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((t) => (
                <li
                  key={t.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                    t.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60",
                  )}
                >
                  <button
                    onClick={() => setTodos(todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs",
                      t.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/50",
                    )}
                    aria-label="Toggle done"
                  >
                    {t.done ? "✓" : ""}
                  </button>
                  <span className={cn("flex-1", t.done && "line-through opacity-60")}>{t.text}</span>
                  {filter !== "today" && <span className="text-[11px] tabular-nums text-muted-foreground">{t.date.slice(5)}</span>}
                  <button
                    onClick={() => setTodos(todos.filter((x) => x.id !== t.id))}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          {todayList.some((t) => t.done) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setTodos(todos.filter((t) => !(t.date === today && t.done)))}
            >
              Clear completed today
            </Button>
          )}
        </CardContent>
      </Card>
    </TrackerShell>
    </RequireAuth>
  );
}
