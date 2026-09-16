"use client";

import { useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import Stat from "@/components/trackers/Stat";
import Segmented from "@/components/trackers/Segmented";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { SyncBadge } from "@/components/auth/AuthButton";
import { GOAL_MILESTONES, GOAL_SNIPPETS, dateKey } from "@/lib/trackers";
import { useUserPrefs, GOAL_CATEGORIES, type GoalCategory } from "@/lib/user-prefs";
import { cn } from "@/lib/utils";
import { Check, Copy, Target } from "lucide-react";

type GoalState = {
  hub: string;
  visa: string;
  dailyTarget: number;
  checks: boolean[];
  appsByDay: Record<string, number>;
  category: GoalCategory;
};

const DEFAULTS: GoalState = {
  hub: "Berlin Hub",
  visa: "EU Blue Card",
  dailyTarget: 3,
  checks: [false, false, false, false],
  appsByDay: {},
  category: "relocation",
};

export default function GoalPage() {
  const { prefs, setPrefs } = useUserPrefs();
  const { value: g, setValue: setG, status } = useSyncedStorage<GoalState>("goal", DEFAULTS);
  const [snipType, setSnipType] = useState<string>("LinkedIn");
  const [copied, setCopied] = useState(false);
  const [todayApps, setTodayApps] = useState("");

  const safe = g ?? DEFAULTS;
  const goalCat = prefs.goalCategory ?? safe.category ?? "relocation";
  const milestones = GOAL_MILESTONES[goalCat] ?? GOAL_MILESTONES.relocation;
  const doneCount = (safe.checks ?? []).filter(Boolean).length;
  const goalPct = milestones.length ? Math.round((doneCount / milestones.length) * 100) : 0;
  const goalMeta = GOAL_CATEGORIES.find((gc) => gc.id === goalCat) ?? GOAL_CATEGORIES[0];

  const last7 = useMemo(() => {
    const out: { d: string; n: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      out.push({ d: k.slice(5), n: safe.appsByDay?.[k] ?? 0 });
    }
    return out;
  }, [safe.appsByDay]);
  const weekly = last7.reduce((a, b) => a + b.n, 0);
  const estDays = goalCat === "relocation"
    ? Math.max(12, Math.round(90 - doneCount * 12 - Math.min(weekly, 25)))
    : goalCat === "career"
      ? Math.max(7, Math.round(60 - doneCount * 15 - Math.min(weekly * 3, 45)))
      : Math.max(14, Math.round(30 - doneCount * 7));

  const snippet = (GOAL_SNIPPETS[goalCat] ?? GOAL_SNIPPETS.custom)(safe.hub);

  const logApps = () => {
    const n = parseInt(todayApps, 10);
    if (!n || n <= 0) return;
    const k = dateKey();
    setG({ ...safe, appsByDay: { ...safe.appsByDay, [k]: (safe.appsByDay?.[k] ?? 0) + n } });
    setTodayApps("");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const changeCategory = (cat: GoalCategory) => {
    setPrefs({ ...prefs, goalCategory: cat });
    const newMilestones = GOAL_MILESTONES[cat] ?? GOAL_MILESTONES.relocation;
    setG({ ...safe, category: cat, checks: new Array(newMilestones.length).fill(false) });
  };

  const relocationMode = goalCat === "relocation";

  return (
    <RequireAuth>
    <TrackerShell
      icon="flag"
      title={prefs.goalTitle || goalMeta.label}
      subtitle={`${goalMeta.icon} ${goalMeta.desc}. Track your milestones and daily progress.`}
      badge={<SyncBadge status={status} />}
    >
      {/* goal category selector */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-medium">Goal Category</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {GOAL_CATEGORIES.map((gc) => (
              <button
                key={gc.id}
                onClick={() => changeCategory(gc.id)}
                className={cn(
                  "rounded-xl border p-2 text-center text-xs transition-all",
                  goalCat === gc.id
                    ? "border-primary bg-primary/10 font-semibold shadow-sm"
                    : "border-border/60 hover:bg-accent",
                )}
              >
                <span className="text-lg">{gc.icon}</span>
                <p className="mt-0.5 font-medium">{gc.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* trajectory / progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-display font-bold">Milestones</h2>
            </div>
            <span className="text-sm font-semibold tabular-nums text-primary">{goalPct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Weekly Progress" value={`${weekly} items`} />
            <Stat label="Est. Completion" value={`~${estDays} days`} />
            <Stat label="Milestones" value={`${doneCount}/${milestones.length}`} accent />
          </div>
        </CardContent>
      </Card>

      {/* controls (for relocation/career goals) */}
      {relocationMode && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Target City</p>
                <div className="mt-2">
                  <Segmented
                    label="Target city"
                    options={[
                      { value: "Berlin Hub", label: "Berlin" },
                      { value: "Munich Hub", label: "Munich" },
                    ]}
                    value={safe.hub}
                    onChange={(hub) => setG({ ...safe, hub })}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Visa Pathway</p>
                <div className="mt-2">
                  <Segmented
                    label="Visa pathway"
                    options={[
                      { value: "EU Blue Card", label: "EU Blue Card" },
                      { value: "IT Specialist Fast-Track", label: "IT Specialist" },
                    ]}
                    value={safe.visa}
                    onChange={(visa) => setG({ ...safe, visa })}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Daily Target</label>
                <span className="text-sm font-semibold tabular-nums">{safe.dailyTarget} / day</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={safe.dailyTarget}
                onChange={(e) => setG({ ...safe, dailyTarget: Number(e.target.value) })}
                className="mt-2 w-full"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                placeholder={`Log today's items (e.g. ${safe.dailyTarget})`}
                value={todayApps}
                onChange={(e) => setTodayApps(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && logApps()}
              />
              <Button onClick={logApps}>Log</Button>
            </div>
            <div className="flex items-end gap-1.5 pt-1">
              {last7.map((d) => (
                <div key={d.d} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-primary to-fuchsia-500"
                    style={{ height: `${Math.max(4, Math.min(64, d.n * 12))}px`, opacity: d.n ? 1 : 0.25 }}
                    title={`${d.n} items`}
                  />
                  <span className="text-[10px] tabular-nums text-muted-foreground">{d.d.slice(3) || d.d}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* milestones checklist */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-display font-bold">Milestone checklist</h2>
          <ul className="mt-3 space-y-2">
            {milestones.map((m, i) => (
              <li key={m}>
                <button
                  onClick={() => {
                    const checks = [...(safe.checks ?? [])];
                    while (checks.length < milestones.length) checks.push(false);
                    checks[i] = !checks[i];
                    setG({ ...safe, checks });
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                    (safe.checks ?? [])[i] ? "border-emerald-500/40 bg-emerald-500/10" : "border-border/60 hover:bg-accent",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[11px] transition-all active:scale-90",
                      (safe.checks ?? [])[i] ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground",
                    )}
                  >
                    {(safe.checks ?? [])[i] ? <Check className="h-3 w-3" /> : ""}
                  </span>
                  <span className={(safe.checks ?? [])[i] ? "line-through opacity-70" : ""}>{m}</span>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* outreach / reflection generator */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">
              {relocationMode ? "Outreach generator" : "Daily reflection"}
            </h2>
          </div>
          <p className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm leading-relaxed">
            {snippet}
          </p>
          <div className="mt-3 flex justify-end">
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? <><Check className="mr-1.5 h-4 w-4" /> Copied</> : <><Copy className="mr-1.5 h-4 w-4" /> Copy</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TrackerShell>
    </RequireAuth>
  );
}
