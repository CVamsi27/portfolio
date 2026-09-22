"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, HeartPulse, Scale, Sparkles, Target, TrendingDown } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import TrackerShell from "@/components/trackers/TrackerShell";
import StoryPanel from "@/components/trackers/StoryPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { dateKey, kgToDisplay, type WeightUnit } from "@/lib/trackers";
import { DEFAULT_WEIGHT_LOSS_STATE, displayWeight, inputToKg, type WeightLossState, weightTrend } from "@/lib/health";
import { useUserPrefs } from "@/lib/user-prefs";
import { cn } from "@/lib/utils";

const SCALE = [1, 2, 3, 4, 5] as const;

/** SVG polyline sparkline for up to 14 daily weight readings. */
function WeightSparkline({ data, targetKg, unit }: { data: number[]; targetKg?: number; unit: WeightUnit }) {
  if (data.length < 2) return null;
  const W = 400, H = 64, pad = 6;
  const min = Math.min(...data, ...(targetKg ? [targetKg] : [])) - 0.5;
  const max = Math.max(...data) + 0.5;
  const range = max - min || 1;
  const toX = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2);
  const toY = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);
  const points = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const last = data[data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" aria-label="Weight trend sparkline" role="img">
      {targetKg && (
        <line
          x1={pad} y1={toY(targetKg).toFixed(1)}
          x2={W - pad} y2={toY(targetKg).toFixed(1)}
          stroke="#c8ff3d" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"
        />
      )}
      <polyline points={points} fill="none" stroke="#32b8c8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dot on latest reading */}
      <circle cx={toX(data.length - 1).toFixed(1)} cy={toY(last).toFixed(1)} r="3.5" fill="#32b8c8" />
      <text x={toX(data.length - 1) + 5} y={toY(last) - 4} fontSize="10" fill="#32b8c8" fontFamily="monospace">
        {displayWeight(last, unit)}
      </text>
    </svg>
  );
}


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

  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dateKey(d);
  }, []);
  const yesterdayEntry = state.entries[yesterdayKey];

  const sevenDayAvg = useMemo(() => {
    const sorted = Object.entries(state.entries).sort(([a], [b]) => b.localeCompare(a));
    if (sorted.length < 2) return null;
    const recent = sorted.slice(0, 7);
    const sum = recent.reduce((acc, [, entry]) => acc + entry.weightKg, 0);
    return sum / recent.length;
  }, [state.entries]);

  const prevSevenDayAvg = useMemo(() => {
    const sorted = Object.entries(state.entries).sort(([a], [b]) => b.localeCompare(a));
    if (sorted.length < 8) return null;
    const previous = sorted.slice(7, 14);
    const sum = previous.reduce((acc, [, entry]) => acc + entry.weightKg, 0);
    return sum / previous.length;
  }, [state.entries]);

  const smaDelta = sevenDayAvg !== null && prevSevenDayAvg !== null ? sevenDayAvg - prevSevenDayAvg : null;

  const readiness = useMemo(() => {
    if (!recovery) return null;
    const score = Math.round(((recovery.energy + recovery.sleep + (6 - recovery.soreness)) / 15) * 100);
    if (score >= 80) {
      return {
        score,
        label: "Optimal Readiness",
        detail: "High nervous system & muscular recovery. Primed for high volume or intensity.",
        tone: "lime" as const,
      };
    }
    if (score >= 60) {
      return {
        score,
        label: "Restored",
        detail: "Solid recovery base. Ready for your scheduled workout.",
        tone: "cyan" as const,
      };
    }
    if (score >= 40) {
      return {
        score,
        label: "Moderate Capacity",
        detail: "Mild fatigue detected. Consider technical focus, active recovery, or lighter load.",
        tone: "amber" as const,
      };
    }
    return {
      score,
      label: "Fatigued / Deload",
      detail: "Elevated soreness or low sleep. Prioritize nutrition, hydration, and restful sleep.",
      tone: "rose" as const,
    };
  }, [recovery]);

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

  // 14-day entries for sparkline
  const sparklineData = useMemo(() => {
    const sorted = Object.entries(state.entries).sort(([a], [b]) => a.localeCompare(b));
    return sorted.slice(-14).map(([, e]) => e.weightKg);
  }, [state.entries]);

  const targetDelta = state.targetKg && current ? current.weightKg - state.targetKg : null;

  // Weigh-in pending chip: after 8am, no entry today
  const pendingWeighIn = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 8 && !current;
  }, [current]);

  return (
    <RequireAuth>
      <TrackerShell icon="scale" title="Weight Loss" subtitle="One honest check-in, one sustainable direction." >
        {/* Weigh-in pending chip */}
        {pendingWeighIn && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#c8ff3d]/30 bg-[#c8ff3d]/8 px-3 py-2">
            <p className="text-xs font-semibold text-[#c8ff3d]">
              Weigh-in pending — one honest number keeps the trend clean
            </p>
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#c8ff3d]" />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <StoryPanel eyebrow="Today's health signal" title={current ? `Logged ${displayWeight(current.weightKg, prefs.weightUnit)}` : "Log today's weight"} tone="signal">
            <p>{current ? "The trend is built from honest daily data, not a perfect day." : "A 15-second check-in keeps the next decision grounded."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/hub" className="dossier-back-link">Back to hub</Link>
              <Link href="/workout-tracking" className="dossier-back-link">Open workouts</Link>
            </div>
          </StoryPanel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Card variant="dossier">
              <CardContent className="p-5">
                <p className="dossier-kicker">Trend / last 7 entries</p>
                <p className="mt-2 flex items-center gap-2 font-display text-3xl font-bold tabular-nums">
                  <TrendingDown className="h-6 w-6 text-[#49E7FF]" />
                  {trend == null ? "Start logging" : `${trend > 0 ? "+" : ""}${displayWeight(trend, prefs.weightUnit)}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{trend == null ? "Two entries reveal your first trend." : "Change from your first to latest recent entry."}</p>
              </CardContent>
            </Card>
            <Card variant="dossier">
              <CardContent className="p-5">
                <p className="dossier-kicker">7-Day Moving Average</p>
                <p className="mt-2 flex items-center gap-2 font-display text-3xl font-bold tabular-nums">
                  <Activity className="h-6 w-6 text-[#C8FF3D]" />
                  {sevenDayAvg == null ? "—" : displayWeight(sevenDayAvg, prefs.weightUnit)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {smaDelta == null ? "Smoothes daily water weight fluctuations." : `${smaDelta > 0 ? "+" : ""}${displayWeight(smaDelta, prefs.weightUnit)} vs previous week`}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sparkline + target timeline */}
        {sparklineData.length >= 2 && (
          <Card variant="dossier">
            <CardContent className="p-5">
              <p className="dossier-kicker">14-day weight trajectory</p>
              <WeightSparkline data={sparklineData} targetKg={state.targetKg} unit={prefs.weightUnit} />
              {state.targetKg && current && targetDelta != null && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress to target</span>
                    <span className="font-mono font-bold">{Math.abs(targetDelta).toFixed(1)} {prefs.weightUnit} {targetDelta > 0 ? "remaining" : "past target"}</span>
                  </div>
                  {(() => {
                    const startKg = sparklineData[0];
                    const range = startKg - state.targetKg;
                    const done = range !== 0 ? Math.max(0, Math.min(100, ((startKg - current.weightKg) / range) * 100)) : 100;
                    return (
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-[#c8ff3d] transition-all" style={{ width: `${done}%` }} />
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card variant="dossier">
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="text-sm font-medium">
                Today&apos;s weight ({prefs.weightUnit})
                <Input aria-label="Today's weight" className="mt-1.5 tabular-nums" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder={prefs.weightUnit === "kg" ? "82.4" : "181.7"} />
                {yesterdayEntry && !weight ? (
                  <button
                    type="button"
                    onClick={() => setWeight(String(Math.round(kgToDisplay(yesterdayEntry.weightKg, prefs.weightUnit) * 10) / 10))}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Use yesterday&apos;s weight ({displayWeight(yesterdayEntry.weightKg, prefs.weightUnit)})
                  </button>
                ) : null}
              </label>
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

            {readiness ? (
              <div className="mt-4 rounded-xl border border-border/70 bg-card/60 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#C8FF3D]" />
                    <span className="font-display text-sm font-bold">{readiness.label}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-primary">{readiness.score}% score</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all",
                      readiness.tone === "lime" && "bg-[#C8FF3D]",
                      readiness.tone === "cyan" && "bg-[#49E7FF]",
                      readiness.tone === "amber" && "bg-amber-400",
                      readiness.tone === "rose" && "bg-[#FF554D]",
                    )}
                    style={{ width: `${readiness.score}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{readiness.detail}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border/70 px-3.5 py-2.5 text-xs text-muted-foreground">
                Rate your energy, sleep, and soreness below to calculate today&apos;s recovery score.
              </div>
            )}

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
