"use client";

import { useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import Stat from "@/components/trackers/Stat";
import Segmented from "@/components/trackers/Segmented";
import Modal from "@/components/trackers/Modal";
import MiniBars from "@/components/trackers/MiniBars";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SyncBadge } from "@/components/auth/AuthButton";
import { useUserPrefs, GOAL_CATEGORIES, RELOCATION_COUNTRIES, displayGoalTitle, type GoalCategory } from "@/lib/user-prefs";
import {
  type GoalState,
  type Milestone,
  GOAL_TOTAL_PRESETS,
  GOAL_SNIPPETS,
  calculateStreak,
  dateKey,
  goalEtaDays,
  lastNDates,
  milestonesFor,
  newMilestoneId,
  normalizeWeeklyCommitments,
  type WeeklyCommitment,
} from "@/lib/trackers";
import { useGoalState, useMigrateGoal, useNow } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";
import SignalPanel from "@/components/trackers/SignalPanel";
import StoryPanel from "@/components/trackers/StoryPanel";
import { Check, ChevronDown, ChevronUp, Copy, Pencil, Plus, Target, Trash2, TrendingUp, X } from "lucide-react";
import { TrackerIcon } from "@/components/trackers/icons";

type MilestoneDraft = { title: string };

export default function GoalPage() {
  useMigrateGoal();
  const { prefs, setPrefs } = useUserPrefs();
  const { value: g, setValue: setG, status } = useGoalState();
  const now = useNow(60_000);

  const safe: GoalState = useMemo(() => g ?? { metricByDay: {}, milestonesByCategory: {} }, [g]);
  const goalCat = prefs.goalCategory;
  const goalMeta = GOAL_CATEGORIES.find((gc) => gc.id === goalCat) ?? GOAL_CATEGORIES[0];

  const metric = useMemo(
    () => ({
      label: prefs.dailyMetricLabel || DEFAULT_LABELS[goalCat],
      target: prefs.dailyMetricTarget || DEFAULT_TARGETS[goalCat],
    }),
    [prefs.dailyMetricLabel, prefs.dailyMetricTarget, goalCat],
  );

  const [metricLabelDraft, setMetricLabelDraft] = useState<string | null>(null);
  const [metricTargetDraft, setMetricTargetDraft] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState("");
  const [copied, setCopied] = useState(false);
  const [msModal, setMsModal] = useState<{ mode: "add" } | { mode: "edit"; id: string } | null>(null);
  const [msDraft, setMsDraft] = useState<MilestoneDraft>({ title: "" });
  const [weeklyCommitmentDraft, setWeeklyCommitmentDraft] = useState(safe.weeklyCommitment?.text ?? "");
  const [weeklyReviewNotice, setWeeklyReviewNotice] = useState<string | null>(null);

  const today = dateKey();
  const weekOf = useMemo(() => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
    return dateKey(day);
  }, []);
  const milestones = useMemo(() => milestonesFor(safe, goalCat), [safe, goalCat]);
  const weeklyCommitments = useMemo(() => normalizeWeeklyCommitments(safe), [safe]);
  const doneCount = milestones.filter((m) => m.done).length;
  const goalPct = milestones.length ? Math.round((doneCount / milestones.length) * 100) : 0;

  const metricByDay = useMemo(() => safe.metricByDay ?? {}, [safe]);
  const todayValue = metricByDay[today] ?? 0;
  const totalLogged = useMemo(() => Object.values(metricByDay).reduce((a, b) => a + b, 0), [metricByDay]);

  const last14 = useMemo(
    () =>
      lastNDates(14).map((d) => ({
        label: d.toLocaleDateString("en-US", { day: "numeric" }),
        value: metricByDay[dateKey(d)] ?? 0,
      })),
    [metricByDay],
  );
  const last7Total = last14.slice(-7).reduce((a, b) => a + b.value, 0);
  const avg7 = last7Total / 7;
  const streak = calculateStreak(Object.entries(metricByDay).filter(([, v]) => v >= metric.target).map(([k]) => k));
  const goalTotal = prefs.dailyMetricGoalTotal ?? GOAL_TOTAL_PRESETS[goalCat];
  const etaDays = goalEtaDays(totalLogged, goalTotal, avg7);
  const etaDate = etaDays !== null ? new Date(now + etaDays * 86_400_000) : null;

  const logToday = (n: number) => {
    if (!Number.isFinite(n) || n === 0) return;
    setG({ ...safe, metricByDay: { ...metricByDay, [today]: Math.max(0, todayValue + n) } });
  };

  const saveMetricEdits = () => {
    setPrefs({
      ...prefs,
      dailyMetricLabel: metricLabelDraft?.trim() || prefs.dailyMetricLabel,
      dailyMetricTarget: metricTargetDraft ? Math.max(1, Number(metricTargetDraft) || 1) : prefs.dailyMetricTarget,
    });
    setMetricLabelDraft(null);
    setMetricTargetDraft(null);
  };

  // ── milestone CRUD ──
  const setMilestones = (next: Milestone[]) =>
    setG({ ...safe, milestonesByCategory: { ...safe.milestonesByCategory, [goalCat]: next } });

  const addMilestone = () => {
    const title = msDraft.title.trim();
    if (!title) return;
    setMilestones([...milestones, { id: newMilestoneId(), title, done: false, doneAt: null }]);
    setMsModal(null);
  };

  const editMilestone = () => {
    const title = msDraft.title.trim();
    if (!title || msModal?.mode !== "edit") return;
    setMilestones(milestones.map((m) => (m.id === msModal.id ? { ...m, title } : m)));
    setMsModal(null);
  };

  const toggleMilestone = (id: string) =>
    setMilestones(milestones.map((m) => (m.id === id ? { ...m, done: !m.done, doneAt: !m.done ? dateKey() : null } : m)));

  const deleteMilestone = (id: string) => setMilestones(milestones.filter((m) => m.id !== id));

  const moveMilestone = (id: string, dir: -1 | 1) => {
    const i = milestones.findIndex((m) => m.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= milestones.length) return;
    const next = [...milestones];
    [next[i], next[j]] = [next[j], next[i]];
    setMilestones(next);
  };

  const snippet = (GOAL_SNIPPETS[goalCat] ?? GOAL_SNIPPETS.custom)(safe.hub);

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
    setPrefs({ ...prefs, goalCategory: cat, dailyMetricLabel: undefined, dailyMetricTarget: undefined });
  };

  const relocationMode = goalCat === "relocation";
  const weeklyCommitment = weeklyCommitments.find((commitment) => commitment.weekOf === weekOf && commitment.status !== "closed");
  const previousPending = [...weeklyCommitments]
    .filter((commitment) => commitment.weekOf !== weekOf && commitment.status === "active")
    .sort((a, b) => b.weekOf.localeCompare(a.weekOf))[0];
  const saveCommitmentState = (next: WeeklyCommitment[]) => setG({ ...safe, weeklyCommitment: undefined, weeklyCommitments: next });
  const saveWeeklyCommitment = () => {
    const text = weeklyCommitmentDraft.trim();
    if (!text) return;
    saveCommitmentState([
      ...weeklyCommitments.filter((commitment) => commitment.weekOf !== weekOf),
      { id: `week-${weekOf}`, text, weekOf, status: "active" },
    ]);
    setWeeklyReviewNotice("This week’s commitment is set.");
  };
  const toggleWeeklyCommitment = () => {
    if (!weeklyCommitment) return;
    saveCommitmentState(weeklyCommitments.map((commitment) => commitment.id === weeklyCommitment.id
      ? { ...commitment, status: commitment.status === "completed" ? "active" : "completed", completedAt: commitment.status === "completed" ? undefined : Date.now() }
      : commitment));
  };
  const carryForward = () => {
    if (!previousPending) return;
    saveCommitmentState([
      ...weeklyCommitments.map((commitment) => commitment.id === previousPending.id ? { ...commitment, status: "carried" as const } : commitment),
      { id: `week-${weekOf}`, text: previousPending.text, weekOf, status: "active", carriedFrom: previousPending.weekOf },
    ]);
    setWeeklyCommitmentDraft(previousPending.text);
    setWeeklyReviewNotice("Last week’s commitment was carried forward.");
  };
  const closePreviousCommitment = () => {
    if (!previousPending) return;
    saveCommitmentState(weeklyCommitments.map((commitment) => commitment.id === previousPending.id ? { ...commitment, status: "closed" as const } : commitment));
    setWeeklyReviewNotice("Last week’s commitment was closed without completion.");
  };

  return (
    <RequireAuth>
      <TrackerShell
        icon="flag"
        title={displayGoalTitle(prefs)}
        subtitle={`${goalMeta.desc}. Log your daily metric, manage milestones, and watch the trajectory.`}
        badge={<SyncBadge status={status} />}
        actions={{
          primary: <a href="#daily-metric" className="inline-flex min-h-10 items-center border border-[#C8FF3D] bg-[#C8FF3D] px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[#071014]">Log today&apos;s progress</a>,
          secondary: <a href="#milestones" className="text-xs font-semibold text-primary hover:underline">Open milestones →</a>,
        }}
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
          <StoryPanel
            eyebrow="Roadmap chapter"
            title={milestones.find((m) => !m.done)?.title ?? "All milestones complete"}
            action={<a href="#milestones" className="dossier-back-link">Open roadmap</a>}
          >
            {goalPct === 100
              ? "The roadmap is complete. Capture the next chapter or keep the daily metric alive."
              : `Keep the next milestone visible and log ${metric.label.toLowerCase()} to move the trajectory.`}
          </StoryPanel>
          <SignalPanel
            label="Roadmap signal"
            value={`${goalPct}%`}
            detail={`${doneCount} of ${milestones.length} milestones complete`}
            progress={goalPct}
            tone="red"
          />
        </div>
        {previousPending ? (
          <div data-testid="weekly-review">
            <Card variant="dossier">
              <CardContent className="p-5">
                <p className="dossier-kicker">Weekly review / recovery</p>
                <h2 className="mt-1 font-display text-xl font-bold">Last week needs a reset</h2>
                <p className="mt-1 text-sm text-muted-foreground">“{previousPending.text}” was left open. Choose what the next week should carry.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={carryForward}>Carry forward</Button>
                  <Button variant="outline" onClick={closePreviousCommitment}>Close without completion</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
        {weeklyReviewNotice ? <p className="px-1 text-sm font-medium text-primary">{weeklyReviewNotice}</p> : null}
        <Card variant="dossier" id="weekly-commitment">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="dossier-kicker">This week / one commitment</p><h2 className="mt-1 font-display text-xl font-bold">{weeklyCommitment?.text ?? "Choose the one outcome worth protecting"}</h2><p className="mt-1 text-sm text-muted-foreground">A weekly commitment gives today&apos;s next action a useful direction.</p></div>
              {weeklyCommitment ? <Button variant={weeklyCommitment.status === "completed" ? "secondary" : "outline"} size="sm" onClick={toggleWeeklyCommitment}>{weeklyCommitment.status === "completed" ? "Completed this week" : "Mark complete"}</Button> : null}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row"><Input aria-label="Weekly commitment" value={weeklyCommitmentDraft} onChange={(event) => setWeeklyCommitmentDraft(event.target.value)} placeholder="e.g. Contact three hiring managers" onKeyDown={(event) => event.key === "Enter" && saveWeeklyCommitment()} /><Button onClick={saveWeeklyCommitment} disabled={!weeklyCommitmentDraft.trim()}>Save weekly commitment</Button></div>
          </CardContent>
        </Card>
        {/* ── Category selector ── */}
        <Card variant="dossier" id="milestones">
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
                  <TrackerIcon name={gc.iconName} className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-0.5 font-medium">{gc.label}</p>
                </button>
              ))}
            </div>
            {relocationMode && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="destination-country" className="text-xs font-medium text-muted-foreground">Destination country</label>
                  <div className="mt-1.5">
                    <select
                      id="destination-country"
                      className="flex h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={prefs.goalCountry ?? ""}
                      onChange={(event) => setPrefs({ ...prefs, goalCountry: event.target.value || undefined })}
                    >
                      <option value="">Choose a destination</option>
                      {RELOCATION_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Visa Pathway</p>
                  <div className="mt-1.5">
                    <Segmented
                      label="Visa pathway"
                      variant="soft"
                      options={[
                        { value: "EU Blue Card", label: "EU Blue Card" },
                        { value: "IT Specialist Fast-Track", label: "IT Specialist" },
                      ]}
                      value={safe.visa ?? "EU Blue Card"}
                      onChange={(visa) => setG({ ...safe, visa })}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Daily metric ── */}
        <Card variant="dossier" id="daily-metric">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                {metricLabelDraft === null ? (
                  <h2 className="font-display flex items-center gap-2 font-bold">
                    <span className="truncate">{metric.label}</span>
                    <button
                      onClick={() => {
                        setMetricLabelDraft(metric.label);
                        setMetricTargetDraft(String(metric.target));
                      }}
                      aria-label="Edit metric"
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </h2>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input className="h-9 w-56" value={metricLabelDraft} onChange={(e) => setMetricLabelDraft(e.target.value)} placeholder="Metric name" />
                    <Input className="h-9 w-20 tabular-nums" type="number" min={1} value={metricTargetDraft ?? ""} onChange={(e) => setMetricTargetDraft(e.target.value)} placeholder="Target" />
                    <Button size="sm" onClick={saveMetricEdits}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setMetricLabelDraft(null); setMetricTargetDraft(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Daily target: {metric.target} · hit streak: {streak} {streak === 1 ? "day" : "days"}
                </p>
              </div>
              <span className="font-display text-2xl font-bold tabular-nums text-primary">
                {todayValue}
                <span className="text-sm font-medium text-muted-foreground"> / {metric.target}</span>
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-[var(--color-dossier-lime)] transition-all"
                style={{ width: `${Math.min(100, metric.target ? (todayValue / metric.target) * 100 : 0)}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min={0}
                className="w-32 tabular-nums"
                placeholder="Add amount"
                value={todayLog}
                onChange={(e) => setTodayLog(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    logToday(Number(todayLog) || 0);
                    setTodayLog("");
                  }
                }}
              />
              <Button
                onClick={() => {
                  logToday(Number(todayLog) || 0);
                  setTodayLog("");
                }}
              >
                Log
              </Button>
              {[1, 3, 5].map((n) => (
                <Button key={n} variant="outline" size="sm" onClick={() => logToday(n)} className="tabular-nums">
                  +{n}
                </Button>
              ))}
              {todayValue > 0 && (
                <Button variant="ghost" size="sm" onClick={() => logToday(-todayValue)}>
                  Reset today
                </Button>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last 14 days</p>
              <MiniBars className="mt-2" data={last14} height={56} />
            </div>
          </CardContent>
        </Card>

        {/* ── Trajectory stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="7-day total" value={`${last7Total}`} />
          <Stat label="Daily avg (7d)" value={avg7.toFixed(1)} />
          <Stat label="Goal total" value={`${goalTotal}`} />
          <Stat label="Est. finish" value={etaDate ? etaDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"} accent />
        </div>
        {etaDays !== null && (
          <p className="-mt-1 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            At your current pace of {avg7.toFixed(1)}/day, you&apos;re on track in about {etaDays} days.
          </p>
        )}

        {/* ── Milestones with CRUD ── */}
        <Card variant="dossier">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="font-display font-bold">Milestones</h2>
              </div>
              <span className="text-sm font-semibold tabular-nums text-primary">
                {doneCount}/{milestones.length} · {goalPct}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-[var(--color-dossier-lime)] transition-all" style={{ width: `${goalPct}%` }} />
            </div>

            <ul className="mt-4 space-y-2">
              {milestones.map((m, i) => (
                <li
                  key={m.id}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all",
                    m.done ? "border-emerald-500/40 bg-emerald-500/10" : "border-border/60 hover:bg-accent",
                  )}
                >
                  <button
                    onClick={() => toggleMilestone(m.id)}
                    aria-label={m.done ? `Mark ${m.title} incomplete` : `Mark ${m.title} complete`}
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[11px] transition-all active:scale-90",
                      m.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground",
                    )}
                  >
                    {m.done ? <Check className="h-3 w-3" /> : ""}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn(m.done && "line-through opacity-70")}>{m.title}</p>
                    {m.done && m.doneAt && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        Completed {new Date(m.doneAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button onClick={() => moveMilestone(m.id, -1)} disabled={i === 0} aria-label="Move up" className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => moveMilestone(m.id, 1)} disabled={i === milestones.length - 1} aria-label="Move down" className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setMsDraft({ title: m.title });
                        setMsModal({ mode: "edit", id: m.id });
                      }}
                      aria-label="Edit milestone"
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteMilestone(m.id)} aria-label="Delete milestone" className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setMsDraft({ title: "" });
                setMsModal({ mode: "add" });
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add milestone
            </Button>
          </CardContent>
        </Card>

        {/* ── Outreach / reflection generator ── */}
        <Card variant="dossier">
          <CardContent className="p-5">
            <h2 className="font-display font-bold">{relocationMode ? "Outreach generator" : "Daily reflection"}</h2>
            <p className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm leading-relaxed">{snippet}</p>
            <div className="mt-3 flex justify-end">
              <Button variant="secondary" size="sm" onClick={copy}>
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-4 w-4" /> Copy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Milestone modal ── */}
        <Modal
          open={msModal !== null}
          onClose={() => setMsModal(null)}
          title={msModal?.mode === "edit" ? "Edit milestone" : "Add milestone"}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setMsModal(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={msModal?.mode === "edit" ? editMilestone : addMilestone} disabled={!msDraft.title.trim()}>
                {msModal?.mode === "edit" ? "Save" : "Add"}
              </Button>
            </div>
          }
        >
          <Input
            placeholder="Milestone — e.g. Complete 50 applications"
            value={msDraft.title}
            onChange={(e) => setMsDraft({ title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && (msModal?.mode === "edit" ? editMilestone() : addMilestone())}
            autoFocus
          />
        </Modal>
      </TrackerShell>
    </RequireAuth>
  );
}

const DEFAULT_LABELS: Record<GoalCategory, string> = {
  general: "Useful moves",
  relocation: "Applications & Outreach",
  career: "Target Applications",
  fitness: "Active Workout",
  weightloss: "Daily weigh-in",
  learning: "Deep Study",
  financial: "Savings & Investments",
  custom: "Daily Focus Metric",
};

const DEFAULT_TARGETS: Record<GoalCategory, number> = {
  general: 1,
  relocation: 3,
  career: 5,
  fitness: 45,
  weightloss: 1,
  learning: 60,
  financial: 20,
  custom: 3,
};
