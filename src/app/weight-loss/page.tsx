"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HeartPulse, Scale, Target, TrendingDown } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import TrackerShell from "@/components/trackers/TrackerShell";
import StoryPanel from "@/components/trackers/StoryPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { dateKey, kgToDisplay } from "@/lib/trackers";
import { DEFAULT_WEIGHT_LOSS_STATE, displayWeight, inputToKg, type WeightLossState, weightTrend } from "@/lib/health";
import { useUserPrefs } from "@/lib/user-prefs";

const SCALE = [1, 2, 3, 4, 5] as const;

export default function WeightLossPage() {
  const { prefs } = useUserPrefs();
  const { value, setValue } = useSyncedStorage<WeightLossState>("weight-loss", DEFAULT_WEIGHT_LOSS_STATE);
  const state = value ?? DEFAULT_WEIGHT_LOSS_STATE;
  const today = dateKey();
  const current = state.entries[today];
  const [weight, setWeight] = useState(current ? String(Math.round(kgToDisplay(current.weightKg, prefs.weightUnit) * 10) / 10) : "");
  const [note, setNote] = useState(current?.note ?? "");
  const [target, setTarget] = useState(state.targetKg ? String(Math.round(kgToDisplay(state.targetKg, prefs.weightUnit) * 10) / 10) : "");
  const trend = useMemo(() => weightTrend(state.entries), [state.entries]);
  const latest = useMemo(
    () => Object.entries(state.entries).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7),
    [state.entries],
  );
  const recovery = state.recoveryByDay[today];

  const save = () => {
    const nextWeight = Number(weight);
    if (!Number.isFinite(nextWeight) || nextWeight <= 0) return;
    const targetValue = Number(target);
    setValue({
      ...state,
      targetKg: Number.isFinite(targetValue) && targetValue > 0 ? inputToKg(targetValue, prefs.weightUnit) : state.targetKg,
      entries: {
        ...state.entries,
        [today]: { weightKg: inputToKg(nextWeight, prefs.weightUnit), note: note.trim() || undefined, updatedAt: Date.now() },
      },
    });
  };

  const saveRecovery = (field: "energy" | "sleep" | "soreness", score: (typeof SCALE)[number]) => {
    // Event handler: the timestamp records the user's explicit check-in.
    // eslint-disable-next-line react-hooks/purity
    const updatedAt = Date.now();
    const existing = recovery ?? { energy: 3, sleep: 3, soreness: 3, updatedAt };
    setValue({ ...state, recoveryByDay: { ...state.recoveryByDay, [today]: { ...existing, [field]: score, updatedAt } } });
  };

  const targetDelta = state.targetKg && current ? current.weightKg - state.targetKg : null;

  return (
    <RequireAuth>
      <TrackerShell icon="scale" title="Weight Loss" subtitle="One honest check-in, one sustainable direction." >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <StoryPanel eyebrow="Today’s health signal" title={current ? `Logged ${displayWeight(current.weightKg, prefs.weightUnit)}` : "Log today’s weight"} tone="signal">
            <p>{current ? "The trend is built from honest daily data, not a perfect day." : "A 15-second check-in keeps the next decision grounded."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/hub" className="dossier-back-link">Back to hub</Link>
              <Link href="/workout-tracking" className="dossier-back-link">Open workouts</Link>
            </div>
          </StoryPanel>
          <Card variant="dossier">
            <CardContent className="p-5">
              <p className="dossier-kicker">Trend / last 7 entries</p>
              <p className="mt-2 flex items-center gap-2 font-display text-3xl font-bold tabular-nums"><TrendingDown className="h-6 w-6 text-[#49E7FF]" />{trend == null ? "Start logging" : `${trend > 0 ? "+" : ""}${displayWeight(trend, prefs.weightUnit)}`}</p>
              <p className="mt-1 text-xs text-muted-foreground">{trend == null ? "Two entries reveal your first trend." : "Change from your first to latest recent entry."}</p>
            </CardContent>
          </Card>
        </div>

        <Card variant="dossier">
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="text-sm font-medium">Today&apos;s weight ({prefs.weightUnit})<Input aria-label="Today's weight" className="mt-1.5 tabular-nums" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder={prefs.weightUnit === "kg" ? "82.4" : "181.7"} /></label>
              <label className="text-sm font-medium">Target weight ({prefs.weightUnit})<Input className="mt-1.5 tabular-nums" inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Optional" /></label>
              <Button onClick={save} className="min-h-10"><Scale className="mr-2 h-4 w-4" />Save weigh-in</Button>
            </div>
            <label className="mt-4 block text-sm font-medium">Today&apos;s note<Input className="mt-1.5" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional context: sleep, meal, travel…" /></label>
            {targetDelta != null ? <p className="mt-3 text-sm text-muted-foreground"><Target className="mr-1 inline h-4 w-4 text-primary" />{Math.abs(targetDelta).toFixed(1)} kg {targetDelta > 0 ? "from target" : "below target"}</p> : null}
          </CardContent>
        </Card>

        <Card variant="dossier">
          <CardContent className="p-5">
            <div className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-[#ff554d]" /><h2 className="font-display font-bold">Recovery check-in</h2></div>
            <p className="mt-1 text-sm text-muted-foreground">Use a quick signal to make training and fasting more realistic.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {([ ["energy", "Energy"], ["sleep", "Sleep quality"], ["soreness", "Soreness"] ] as const).map(([field, label]) => (
                <div key={field}><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><div className="mt-2 flex gap-1">{SCALE.map((score) => <button key={score} type="button" aria-label={`${label} ${score} of 5`} onClick={() => saveRecovery(field, score)} className={`h-9 w-9 rounded-full border text-sm font-bold ${recovery?.[field] === score ? "border-[#c8ff3d] bg-[#c8ff3d] text-[#071014]" : "border-border/70 hover:border-primary"}`}>{score}</button>)}</div></div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="dossier">
          <CardContent className="p-5"><h2 className="font-display font-bold">Recent weigh-ins</h2>{latest.length ? <ul className="mt-3 divide-y divide-border/60">{latest.map(([day, entry]) => <li key={day} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span>{day}{entry.note ? <span className="ml-2 text-muted-foreground">· {entry.note}</span> : null}</span><strong className="tabular-nums">{displayWeight(entry.weightKg, prefs.weightUnit)}</strong></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Your first weigh-in will appear here.</p>}</CardContent>
        </Card>
      </TrackerShell>
    </RequireAuth>
  );
}
