"use client";

import Link from "next/link";
import { ArrowUpRight, Moon } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import { TrackerIcon } from "@/components/trackers/icons";
import { PERSONAL_MORE_NAV } from "@/lib/personal-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSyncedStorage } from "@/lib/use-synced-storage";

const descriptions: Record<string, string> = {
  "/goal": "Plan milestones and this week’s commitment.",
  "/weight-loss": "Review weight, recovery, and health signals.",
  "/intermittent-fasting": "Protect your meal window and fasting rhythm.",
  "/workout-tracking": "Record sessions and keep movement visible.",
  "/archive": "Keep private notes, links, images, and quotes.",
  "/settings": "Tune reminders, sync, and your Personal setup.",
};

export default function MorePage() {
  const { setValue: setManualBedtime } = useSyncedStorage<boolean>("bedtime:manual", false);

  return (
    <RequireAuth>
      <PersonalShell icon="settings" title="More" subtitle="The rest of the system, kept one calm step away.">
        <section data-testid="more-links" className="space-y-2">
          {PERSONAL_MORE_NAV.map((item) => <Link key={item.href} href={item.href} className="group flex items-center gap-3 border border-border/70 bg-card/55 p-4 transition-colors hover:border-primary/70"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-primary"><TrackerIcon name={item.icon} className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block font-display font-bold">{item.label}</span><span className="mt-1 block text-sm text-muted-foreground">{descriptions[item.href]}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>)}
        </section>
        <Card variant="dossier" className="mt-4">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                  <Moon className="h-5 w-5 text-[#c8ff3d]" />
                </div>
                <div>
                  <span className="dossier-kicker text-indigo-400">Evening Sanctuary</span>
                  <h2 className="font-display text-base font-bold">Strict Bedtime Lockdown</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Blank notifications, complete your evening wind-down, and seal your focus.
                  </p>
                </div>
              </div>
              <Link href="/settings#bedtime" className="shrink-0 text-xs text-primary hover:underline">
                Schedule →
              </Link>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => setManualBedtime(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs uppercase tracking-wider"
              >
                <Moon className="mr-1.5 h-3.5 w-3.5" />
                Engage Lockdown
              </Button>
            </div>
          </CardContent>
        </Card>
      </PersonalShell>
    </RequireAuth>
  );
}
