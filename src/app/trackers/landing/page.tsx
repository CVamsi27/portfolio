import Link from "next/link";
import {
  Archive,
  ArrowUpRight,
  Check,
  Compass,
  Dumbbell,
  Flame,
  Flag,
  Lock,
  Play,
  Scale,
  Shield,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import EditorialFrame from "@/components/editorial/EditorialFrame";
import ChapterLabel from "@/components/editorial/ChapterLabel";
import NovaMark from "@/components/brand/NovaMark";
import { TRACKER_BRAND } from "@/lib/brand";

const CORE_CAPABILITIES = [
  {
    icon: Flag,
    title: "Goals & Milestones",
    description: "Break complex outcomes into ordered milestones, weekly commitments, and daily metric velocity.",
  },
  {
    icon: Timer,
    title: "Meal Windows & Fasting",
    description: "Timestamp-derived fasting engine immune to tab drift, with 16:8 / 18:6 presets and eating window tracking.",
  },
  {
    icon: Dumbbell,
    title: "Physical Workouts",
    description: "Split-aware day tabs (PPL, Upper/Lower, custom splits), set logger with weights & reps, and rest timers.",
  },
  {
    icon: Flame,
    title: "Focus & Motivation",
    description: "Distraction-free focus scenes, timed Pomodoro sprints, audio chimes, and curated daily affirmations.",
  },
  {
    icon: Scale,
    title: "Body & Recovery Signals",
    description: "Daily weigh-in tracking, 7-entry trend analysis, and morning energy, sleep, and soreness diagnostics.",
  },
  {
    icon: Archive,
    title: "Second Brain Archive",
    description: "Private local-first repository for bookmarks, quotes, notes, and visual inspiration linked directly to goals.",
  },
];

export default function TrackerLandingPage() {
  return (
    <EditorialFrame surface="archive" className="min-h-[calc(100svh-var(--app-header-height))] !pt-0">
      <main data-testid="tracker-public-landing" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-3 sm:px-6 sm:pb-20 sm:pt-5 lg:px-10">
        {/* Hero Section */}
        <section className="grid gap-10 border-b border-border/70 pb-14 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:gap-16 lg:pb-20">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
              <NovaMark variant="compact" simple label={TRACKER_BRAND.name} />
              <span className="font-utility text-[10px] uppercase tracking-[0.2em]">From Buildora</span>
            </div>
            <ChapterLabel eyebrow="NOVA // Public entry" />
            <h1 className="mt-5 max-w-4xl font-display text-6xl font-black uppercase leading-[0.86] tracking-[-0.06em] text-foreground sm:text-8xl">
              Make the next chapter visible.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Goals, routines, focus, and momentum in one private workspace. Use it locally without sign-in, then add sync only when you want it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/hub"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c8ff3d] px-6 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#071014] shadow-lg shadow-[#c8ff3d]/20 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                Enter NOVA <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/log"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Rapid Log <Zap className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/motivation"
                className="inline-flex min-h-11 items-center rounded-xl border border-border/60 px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-[#49e7ff] hover:text-[#49e7ff]"
              >
                Explore Focus
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-border/70 bg-card/40 p-6 text-foreground shadow-xl">
            <div className="flex items-center gap-2 text-[#49e7ff]">
              <Shield className="h-4 w-4" />
              <p className="font-utility text-[10px] font-bold uppercase tracking-[0.2em]">What stays with you</p>
            </div>
            <ul className="mt-5 space-y-4">
              {[
                { title: "Local-first by default", desc: "Your data lives in browser storage instantly with zero network delay." },
                { title: "Optional private sync", desc: "Connect Supabase whenever you choose for seamless cross-device synchronization." },
                { title: "Share only with the people you choose", desc: "Private encrypted links with ephemeral auto-expiry and owner allowlists." },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3 text-sm leading-relaxed">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#c8ff3d]" />
                  <div>
                    <strong className="block font-medium text-foreground">{item.title}</strong>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        {/* Interactive Cockpit Preview Card */}
        <section className="mt-12 overflow-hidden rounded-2xl border border-border/80 bg-card/30 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#32b8c8]">
                System Architecture Preview
              </span>
              <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl">
                The Personal Cockpit
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-mono text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[#c8ff3d] animate-pulse" />
              0ms Latency · Synchronous Writes
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* Mock Next Move */}
            <div className="rounded-xl border border-border/60 bg-[#102027]/70 p-5 text-[#f4f0e7]">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#49e7ff]">
                Next Move Engine
              </span>
              <h3 className="mt-2 font-display text-lg font-bold">Write opening project release notes</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#a9b4af]">
                Prioritized automatically from today&apos;s goal velocity and pending P1 commitments.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#c8ff3d] px-3 py-1 font-mono text-[10px] font-bold uppercase text-[#071014]">
                  Start Move <ArrowUpRight className="h-3 w-3" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 font-mono text-[10px] uppercase text-white">
                  <Play className="h-2.5 w-2.5" /> 25m Focus
                </span>
              </div>
            </div>

            {/* Mock Fasting & Momentum */}
            <div className="rounded-xl border border-border/60 bg-card/60 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
                  Momentum Rails
                </span>
                <span className="font-display font-bold text-lg tabular-nums text-[#32b8c8]">75%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-3/4 rounded-full bg-[#32b8c8]" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 p-2">
                  <Check className="h-3 w-3 text-[#c8ff3d]" />
                  <span className="font-medium text-foreground">16h Fast</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 p-2">
                  <Check className="h-3 w-3 text-[#c8ff3d]" />
                  <span className="font-medium text-foreground">Workout</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 p-2">
                  <Check className="h-3 w-3 text-[#c8ff3d]" />
                  <span className="font-medium text-foreground">Tasks (3/3)</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 p-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full border border-border" />
                  <span>Goal Target</span>
                </div>
              </div>
            </div>

            {/* Mock Recovery & Health */}
            <div className="rounded-xl border border-border/60 bg-card/60 p-5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#ff554d]">
                Readiness Diagnostics
              </span>
              <h3 className="mt-2 font-display text-lg font-bold text-foreground">Recovery Score: Optimal</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Morning biometric signals dictate training volume and fasting duration.
              </p>
              <div className="mt-4 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Energy:</span>
                  <span className="font-bold text-[#c8ff3d]">5 / 5 (Peak)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sleep Quality:</span>
                  <span className="font-bold text-[#49e7ff]">4 / 5 (Restored)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Muscle Soreness:</span>
                  <span className="font-bold text-foreground">1 / 5 (Fresh)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6 Core Capabilities */}
        <section className="mt-14">
          <div className="mb-6">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#49e7ff]">
              Instruments // Architecture
            </span>
            <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
              Engineered for relentless consistency.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_CAPABILITIES.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="group rounded-xl border border-border/70 bg-card/50 p-6 transition-all hover:border-primary/60 hover:bg-card/80"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-primary transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold uppercase tracking-[-0.02em] text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Bottom Call to Action */}
        <section className="mt-16 rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-8 text-center sm:p-12">
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
            Start your next move today.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            No signup forms or credit cards required. Your personal operating system boots instantly in your browser.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/hub"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#c8ff3d] px-8 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#071014] shadow-xl shadow-[#c8ff3d]/25 transition-transform hover:-translate-y-0.5"
            >
              Enter NOVA <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </EditorialFrame>
  );
}
