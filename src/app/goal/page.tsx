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
import { GOAL_MILESTONES, dateKey } from "@/lib/trackers";
import { cn } from "@/lib/utils";

type GoalState = {
  hub: "Berlin Hub" | "Munich Hub";
  visa: "EU Blue Card" | "IT Specialist Fast-Track";
  dailyTarget: number;
  checks: boolean[];
  appsByDay: Record<string, number>;
};

const DEFAULTS: GoalState = {
  hub: "Berlin Hub",
  visa: "EU Blue Card",
  dailyTarget: 3,
  checks: [false, false, false, false],
  appsByDay: {},
};

const SNIPPETS: Record<string, (hub: string) => string> = {
  LinkedIn: (hub) =>
    `Hallo! I'm a Full Stack Engineer specializing in TypeScript (React, Node, NestJS, PostgreSQL). I love the tech ecosystem in ${hub.replace(" Hub", "")} and notice your team is scaling up. Would love to connect and share how my background aligns with your current architecture needs. Vielen Dank!`,
  "Cold Email": (hub) =>
    `Subject: Full Stack Engineer (TypeScript) — open to ${hub.replace(" Hub", "")} relocation\n\nHi team — 5+ yrs shipping production TypeScript: React 19, NestJS, PostgreSQL. Relocating to Germany via ${hub.replace(" Hub", "")} (${new Date().getFullYear()}), EU Blue Card path. 15-min intro this week?`,
  Referral: (hub) =>
    `Hi! Saw you're at a ${hub.replace(" Hub", "")} tech company — I'm a Full Stack Engineer (React/Node/Postgres) relocating to Germany. Would you be open to a referral or a quick pointer to the hiring manager? Happy to share CV + portfolio.`,
};

export default function GoalPage() {
  const { value: g, setValue: setG, status } = useSyncedStorage<GoalState>("goal", DEFAULTS);
  const [snipType, setSnipType] = useState<keyof typeof SNIPPETS>("LinkedIn");
  const [copied, setCopied] = useState(false);
  const [todayApps, setTodayApps] = useState("");

  const doneCount = g.checks.filter(Boolean).length;
  const visaPct = Math.round((doneCount / GOAL_MILESTONES.length) * 100);

  const last7 = useMemo(() => {
    const out: { d: string; n: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      out.push({ d: k.slice(5), n: g.appsByDay[k] ?? 0 });
    }
    return out;
  }, [g.appsByDay]);
  const weekly = last7.reduce((a, b) => a + b.n, 0);
  const estDays = Math.max(
    12,
    Math.round(90 - doneCount * 12 - Math.min(weekly, 25)),
  );

  const snippet = SNIPPETS[snipType](g.hub);

  const logApps = () => {
    const n = parseInt(todayApps, 10);
    if (!n || n <= 0) return;
    const k = dateKey();
    setG({ ...g, appsByDay: { ...g.appsByDay, [k]: (g.appsByDay[k] ?? 0) + n } });
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

  return (
    <RequireAuth>
    <TrackerShell
      icon="🇩🇪"
      title="Germany Goal"
      subtitle="Get the job. Move to Berlin. One board: outreach velocity, visa readiness, and today's applications."
      badge={<SyncBadge status={status} />}
    >
      {/* trajectory */}
      <Card className="overflow-hidden">
        <div className="bg-[#0b1020] p-5 text-white">
          <svg viewBox="0 0 560 190" className="w-full">
            <defs>
              <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            {[40, 150, 260, 370, 480].map((x) => (
              <line key={x} x1={x} y1={10} x2={x} y2={175} stroke="#1e293b" strokeDasharray="3 4" />
            ))}
            <path
              d="M40 120 C 110 118, 130 60, 190 62 S 270 108, 320 100 S 430 92, 490 42"
              fill="none"
              stroke="url(#pathGrad)"
              strokeWidth="2.5"
              strokeDasharray="7 6"
            />
            {[
              { x: 40, y: 120, l: "Outreach & Apps", s: `${g.dailyTarget} / day`, on: true },
              { x: 190, y: 62, l: "Tech Interviews", s: "velocity auto", on: true },
              { x: 320, y: 100, l: "Visa Tracking", s: `${visaPct}% ready`, on: doneCount > 0 },
              { x: 490, y: 42, l: "Relocate Base", s: "velocity auto", on: false },
            ].map((n) => (
              <g key={n.l}>
                <circle cx={n.x} cy={n.y} r={16} fill={n.on ? "#38bdf8" : "#1e293b"} opacity={n.on ? 0.25 : 1} />
                <circle cx={n.x} cy={n.y} r={9} fill={n.on ? "#38bdf8" : "#334155"} />
                <text x={n.x} y={n.y + 32} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
                  {n.l}
                </text>
                <text x={n.x} y={n.y + 45} textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                  {n.s}
                </text>
              </g>
            ))}
          </svg>
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Active Tech Market Target: <strong>{g.hub.replace(" Hub", "")}</strong>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 px-5 pb-4">
          <Stat label="Weekly Outreach" value={`${weekly} apps`} />
          <Stat label="Est. Landing" value={`~${estDays} days`} />
          <Stat label="Visa Status" value={`${visaPct}% ready`} accent />
        </div>
      </Card>

      {/* controls */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Target Tech Ecosystem</p>
              <div className="mt-2">
                <Segmented
                  label="Target tech ecosystem"
                  options={[
                    { value: "Berlin Hub", label: "Berlin Hub" },
                    { value: "Munich Hub", label: "Munich Hub" },
                  ]}
                  value={g.hub}
                  onChange={(hub) => setG({ ...g, hub })}
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Visa Pathway Archetype</p>
              <div className="mt-2">
                <Segmented
                  label="Visa pathway archetype"
                  options={[
                    { value: "EU Blue Card", label: "EU Blue Card" },
                    { value: "IT Specialist Fast-Track", label: "IT Specialist Fast-Track" },
                  ]}
                  value={g.visa}
                  onChange={(visa) => setG({ ...g, visa })}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Daily Developer Application Target</label>
              <span className="text-sm font-semibold tabular-nums">{g.dailyTarget} / day</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={g.dailyTarget}
              onChange={(e) => setG({ ...g, dailyTarget: Number(e.target.value) })}
              className="mt-2 w-full"
            />
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              placeholder={`Log today's apps (e.g. ${g.dailyTarget})`}
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
                  className="w-full rounded-md bg-blue-600/80"
                  style={{ height: `${Math.max(4, Math.min(64, d.n * 12))}px`, opacity: d.n ? 1 : 0.25 }}
                />
                <span className="text-[10px] tabular-nums text-muted-foreground">{d.d.slice(3) || d.d}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* milestones */}
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Milestone verification steps · {doneCount}/{GOAL_MILESTONES.length}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${visaPct}%` }} />
          </div>
          <ul className="mt-3 space-y-2">
            {GOAL_MILESTONES.map((m, i) => (
              <li key={m}>
                <button
                  onClick={() => {
                    const checks = [...g.checks];
                    checks[i] = !checks[i];
                    setG({ ...g, checks });
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                    g.checks[i] ? "border-emerald-500/40 bg-emerald-500/10" : "border-border/60 hover:bg-accent",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[11px]",
                      g.checks[i] ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground",
                    )}
                  >
                    {g.checks[i] ? "✓" : ""}
                  </span>
                  <span className={g.checks[i] ? "line-through opacity-70" : ""}>{m}</span>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* outreach generator */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              TypeScript outreach generator
            </p>
            <select
              value={snipType}
              onChange={(e) => setSnipType(e.target.value as keyof typeof SNIPPETS)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
            >
              {Object.keys(SNIPPETS).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>
          <p className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm leading-relaxed">
            {snippet}
          </p>
          <div className="mt-3 flex justify-end">
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? "Copied ✓" : "⧉ Copy Snippet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TrackerShell>
    </RequireAuth>
  );
}
