"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Flag,
  Github,
  Globe,
  ListChecks,
  ShieldCheck,
  Target,
  Timer,
} from "lucide-react";
import {
  interviewReadySprint as sprint,
  type ResourceLink,
} from "@/data/interview-ready-sprint";
import { useCareerWorkflow } from "@/lib/career-workflow-store";
import { careerReview } from "@/lib/career-workflow";
import { useNow } from "@/lib/tracker-store";
import { zonedDate } from "@/lib/routine-reminders";
import ProgressBar from "@/components/charts/ProgressBar";

const statusCopy = {
  active: "Active",
  gated: "Gated",
  next: "Next",
} as const;

function LinkPill({ item }: { item: ResourceLink }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/60 hover:text-primary transition-colors"
    >
      {item.kind === "repo" ? (
        <Github className="h-3 w-3 shrink-0" />
      ) : item.kind === "study" ? (
        <BookOpen className="h-3 w-3 shrink-0 text-primary" />
      ) : (
        <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
      )}
      <span>{item.label}</span>
      <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60" />
    </a>
  );
}

export default function InterviewSprint() {
  const workflow = useCareerWorkflow();
  const today = zonedDate(useNow(60_000), "Asia/Kolkata");
  const review = careerReview(workflow.activities.value, today);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  const liveCounts: Record<string, number> = {
    applications: review.applications,
    outreaches: review.outreaches,
    proposals: review.proposals,
    interviews: review.interviews,
    drills: 0,
    mock: 0,
  };

  return (
    <div className="space-y-6" data-testid="interview-sprint">
      {/* Hero Header */}
      <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Flag className="h-3.5 w-3.5" />
              Starts Today · {sprint.startDateLabel} → {sprint.endDate}
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {sprint.headline}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sprint.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90"
              href="/roadmap?view=opportunities"
            >
              Open Pipeline <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-background px-4 text-xs font-semibold hover:border-primary/50"
              href="/roadmap?view=study"
            >
              Study Bible (600 ch)
            </Link>
          </div>
        </div>

        {/* Quick Verified Links */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          {sprint.quickLinks.map((item) => (
            <LinkPill key={item.url} item={item} />
          ))}
        </div>

        {/* Key Facts Strip */}
        <dl className="grid gap-3 sm:grid-cols-4 pt-2">
          {[
            { icon: Flag, label: "Day 1 Start", value: sprint.startDateLabel },
            {
              icon: CalendarDays,
              label: "Phase 0 Sprint",
              value: sprint.sprintWindow,
            },
            {
              icon: Timer,
              label: "Weekly Capacity",
              value: sprint.weeklyCapacity,
            },
            {
              icon: ShieldCheck,
              label: "Phase 0 Exit Gate",
              value: sprint.triggerDate,
            },
          ].map((fact) => {
            const Icon = fact.icon;
            return (
              <div
                key={fact.label}
                className="rounded-xl border border-border/60 bg-background/60 p-3"
              >
                <dt className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">
                  {fact.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      {/* Weekly Scoreboard with Live Progress Bars */}
      <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Weekly Hiring Scoreboard (Week of {review.start})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live progress bars driven by recorded sends, warm outreach,
              enquiries, and booked screens.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-primary hover:underline"
          >
            Full funnel graphs →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sprint.targets.map((target) => (
            <div
              key={target.id}
              className="rounded-xl border border-border/60 bg-background/60 p-3.5 space-y-2"
            >
              <ProgressBar
                label={target.label}
                value={liveCounts[target.id] ?? 0}
                max={target.numericTarget}
                tone={
                  target.id === "interviews"
                    ? "emerald"
                    : target.id === "proposals"
                      ? "amber"
                      : "primary"
                }
                hint={target.why}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 3-Phase Roadmap */}
      <section className="grid gap-4 lg:grid-cols-3" aria-label="Three-phase roadmap">
        {sprint.stages.map((stage) => (
          <article
            key={stage.id}
            className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Phase {stage.number} · {stage.window}
                  </p>
                  <h3 className="font-display text-base font-bold mt-0.5">
                    {stage.label}
                  </h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    stage.status === "active"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {statusCopy[stage.status]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {stage.summary}
              </p>
              <ul className="space-y-1.5 text-xs text-foreground">
                {stage.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Exit gate:</strong>{" "}
                {stage.exit}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stage.links.map((l) => (
                  <LinkPill key={l.url} item={l} />
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Day-by-Day Detailed Execution Plan (Starting Mon 23 Nov 2026) */}
      <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Phase 0 Day-by-Day Plan (Starts Today · Mon 23 Nov – Fri 4 Dec)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any day for the full step-by-step description, deliverable,
            verification check, and direct study.buildora.work links.
          </p>
        </div>

        <ol className="space-y-2.5">
          {sprint.days.map((day) => {
            const isToday = day.isoDate === today;
            const isOpen = expandedDay === day.day || isToday;
            return (
              <li
                key={day.day}
                className={`rounded-xl border transition-colors ${
                  isToday
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/60 bg-background/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedDay((cur) => (cur === day.day ? null : day.day))
                  }
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {String(day.day).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-primary">
                          {day.date}
                        </span>
                        {isToday && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            TODAY
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {day.phase}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {day.build}
                      </p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {day.description}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="rounded-lg bg-muted/40 p-2.5">
                        <strong className="block text-foreground mb-0.5">
                          Deliverable
                        </strong>
                        <span className="text-muted-foreground">
                          {day.deliverable}
                        </span>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2.5">
                        <strong className="block text-foreground mb-0.5">
                          Done check / evidence
                        </strong>
                        <span className="text-muted-foreground">
                          {day.evidence}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {day.links.map((item) => (
                        <LinkPill key={item.url} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* 5-Round Interview Rotation */}
      <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold">
            5-Round Senior Interview Rotation (1 Hour / Weekday)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Direct verified chapters on study.buildora.work mapped to each real
            interview screen.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {sprint.interviewRounds.map((round) => (
            <article
              key={round.id}
              className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {round.weekday}
                </span>
              </div>
              <h4 className="font-display text-sm font-bold">{round.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {round.focus}
              </p>
              <p className="text-xs text-foreground bg-muted/40 rounded-lg p-2.5">
                <strong>Drill protocol:</strong> {round.protocol}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {round.links.map((l) => (
                  <LinkPill key={l.url} item={l} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Three 3-Minute Project Defense Stories */}
      <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold">
            Three 3-Minute Project Defense Walkthroughs
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record each once; reuse in interviews, hiring-manager messages, and
            paid-diagnostic proposals.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {sprint.projectStories.map((story) => (
            <article
              key={story.id}
              className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/60 p-4 space-y-3"
            >
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-primary">
                  {story.pillar} · {story.duration}
                </span>
                <h4 className="font-display text-sm font-bold">{story.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {story.scriptOutline}
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  <strong>Honest limit:</strong> {story.limitation}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                {story.links.map((l) => (
                  <LinkPill key={l.url} item={l} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Phase 1 & Phase 2 Weekly Blueprints (7 Dec -> 18 Feb) */}
      <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold">
              Phase 1 &amp; Phase 2 Weekly Blueprint (7 Dec 2026 → 18 Feb 2027)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Full end-to-end roadmap through offer signing with verified{" "}
              <span className="font-mono">study.buildora.work</span> chapters
              for every stage.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {sprint.weeklyBlueprints.map((bp) => (
            <article
              key={bp.week}
              className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/60 p-4 space-y-3"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {bp.week} · {bp.window}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {bp.phase}
                  </span>
                </div>
                <h4 className="font-display text-sm font-bold">{bp.theme}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {bp.description}
                </p>
                <p className="text-xs text-foreground">
                  <strong>Deliverable:</strong> {bp.deliverable}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                {bp.links.map((l) => (
                  <LinkPill key={l.url} item={l} />
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* 7 Interview Cheatsheets Strip */}
        <div className="pt-3 border-t border-border/50 space-y-2">
          <p className="text-xs font-semibold text-foreground">
            Pre-Interview Rapid Cheatsheets (study.buildora.work)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sprint.cheatsheets.map((c) => (
              <LinkPill key={c.url} item={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Daily Cadence & Hiring Channels */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-3">
          <h3 className="font-display text-base font-semibold flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            {sprint.cadence.headline}
          </h3>
          <p className="text-xs text-muted-foreground">{sprint.cadence.note}</p>
          <dl className="space-y-2.5 pt-1">
            {sprint.cadence.blocks.map((block, index) => (
              <div
                key={`${block.days}-${index}`}
                className="rounded-xl border border-border/60 bg-background/60 p-3 space-y-1"
              >
                <dt className="flex items-center justify-between text-xs font-semibold">
                  <span>
                    {block.days} · {block.slot}
                  </span>
                  <span className="font-mono text-primary">{block.time}</span>
                </dt>
                <dd className="text-xs text-muted-foreground">{block.work}</dd>
                <dd className="text-[11px] font-medium text-foreground">
                  Output: {block.output}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
          <div className="space-y-2">
            <h3 className="font-display text-base font-semibold">
              Direct Hiring Channels &amp; Mocks
            </h3>
            <p className="text-xs text-muted-foreground">
              Open qualified channels directly—always pair ≥50% of applications
              with a direct hiring-manager or referral message.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {sprint.hiringChannels.map((c) => (
                <LinkPill key={c.url} item={c} />
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-border/50">
            <h3 className="font-display text-sm font-semibold">
              Readiness &amp; Quality Gates
            </h3>
            <ol className="space-y-2 text-xs text-muted-foreground list-decimal pl-4">
              {sprint.gates.map((gate) => (
                <li key={gate}>{gate}</li>
              ))}
            </ol>
          </div>

          <div className="space-y-2 pt-3 border-t border-border/50 text-xs">
            <p className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-foreground">
              {sprint.triggerNote}
            </p>
            <p className="rounded-xl bg-muted/50 p-3 text-muted-foreground">
              {sprint.frontendNote}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
