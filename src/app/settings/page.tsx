"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import TrackerShell from "@/components/trackers/TrackerShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SyncBadge } from "@/components/auth/AuthButton";
import AuthButton from "@/components/auth/AuthButton";
import { useToast } from "@/components/ui/use-toast";
import {
  applyBackup,
  collectBackup,
  downloadBackup,
  fmtKB,
  totalBackupBytes,
  type ImportReport,
} from "@/lib/backup";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useUserPrefs, DEFAULT_USER_PREFS, WORKOUT_SPLITS, MOTIVATION_STYLES, type UserPrefs } from "@/lib/user-prefs";
import {
  useMigrateWorkouts,
  useMigrateFasting,
  useMigrateTodos,
  useMigrateGoal,
  useStorageStats,
  notifyStorageChanged,
} from "@/lib/tracker-store";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SignalPanel from "@/components/trackers/SignalPanel";
import StoryPanel from "@/components/trackers/StoryPanel";

export default function SettingsPage() {
  useMigrateWorkouts();
  useMigrateFasting();
  useMigrateTodos();
  useMigrateGoal();
  const { prefs, setPrefs, isSetup } = useUserPrefs();
  const { status, user } = useSyncedStorage<UserPrefs>("prefs", DEFAULT_USER_PREFS);
  const { toast } = useToast();

  const stats = useStorageStats();
  const [report, setReport] = useState<ImportReport | null>(null);
  const [confirmWipe, setConfirmWipe] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = () => {
    const backup = collectBackup();
    downloadBackup(backup);
    toast({
      title: "Backup downloaded",
      description: `${Object.keys(backup.data).length} tracker keys included.`,
    });
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const result = applyBackup(parsed);
      setReport(result);
      notifyStorageChanged();
      if (result.ok) {
        toast({
          title: "Import complete",
          description: `${result.keysRestored.length} keys restored. Reload to see the data everywhere.`,
        });
      } else {
        toast({ title: "Import failed", description: result.error });
      }
    } catch {
      toast({ title: "Could not read file", description: "Is it a valid tracker-suite JSON backup?" });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const wipeLocal = () => {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("vk:")) doomed.push(k);
      }
      doomed.forEach((k) => window.localStorage.removeItem(k));
      toast({ title: "Local data cleared", description: "Sign in + reload to re-pull your cloud copy." });
      notifyStorageChanged();
    } catch {
      toast({ title: "Could not clear storage" });
    }
    setConfirmWipe("");
  };

  const backupKb = stats ? (totalBackupBytes(stats) / 1024).toFixed(1) : "—";
  const activeKeys = stats ? stats.filter((s) => s.exists).length : 0;

  return (
    <RequireAuth>
      <TrackerShell
        icon="settings"
        title="Settings"
        subtitle="Your data, your device — export the full suite, restore from a backup, or manage local storage."
        badge={<SyncBadge status={status} />}
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
          <StoryPanel
            eyebrow="Archive controls"
            title="Keep the dossier portable"
            action={<a href="#backup-restore" className="dossier-back-link">Open backup</a>}
          >
            Export before making broad changes, restore a known-good snapshot, and clear local data only after the explicit confirmation step.
          </StoryPanel>
          <SignalPanel
            label="Storage signal"
            value={stats ? `${activeKeys} keys` : "Measuring"}
            detail={user ? "Cloud sync available" : "Local browser storage"}
            tone={status === "error" ? "red" : "lime"}
          />
        </div>
        {/* ── Account ── */}
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500">
                <UserRound className="h-5 w-5 text-white" />
              </span>
              <div>
                <p className="text-sm font-semibold">Account & sync</p>
                <p className="text-xs text-muted-foreground">
                  {user ? user.email : "Local mode — data lives only in this browser"}
                </p>
              </div>
            </div>
            <AuthButton />
          </CardContent>
        </Card>

        {/* ── Backup / restore ── */}
        <Card id="backup-restore">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="font-display font-bold">Backup & restore</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              One JSON file covers every tracker — workouts, fasting history, goal roadmaps, todos,
              journal, affirmations, share drops, and even the v1 migration snapshots. Import
              validates everything before writing and snapshots the current state first.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={doExport}>
                <Download className="mr-1.5 h-4 w-4" /> Export full backup
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" /> Import backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => doImport(e.target.files?.[0])}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tracker data: ~{backupKb} KB across {activeKeys} active {activeKeys === 1 ? "key" : "keys"}.
            </p>

            {report && (
              <div
                className={cn(
                  "rounded-xl border p-3 text-sm",
                  report.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5",
                )}
              >
                {report.ok ? (
                  <>
                    <p className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Restored {report.keysRestored.length} keys
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.keysRestored.join(", ")}
                      {report.keysSkipped.length ? ` · skipped: ${report.keysSkipped.join(", ")}` : ""}
                      {report.exportedAt ? ` · exported ${report.exportedAt.slice(0, 10)}` : ""}
                    </p>
                  </>
                ) : (
                  <p className="flex items-center gap-1.5 font-semibold text-red-500">
                    <AlertTriangle className="h-4 w-4" /> {report.error}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Storage breakdown ── */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-display font-bold">Storage by tracker</h2>
            {stats === null ? (
              <p className="mt-2 text-sm text-muted-foreground">Measuring…</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {stats.map((s) => (
                  <li key={s.key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="font-mono text-xs">{s.key}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {!s.exists
                        ? "empty"
                        : `${s.items !== null ? `${s.items} items · ` : ""}${fmtKB(s.bytes)}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Preferences ── */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-display font-bold">Preferences</h2>
              </div>
              <span className="text-xs text-muted-foreground">{isSetup ? "setup complete" : "setup pending"}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Workout split</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {WORKOUT_SPLITS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setPrefs({ ...prefs, workoutSplit: s.id })}
                      className={cn(
                        "rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all",
                        prefs.workoutSplit === s.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Motivation style</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {MOTIVATION_STYLES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPrefs({ ...prefs, motivationStyle: m.id })}
                      className={cn(
                        "rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all",
                        prefs.motivationStyle === m.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Weight unit, goal category, metric label/target and fasting protocol are edited on
              their tracker pages where they&apos;re used. Re-run the full questionnaire from the hub.
            </p>
          </CardContent>
        </Card>

        {/* ── Danger zone ── */}
        <Card className="border-red-500/30">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="font-display font-bold">Danger zone</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Clearing local data removes everything stored in this browser under the tracker
              namespace (data, backups, sync markers). If you&apos;re signed in, cloud copies remain
              and re-pull on reload — otherwise this is permanent. Type{" "}
              <span className="font-mono font-semibold">CLEAR</span> to confirm.
            </p>
            <div className="flex gap-2">
              <Input
                className="w-40 font-mono"
                placeholder="CLEAR"
                value={confirmWipe}
                onChange={(e) => setConfirmWipe(e.target.value)}
              />
              <Button variant="destructive" onClick={wipeLocal} disabled={confirmWipe !== "CLEAR"}>
                Clear local data
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Want a safety net first? <button onClick={doExport} className="text-primary hover:underline">Export a backup</button> —{" "}
              or visit <Link href="/share" className="text-primary hover:underline">Share</Link> for per-drop exports.
            </p>
          </CardContent>
        </Card>
      </TrackerShell>
    </RequireAuth>
  );
}
