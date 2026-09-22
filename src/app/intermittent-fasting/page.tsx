"use client";

import { useEffect, useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import Stat from "@/components/trackers/Stat";
import Segmented from "@/components/trackers/Segmented";
import Modal from "@/components/trackers/Modal";
import EmptyState from "@/components/trackers/EmptyState";
import MiniBars from "@/components/trackers/MiniBars";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SyncBadge } from "@/components/auth/AuthButton";
import {
  type FastHistoryEntry,
  type FastState,
  avgFastHours,
  dateKey,
  fastHoursByDay,
  fastingStreak,
  formatClock,
  formatDateShort,
  longestFastHours,
  totalFastHours,
} from "@/lib/trackers";
import { useFasting, useFastingHistory, useMigrateFasting, useNow } from "@/lib/tracker-store";
import {
  calculateMealWindow,
  mealWindowTimestamps,
  pruneExpiredMealWindows,
  validateMealWindow,
} from "@/lib/fasting-window";
import { CalendarClock, Check, Clock3, Pencil, Save, Trash2 } from "lucide-react";
import SignalPanel from "@/components/trackers/SignalPanel";
import StoryPanel from "@/components/trackers/StoryPanel";
import FastingStages from "@/components/trackers/FastingStages";
import HydrationTracker from "@/components/trackers/HydrationTracker";

type MealDraft = { firstMealTime: string; lastMealTime: string };
type AutoClearHours = 24 | 168 | 720;

const AUTO_CLEAR_OPTIONS = [
  { value: "24" as const, label: "24 hours" },
  { value: "168" as const, label: "7 days" },
  { value: "720" as const, label: "30 days" },
];

export default function FastingPage() {
  useMigrateFasting();
  const now = useNow(10_000);
  const { value: state, setValue: setState, status } = useFasting();
  const { value: history, setValue: setHistory } = useFastingHistory();
  const today = dateKey();

  const safeState: FastState = {
    protocolId: state?.protocolId ?? "16-8",
    phase: state?.phase === "eating" ? "eating" : "fasting",
    startedAt: state?.startedAt ?? null,
    mealRoutine: state?.mealRoutine,
    autoClearHours: state?.autoClearHours === 24 || state?.autoClearHours === 168 || state?.autoClearHours === 720 ? state.autoClearHours : 720,
  };
  const rawHistory = useMemo(() => history ?? [], [history]);
  const safeHistory = useMemo(
    () => pruneExpiredMealWindows(rawHistory, safeState.autoClearHours as AutoClearHours),
    [rawHistory, safeState.autoClearHours],
  );
  const todayEntry = safeHistory.find((entry) => entry.source === "meal-window" && (entry.mealDate ?? dateKey(new Date(entry.end))) === today);
  const [draft, setDraft] = useState<MealDraft>({ firstMealTime: "", lastMealTime: "" });
  const [error, setError] = useState("");
  const [pastOpen, setPastOpen] = useState(false);
  const [pastDate, setPastDate] = useState(today);
  const [pastNote, setPastNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (safeHistory.length !== rawHistory.length) setHistory(safeHistory);
  }, [rawHistory.length, safeHistory, setHistory]);

  const weekBars = useMemo(() => fastHoursByDay(safeHistory, 7), [safeHistory]);
  const streak = fastingStreak(safeHistory);
  const avg7 = avgFastHours(safeHistory, 7);
  const avg30 = avgFastHours(safeHistory, 30);
  const longest = longestFastHours(safeHistory);
  const total = totalFastHours(safeHistory);
  const progress = todayEntry ? Math.min(100, (todayEntry.end - todayEntry.start) / 86_400_000 * 100) : 0;
  const effectiveDraft = draft.firstMealTime || draft.lastMealTime ? draft : (safeState.mealRoutine ?? draft);
  const calculated = effectiveDraft.firstMealTime && effectiveDraft.lastMealTime && !validateMealWindow(effectiveDraft.firstMealTime, effectiveDraft.lastMealTime)
    ? calculateMealWindow(effectiveDraft.firstMealTime, effectiveDraft.lastMealTime)
    : null;

  const elapsedHours = todayEntry
    ? (todayEntry.end - todayEntry.start) / 3_600_000
    : safeState.startedAt !== null && safeState.phase === "fasting"
      ? Math.max(0, (now - safeState.startedAt) / 3_600_000)
      : calculated
        ? calculated.fastHours
        : 16;

  const saveWindow = (date: string, note?: string) => {
    const validation = validateMealWindow(effectiveDraft.firstMealTime, effectiveDraft.lastMealTime);
    if (validation) {
      setError(validation);
      return;
    }
    const { start, end } = mealWindowTimestamps(date, effectiveDraft.firstMealTime, effectiveDraft.lastMealTime);
    const entry: FastHistoryEntry = {
      id: `meal_${end.toString(36)}`,
      start,
      end,
      protocolId: safeState.protocolId,
      source: "meal-window",
      firstMealTime: effectiveDraft.firstMealTime,
      lastMealTime: effectiveDraft.lastMealTime,
      mealDate: date,
      createdAt: Date.now(),
      note: note?.trim() || undefined,
    };
    setHistory([...safeHistory.filter((item) => !(item.source === "meal-window" && (item.mealDate ?? dateKey(new Date(item.end))) === date)), entry]);
    setState({
      ...safeState,
      mealRoutine: { ...effectiveDraft },
    });
    setError("");
    setSaved(true);
    setPastOpen(false);
    window.setTimeout(() => setSaved(false), 1500);
  };

  const updateAutoClear = (value: string) => {
    const autoClearHours = Number(value) as AutoClearHours;
    setState({ ...safeState, autoClearHours });
  };

  const deleteEntry = (id: string) => setHistory(safeHistory.filter((entry) => entry.id !== id));
  const updateEntry = (id: string, patch: Partial<FastHistoryEntry>) =>
    setHistory(safeHistory.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));

  return (
    <RequireAuth>
      <TrackerShell
        icon="timer"
        title="Intermittent Fasting"
        subtitle="Add the time of your first and last meal. NOVA calculates the fasting window from what you actually logged."
        badge={<SyncBadge status={status} />}
        actions={{
          primary: <a href="#meal-window" className="inline-flex min-h-10 items-center border border-[#C8FF3D] bg-[#C8FF3D] px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[#071014]">{safeState.mealRoutine ? "Save today's window" : "Save routine and use for today"}</a>,
          secondary: <a href="#fasting-history" className="text-xs font-semibold text-primary hover:underline">Open history →</a>,
        }}
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
          <StoryPanel
            eyebrow="Meal window chapter"
            title={todayEntry ? "Today’s window is on record" : safeState.mealRoutine ? "Log today’s window" : "Set your daily routine"}
            action={<a href="#meal-window" className="dossier-back-link">Open meal window</a>}
          >
            {todayEntry
              ? `${((todayEntry.end - todayEntry.start) / 3_600_000).toFixed(1)} hours fasting from ${todayEntry.firstMealTime} to ${todayEntry.lastMealTime}.`
              : safeState.mealRoutine
                ? "Your routine is ready as a starting point. Adjust today’s times whenever the day changes."
                : "Add your usual first and last meal times once. We will use them to prefill each new day until you change them."}
          </StoryPanel>
          <SignalPanel
            label="Today’s signal"
            value={todayEntry ? `${((todayEntry.end - todayEntry.start) / 3_600_000).toFixed(1)}h` : "Ready"}
            detail={`${streak}-day fasting streak · ${safeHistory.length} windows logged`}
            progress={progress}
            tone="violet"
          />
        </div>

        <Card variant="dossier" id="meal-window" className="overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-utility text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  {safeState.mealRoutine ? "Daily routine" : "First setup"}
                </p>
                <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.04em]">
                  {todayEntry ? "Edit today’s meal window" : safeState.mealRoutine ? "What time do you usually eat?" : "Set your daily routine"}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {safeState.mealRoutine ? "The routine fills the form; save a different time for today whenever you need to." : "Start with your usual rhythm. Your first save also creates today’s log."}
                </p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-md">
                <div>
                  <label htmlFor="first-meal-time" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First meal</label>
                  <Input id="first-meal-time" aria-label="First meal time" className="mt-1.5 h-11" type="time" value={effectiveDraft.firstMealTime} onChange={(event) => setDraft({ ...effectiveDraft, firstMealTime: event.target.value })} />
                </div>
                <div>
                  <label htmlFor="last-meal-time" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last meal</label>
                  <Input id="last-meal-time" aria-label="Last meal time" className="mt-1.5 h-11" type="time" value={effectiveDraft.lastMealTime} onChange={(event) => setDraft({ ...effectiveDraft, lastMealTime: event.target.value })} />
                </div>
              </div>
            </div>
            {calculated ? (
              <div className="mt-5 grid gap-2 border-y border-border/60 py-4 sm:grid-cols-3">
                <Stat label="Fasting" value={`${calculated.fastHours.toFixed(1)} hours`} accent />
                <Stat label="Eating window" value={`${calculated.eatingHours.toFixed(1)} hours`} />
                <Stat label="Pattern" value={calculated.overnight ? "Overnight" : "Same day"} />
              </div>
            ) : null}
            {error ? <p role="alert" className="mt-4 text-sm font-medium text-red-500">{error}</p> : null}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={() => saveWindow(today)} className="min-h-11">
                {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                {saved ? "Saved" : safeState.mealRoutine ? "Save today’s window" : "Save routine and use for today"}
              </Button>
              <Button variant="outline" onClick={() => setPastOpen(true)} className="min-h-11">
                <CalendarClock className="mr-2 h-4 w-4" /> Log another day
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:grid-cols-2">
          <FastingStages elapsedHours={elapsedHours} />
          <HydrationTracker />
        </div>

        <Card variant="dossier" id="fasting-history">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display font-bold">Auto-clear saved windows</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Choose how long meal-window records stay in local history.</p>
              </div>
              <Segmented
                label="Auto-clear saved windows"
                options={AUTO_CLEAR_OPTIONS}
                value={String(safeState.autoClearHours) as "24" | "168" | "720"}
                onChange={updateAutoClear}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card variant="dossier">
            <CardContent className="p-5">
              <h2 className="font-display font-bold">Today&apos;s meal window</h2>
              <MealWindowTimeline entry={todayEntry} now={now} />
              <h3 className="mt-4 font-display text-sm font-bold text-muted-foreground">Fasting hours · 7 days</h3>
              <MiniBars className="mt-2" data={weekBars} unit="h" />
            </CardContent>
          </Card>
          <Card variant="dossier">
            <CardContent className="grid grid-cols-2 gap-2 p-5">
              <Stat label="Avg window (7d)" value={`${avg7.toFixed(1)} h`} />
              <Stat label="Avg window (30d)" value={`${avg30.toFixed(1)} h`} />
              <Stat label="Longest" value={`${longest.toFixed(1)} h`} />
              <Stat label="Total fasting" value={`${Math.round(total)} h`} accent />
            </CardContent>
          </Card>
        </div>

        <Card variant="dossier">
          <CardContent className="p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display font-bold">History</h2>
              <span className="text-xs text-muted-foreground">{safeHistory.length} windows logged</span>
            </div>
            {safeHistory.length === 0 ? (
              <div className="mt-3">
                <EmptyState icon={Clock3} title="No meal windows logged yet" hint="Save today’s first and last meal times to start the history." />
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {[...safeHistory].reverse().slice(0, 14).map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} onDelete={deleteEntry} onUpdate={updateEntry} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Modal
          open={pastOpen}
          onClose={() => setPastOpen(false)}
          title="Log another meal window"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPastOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => saveWindow(pastDate, pastNote)}>Save window</Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div>
              <label htmlFor="past-window-date" className="text-sm font-medium">Date</label>
              <Input id="past-window-date" className="mt-1.5" type="date" value={pastDate} onChange={(event) => setPastDate(event.target.value)} />
            </div>
            <Input aria-label="Note" placeholder="Note (optional)" value={pastNote} onChange={(event) => setPastNote(event.target.value)} />
            <p className="text-xs text-muted-foreground">The first and last meal fields above are used for this date.</p>
          </div>
        </Modal>
      </TrackerShell>
    </RequireAuth>
  );
}

/** 24-hour horizontal band visualizing the eating window vs. fasting zone. */
function MealWindowTimeline({ entry, now }: { entry: ReturnType<typeof Array.prototype.find>; now: number }) {
  const W = 400, H = 48, pad = 4;
  const toX = (frac: number) => pad + frac * (W - pad * 2);
  const nowFrac = (new Date(now).getHours() * 60 + new Date(now).getMinutes()) / 1440;
  const nowX = toX(nowFrac);

  if (!entry || !entry.firstMealTime || !entry.lastMealTime) {
    return (
      <div className="mt-3 flex h-12 items-center justify-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground">
        Log a meal window to see the timeline
      </div>
    );
  }

  const toFrac = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return ((h ?? 0) * 60 + (m ?? 0)) / 1440;
  };
  const startFrac = toFrac(entry.firstMealTime);
  const endFrac = toFrac(entry.lastMealTime);
  const eatStart = toX(Math.min(startFrac, endFrac));
  const eatEnd = toX(Math.max(startFrac, endFrac));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" aria-label="Meal window timeline" role="img">
      {/* Full-day fasting background */}
      <rect x={pad} y={H / 2 - 8} width={W - pad * 2} height={16} rx={4} fill="#102027" />
      {/* Eating window */}
      <rect x={eatStart} y={H / 2 - 8} width={Math.max(0, eatEnd - eatStart)} height={16} rx={2} fill="rgba(200,255,61,0.22)" />
      <rect x={eatStart} y={H / 2 - 8} width={Math.max(0, eatEnd - eatStart)} height={16} rx={2} fill="none" stroke="#c8ff3d" strokeWidth="1" opacity="0.6" />
      {/* Labels */}
      <text x={eatStart + 4} y={H / 2 - 10} fontSize="9" fill="#c8ff3d" fontFamily="monospace">{entry.firstMealTime}</text>
      <text x={eatEnd - 4} y={H / 2 - 10} fontSize="9" fill="#c8ff3d" fontFamily="monospace" textAnchor="end">{entry.lastMealTime}</text>
      {/* 0h / 12h axis labels */}
      <text x={pad} y={H - 2} fontSize="8" fill="var(--color-muted-foreground)" fontFamily="monospace">0h</text>
      <text x={W / 2} y={H - 2} fontSize="8" fill="var(--color-muted-foreground)" fontFamily="monospace" textAnchor="middle">12h</text>
      <text x={W - pad} y={H - 2} fontSize="8" fill="var(--color-muted-foreground)" fontFamily="monospace" textAnchor="end">24h</text>
      {/* Current time cursor */}
      <line x1={nowX} y1={H / 2 - 12} x2={nowX} y2={H / 2 + 12} stroke="#49e7ff" strokeWidth="1.5" />
    </svg>
  );
}

function HistoryRow({
  entry,
  onDelete,
  onUpdate,
}: {
  entry: FastHistoryEntry;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<FastHistoryEntry>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const hours = (entry.end - entry.start) / 3_600_000;
  if (editing) {
    const dateOf = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);
    const timeOf = (timestamp: number) => new Date(timestamp).toTimeString().slice(0, 5);
    return (
      <li className="rounded-xl border border-primary/40 bg-primary/5 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Input aria-label="Edit first meal date" type="date" value={dateOf(entry.start)} onChange={(event) => onUpdate(entry.id, { start: Date.parse(`${event.target.value}T${timeOf(entry.start)}`) })} />
          <Input aria-label="Edit first meal time" type="time" value={entry.firstMealTime ?? timeOf(entry.start)} onChange={(event) => onUpdate(entry.id, { firstMealTime: event.target.value, start: Date.parse(`${dateOf(entry.start)}T${event.target.value}`) })} />
          <Input aria-label="Edit last meal date" type="date" value={dateOf(entry.end)} onChange={(event) => onUpdate(entry.id, { end: Date.parse(`${event.target.value}T${timeOf(entry.end)}`) })} />
          <Input aria-label="Edit last meal time" type="time" value={entry.lastMealTime ?? timeOf(entry.end)} onChange={(event) => onUpdate(entry.id, { lastMealTime: event.target.value, end: Date.parse(`${dateOf(entry.end)}T${event.target.value}`) })} />
        </div>
        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Done</Button>
        </div>
      </li>
    );
  }
  return (
    <li className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3 text-sm transition-colors hover:border-primary/30">
      <div className="min-w-0">
        <p className="font-medium">{formatDateShort(entry.start)} · {entry.firstMealTime ?? formatClock(entry.start)} → {entry.lastMealTime ?? formatClock(entry.end)}</p>
        <p className="text-xs text-muted-foreground">{hours.toFixed(1)}h fasting{entry.note ? ` · ${entry.note}` : entry.source !== "meal-window" ? " · legacy timer record" : ""}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={() => setEditing(true)} aria-label="Edit meal window" className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={() => onDelete(entry.id)} aria-label="Delete meal window" className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </li>
  );
}
