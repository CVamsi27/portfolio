"use client";

import { useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import Stat from "@/components/trackers/Stat";
import Segmented from "@/components/trackers/Segmented";
import Modal from "@/components/trackers/Modal";
import EmptyState from "@/components/trackers/EmptyState";
import MiniBars from "@/components/trackers/MiniBars";
import { SimpleRing } from "@/components/trackers/Ring";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { SyncBadge } from "@/components/auth/AuthButton";
import { useUserPrefs } from "@/lib/user-prefs";
import {
  type FastHistoryEntry,
  type FastPhase,
  FASTING_PROTOCOLS,
  computeFastingState,
  fastHoursByDay,
  fastingStreak,
  avgFastHours,
  longestFastHours,
  totalFastHours,
  formatClock,
  formatDateShort,
  formatHMS,
  protocolById,
} from "@/lib/trackers";
import { useFasting, useFastingHistory, useMigrateFasting, useNow } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";
import { CalendarClock, Flame, Pencil, Play, Square, Timer, Trash2 } from "lucide-react";

type ManualDraft = { date: string; startTime: string; endTime: string; note: string };

export default function FastingPage() {
  useMigrateFasting();
  const { prefs } = useUserPrefs();
  const { value: st, setValue: setSt, status } = useFasting();
  const { value: history, setValue: setHistory } = useFastingHistory();
  const now = useNow(1000);

  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState<ManualDraft>(() => {
    const d = new Date();
    return {
      date: d.toISOString().slice(0, 10),
      startTime: "20:00",
      endTime: "12:00",
      note: "",
    };
  });

  const safe: FastStateShim = {
    protocolId: st?.protocolId ?? "16-8",
    phase: (st?.phase === "eating" ? "eating" : "fasting") as FastPhase,
    startedAt: st?.startedAt ?? null,
  };
  const safeHistory = useMemo(() => history ?? [], [history]);
  const protocol = protocolById(safe.protocolId);
  const derived = computeFastingState(safe, now, protocol.fastHours);
  const eating = safe.phase === "eating";

  const weekBars = useMemo(() => fastHoursByDay(safeHistory, 7), [safeHistory]);
  const streak = fastingStreak(safeHistory);
  const avg7 = avgFastHours(safeHistory, 7, now);
  const avg30 = avgFastHours(safeHistory, 30, now);
  const longest = longestFastHours(safeHistory);
  const total = totalFastHours(safeHistory);

  const startFast = () =>
    setSt({
      protocolId: safe.protocolId,
      phase: "fasting",
      // Event handler — stamping the wall clock is the intent.
      // eslint-disable-next-line react-hooks/purity
      startedAt: Date.now(),
    });
  const startEating = () =>
    setSt({
      protocolId: safe.protocolId,
      phase: "eating",
      // eslint-disable-next-line react-hooks/purity
      startedAt: Date.now(),
    });

  const endPhase = () => {
    if (safe.startedAt === null) return;
    // eslint-disable-next-line react-hooks/purity
    const end = Date.now();
    if (!eating) {
      const hours = (end - safe.startedAt) / 3600_000;
      if (hours >= 0.25) {
        setHistory([
          ...safeHistory,
          {
            id: `f_${end.toString(36)}`,
            start: safe.startedAt,
            end,
            protocolId: safe.protocolId,
            source: "timer",
          },
        ]);
      }
    }
    setSt({ protocolId: safe.protocolId, phase: eating ? "fasting" : "eating", startedAt: null });
  };

  const setProtocol = (hours: string) => {
    const p = FASTING_PROTOCOLS.find((x) => x.fastHours === Number(hours));
    if (p) setSt({ ...safe, protocolId: p.id });
  };

  const saveManual = () => {
    const startTs = Date.parse(`${manual.date}T${manual.startTime}`);
    let endTs = Date.parse(`${manual.date}T${manual.endTime}`);
    if (Number.isNaN(startTs) || Number.isNaN(endTs)) return;
    if (endTs <= startTs) endTs += 86_400_000; // overnight fast
    const hours = (endTs - startTs) / 3600_000;
    if (hours < 0.25 || hours > 72) return;
    setHistory([
      ...safeHistory,
      {
        id: `fm_${endTs.toString(36)}`,
        start: startTs,
        end: endTs,
        protocolId: safe.protocolId,
        source: "manual",
        note: manual.note.trim() || undefined,
      },
    ]);
    setManualOpen(false);
  };

  const deleteEntry = (id: string) => setHistory(safeHistory.filter((h) => h.id !== id));
  const updateEntry = (id: string, patch: Partial<FastHistoryEntry>) =>
    setHistory(safeHistory.map((h) => (h.id === id ? { ...h, ...patch } : h)));

  const stageColor = derived.pct >= 85 ? "#8b5cf6" : derived.pct >= 55 ? "#3b82f6" : derived.pct >= 25 ? "#06b6d4" : "#f59e0b";

  return (
    <RequireAuth>
      <TrackerShell
        icon="timer"
        title="Intermittent Fasting"
        subtitle="Timestamp-based fasting engine — accurate across suspended tabs. Track your window, log past fasts, and watch the streak build."
        badge={<SyncBadge status={status} />}
      >
        {/* ── Timer hero ── */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
              <div className="text-center sm:text-left">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Target Plan</p>
                <p className="mt-1 text-sm font-medium">
                  {protocol.fastHours}h Fast / {24 - protocol.fastHours}h Eat
                </p>
                <p className="mt-1 max-w-[180px] text-xs text-muted-foreground">{protocol.blurb}</p>
                {eating && derived.nextFastAt && (
                  <p className="mt-2 rounded-lg bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground">
                    Next fast: {formatClock(derived.nextFastAt)}
                  </p>
                )}
              </div>

              <SimpleRing pct={derived.pct} size={220} thickness={12} from={eating ? "#10b981" : stageColor} to={eating ? "#34d399" : "#8b5cf6"}>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {eating ? "Eating window" : "Fasting"}
                </span>
                <span className="font-display text-3xl font-bold tabular-nums">
                  {formatHMS(derived.elapsedMs / 1000)}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {derived.running
                    ? `${Math.floor(derived.remainingMs / 3600000)}h ${Math.floor((derived.remainingMs % 3600000) / 60000)}m left`
                    : "Not started"}
                </span>
              </SimpleRing>

              <div className="text-center sm:text-right">
                {eating ? (
                  <>
                    <p className="text-sm font-semibold text-emerald-500">Eating Window</p>
                    <p className="mt-1 max-w-[190px] text-xs leading-relaxed text-muted-foreground">
                      Refuel with protein and whole foods. The clock resets when your next fast begins.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold" style={{ color: stageColor }}>
                      {derived.stage?.title ?? "Ready"}
                    </p>
                    <p className="mt-1 max-w-[190px] text-xs leading-relaxed text-muted-foreground">
                      {derived.stage?.desc ?? "Start the timer to begin your fasting window."}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* stats */}
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Elapsed" value={`${(derived.elapsedMs / 3600000).toFixed(1)} h`} />
              <Stat label="Remaining" value={`${(Math.min(derived.remainingMs, derived.targetMs) / 3600000).toFixed(1)} h`} />
              <Stat label="Window" value={`${protocol.fastHours}:${24 - protocol.fastHours}`} accent />
              <Stat label="Streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} />
            </div>

            {/* stage rail */}
            {!eating && (
              <div className="mt-4">
                <div className="flex gap-1.5">
                  {[0, 25, 55, 85].map((t) => (
                    <div
                      key={t}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors duration-500",
                        derived.pct >= t ? "bg-gradient-to-r from-primary to-fuchsia-500" : "bg-muted",
                      )}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span className="flex-1">Sugar drop</span>
                  <span className="flex-1 text-center">Fat burn</span>
                  <span className="flex-1 text-center">Ketosis</span>
                  <span className="flex-1 text-right">Autophagy</span>
                </div>
              </div>
            )}

            {/* controls */}
            <div className="mt-5 space-y-3">
              <Segmented
                label="Fasting protocol"
                options={[14, 16, 18, 20].map((h) => ({
                  value: `${h}`, 
                  label: `${h}:${24 - h}`,
                }))}
                value={`${protocol.fastHours}`}
                onChange={setProtocol}
              />
              <div className="flex flex-wrap gap-2">
                {safe.startedAt === null ? (
                  <Button onClick={eating ? startFast : startEating} className="flex-1">
                    <Play className="mr-1.5 h-4 w-4" /> Start {eating ? "Eating Window" : "Fast"}
                  </Button>
                ) : (
                  <Button onClick={endPhase} className="flex-1" variant="secondary">
                    <Square className="mr-1.5 h-4 w-4" /> End & Log {eating ? "Window" : "Fast"}
                  </Button>
                )}
                <Button onClick={() => setManualOpen(true)} variant="outline">
                  <CalendarClock className="mr-1.5 h-4 w-4" /> Log past fast
                </Button>
              </div>
              {derived.complete && !eating && (
                <p className="text-center text-sm font-semibold text-emerald-500">
                  🎉 Window complete — nice work. End the fast to log it.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Analytics ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-display font-bold">Fast hours · 7 days</h2>
              <MiniBars className="mt-3" data={weekBars} unit="h" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid grid-cols-2 gap-2 p-5">
              <Stat label="Avg fast (7d)" value={`${avg7.toFixed(1)} h`} />
              <Stat label="Avg fast (30d)" value={`${avg30.toFixed(1)} h`} />
              <Stat label="Longest" value={`${longest.toFixed(1)} h`} />
              <Stat label="Total fasted" value={`${Math.round(total)} h`} accent />
            </CardContent>
          </Card>
        </div>

        {/* ── History ── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display font-bold">History</h2>
              <span className="text-xs text-muted-foreground">{safeHistory.length} fasts logged</span>
            </div>
            {safeHistory.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon={Timer}
                  title="No fasts logged yet"
                  hint="Finish a fasting window or log a past fast — it lands here with full analytics."
                />
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {[...safeHistory].reverse().slice(0, 14).map((h) => (
                  <HistoryRow key={h.id} entry={h} onDelete={deleteEntry} onUpdate={updateEntry} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Manual log modal ── */}
        <Modal
          open={manualOpen}
          onClose={() => setManualOpen(false)}
          title="Log a past fast"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setManualOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveManual}>
                Save fast
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input className="mt-1.5" type="date" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Started</label>
                <Input className="mt-1.5" type="time" value={manual.startTime} onChange={(e) => setManual({ ...manual, startTime: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Ended</label>
                <Input className="mt-1.5" type="time" value={manual.endTime} onChange={(e) => setManual({ ...manual, endTime: e.target.value })} />
              </div>
            </div>
            <Input placeholder="Note (optional) — e.g. forgot to start the timer" value={manual.note} onChange={(e) => setManual({ ...manual, note: e.target.value })} />
            <p className="text-xs text-muted-foreground">
              Overnight fasts (end time on the next day) are handled automatically.
            </p>
          </div>
        </Modal>
      </TrackerShell>
    </RequireAuth>
  );
}

// ── History row with inline edit/delete ──

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
  const hours = (entry.end - entry.start) / 3600_000;

  if (editing) {
    const dateOf = (ts: number) => new Date(ts).toISOString().slice(0, 10);
    const timeOf = (ts: number) => new Date(ts).toTimeString().slice(0, 5);
    return (
      <li className="rounded-xl border border-primary/40 bg-primary/5 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={dateOf(entry.start)} onChange={(e) => onUpdate(entry.id, { start: Date.parse(`${e.target.value}T${timeOf(entry.start)}`) })} />
          <Input type="time" value={timeOf(entry.start)} onChange={(e) => onUpdate(entry.id, { start: Date.parse(`${dateOf(entry.start)}T${e.target.value}`) })} />
          <Input type="date" value={dateOf(entry.end)} onChange={(e) => onUpdate(entry.id, { end: Date.parse(`${e.target.value}T${timeOf(entry.end)}`) })} />
          <Input type="time" value={timeOf(entry.end)} onChange={(e) => onUpdate(entry.id, { end: Date.parse(`${dateOf(entry.end)}T${e.target.value}`) })} />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Done
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2.5 text-sm transition-colors hover:border-primary/30">
      <div className="min-w-0">
        <p className="font-medium">
          {formatDateShort(entry.start)} · {formatClock(entry.start)} → {formatClock(entry.end)}
        </p>
        <p className="text-xs text-muted-foreground">
          {hours.toFixed(1)}h · {entry.source === "manual" ? "manual entry" : protocolById(entry.protocolId).label}
          {entry.note ? ` · ${entry.note}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {entry.source === "manual" && <Flame className="h-3.5 w-3.5 text-amber-500" />}
        <button onClick={() => setEditing(true)} aria-label="Edit fast" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(entry.id)} aria-label="Delete fast" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-red-500">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

type FastStateShim = { protocolId: string; phase: FastPhase; startedAt: number | null };
