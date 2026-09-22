"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import { TrackerIcon } from "@/components/trackers/icons";
import { PERSONAL_MORE_NAV } from "@/lib/personal-nav";

const descriptions: Record<string, string> = {
  "/goal": "Plan milestones and this week’s commitment.",
  "/weight-loss": "Review weight, recovery, and health signals.",
  "/intermittent-fasting": "Protect your meal window and fasting rhythm.",
  "/workout-tracking": "Record sessions and keep movement visible.",
  "/archive": "Keep private notes, links, images, and quotes.",
  "/settings": "Tune reminders, sync, and your Personal setup.",
};

export default function MorePage() {
  return (
    <RequireAuth>
      <PersonalShell icon="settings" title="More" subtitle="The rest of the system, kept one calm step away.">
        <section data-testid="more-links" className="space-y-2">
          {PERSONAL_MORE_NAV.map((item) => <Link key={item.href} href={item.href} className="group flex items-center gap-3 border border-border/70 bg-card/55 p-4 transition-colors hover:border-primary/70"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-primary"><TrackerIcon name={item.icon} className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block font-display font-bold">{item.label}</span><span className="mt-1 block text-sm text-muted-foreground">{descriptions[item.href]}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>)}
        </section>
      </PersonalShell>
    </RequireAuth>
  );
}
