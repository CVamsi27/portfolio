"use client";
import { useEffect, useState } from "react";
import {
  type GermanyRoadmap as Plan,
  campaignPosition,
} from "@/lib/germany-roadmap";
import { isCalendarDate, personalSchedule } from "@/lib/personal-timetable";
import type {
  CareerChecklistItem,
  CareerEvidence,
  CareerExecutionState,
} from "@/lib/career-roadmap";
import DailyTimetable, {
  type DailySchedule,
} from "@/components/trackers/DailyTimetable";
import RoadmapGuide from "./RoadmapGuide";
import EvidenceItem from "./RoadmapEvidenceItem";
import GermanyExecutionView from "./GermanyExecutionView";
import { annotateGermanySchedule } from "@/lib/germany-execution";
import type {
  GermanyExamAttempt,
  GermanyCompanyRecord,
} from "@/lib/germany-execution";
export default function GermanyRoadmap({
  plan,
  today,
  email,
  days,
  state,
  onEvidence,
  onAttempt,
  onCompany,
}: {
  plan: Plan;
  onAttempt?: (attempt: GermanyExamAttempt) => void;
  onCompany?: (id: string, record: GermanyCompanyRecord) => void;
  today: string;
  email?: string;
  days: Array<{ date: string; schedule: DailySchedule }>;
  state: CareerExecutionState;
  onEvidence: (
    item: CareerChecklistItem,
    evidence: CareerEvidence,
    verify: boolean,
  ) => void;
}) {
  const [date, setDate] = useState(today);
  useEffect(() => {
    const update = () => {
      const q = new URLSearchParams(window.location.search).get("date");
      setDate(q && isCalendarDate(q) ? q : today);
    };
    update();
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, [today]);
  const position = campaignPosition(plan, date),
    week = plan.weeks[position.week - 1];
  const schedule =
    personalSchedule(email, date) ??
    days.find((d) => d.date === date)?.schedule ??
    {};
  const recovery =
    Object.keys(schedule).length === 0 &&
    date >= plan.startDate &&
    new Date(`${date}T12:00:00Z`).getUTCDay() === 0;
  const allItems = plan.weeks.flatMap((w) => w.items);
  const verified = allItems.filter(
    (i) => state.evidenceByItemId[i.id]?.verifiedAt,
  ).length;
  const next = week.items
    .filter((i) => !state.evidenceByItemId[i.id]?.verifiedAt)
    .slice(0, 3);
  if (plan.execution)
    return (
      <GermanyExecutionView
        plan={plan}
        date={date}
        setDate={setDate}
        today={today}
        schedule={annotateGermanySchedule(plan.execution, date, schedule)}
        state={state}
        onEvidence={onEvidence}
        onAttempt={onAttempt}
        onCompany={onCompany}
      />
    );
  return (
    <div className="space-y-6" data-testid="germany-roadmap">
      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-6 space-y-3">
        <p className="font-utility text-xs uppercase tracking-widest text-primary">
          Germany campaign · 50 hours/week
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold">
          Build proof. Apply every week.
        </h2>
        <p className="text-sm leading-relaxed break-words">{plan.target}</p>
        <p className="text-xs text-muted-foreground">
          {plan.startDate} → {plan.endDate} · {verified}/{allItems.length}{" "}
          milestones verified · Reviewed {plan.reviewedOn}
        </p>
        <p className="text-sm leading-relaxed">
          {position.stage === "before"
            ? "Launch preparation: week 1 begins on " +
              plan.startDate +
              ". Prepare consistent materials and check live roles now."
            : position.stage === "after"
              ? "Continue the hiring cycle: applications, two mocks, observed gap repair and proof maintenance. Review the January 4–7 study ending without auto-completing chapters."
              : "Week " + week.number + ": " + week.deliverable}
        </p>
        <p className="text-xs text-muted-foreground">
          An interview or take-home replaces an equal block. Keep the 50-hour
          cap. An offer date is not predicted.
        </p>
      </section>
      <section className="space-y-3">
        <div className="flex flex-wrap justify-between items-end gap-3">
          <h2 className="font-display text-xl font-semibold">
            Dated timetable
          </h2>
          <label className="text-sm">
            Plan date
            <input
              type="date"
              value={date}
              className="ml-2 min-h-11 max-w-full rounded-lg border border-border bg-background px-2"
              onChange={(e) => {
                if (!isCalendarDate(e.target.value)) return;
                setDate(e.target.value);
                const url = new URL(window.location.href);
                url.searchParams.set("date", e.target.value);
                window.history.replaceState({}, "", url);
              }}
            />
          </label>
        </div>
        {recovery && (
          <p
            className="rounded-xl border border-border p-4 text-sm"
            role="status"
          >
            Recovery Sunday. No required work. Chapters remain available in
            Curriculum for optional browsing.
          </p>
        )}
        <DailyTimetable
          schedule={schedule}
          date={date}
          timeZone="Asia/Kolkata"
          title="Today's timetable"
          initiallyExpanded={false}
        />
        <p className="text-xs text-muted-foreground">
          Mon/Wed/Fri: OSS. Tue/Thu: networking and technical writing. Weekdays
          9h · Saturday 5h · Sunday recovery. Meetings use Europe/Berlin; check
          the invitation and date-aware world clock.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">
          {recovery
            ? "Next working session"
            : position.stage === "after"
              ? "Next cycle review"
              : "Next three actions"}
        </h2>
        {position.stage === "after" ? (
          <p className="text-sm leading-relaxed">
            Review actual application stages, retest the weakest interview
            mechanism and replace next week&apos;s scope with the highest-value
            live work. The twelve-week evidence remains below.
          </p>
        ) : recovery ? (
          <p className="text-sm text-muted-foreground">
            Resume on Monday. Missed work replaces lower-priority work; it does
            not double the next day.
          </p>
        ) : next.length ? (
          <ol className="grid gap-3 lg:grid-cols-3">
            {next.map((item) => (
              <EvidenceItem
                key={item.id}
                item={item}
                state={state}
                onEvidence={onEvidence}
              />
            ))}
          </ol>
        ) : (
          <p className="text-sm">
            This week&apos;s milestones are verified. Maintain applications,
            replies, German and recall; choose the next gap during
            Saturday&apos;s review.
          </p>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">
          Twelve-week sequence
        </h2>
        <p className="text-sm text-muted-foreground">
          Applications, coding, German and recall continue each week. A planned
          date never completes a milestone.
        </p>
        {plan.weeks.map((w) => (
          <details
            key={`${w.number}:${position.week}`}
            open={w.number === position.week}
            className="rounded-xl border border-border bg-card p-4"
          >
            <summary className="min-h-11 cursor-pointer font-medium text-sm leading-relaxed">
              Week {w.number} · {w.start}–{w.end}
              <span className="block mt-1 text-muted-foreground font-normal">
                {w.deliverable}
              </span>
            </summary>
            <dl className="mt-4 grid gap-4 md:grid-cols-3 text-sm leading-relaxed">
              <div>
                <dt className="font-semibold text-primary">
                  Study and interviews
                </dt>
                <dd className="mt-1">{w.study}</dd>
              </div>
              <div>
                <dt className="font-semibold text-primary">
                  Project acceptance
                </dt>
                <dd className="mt-1">{w.deliverable}</dd>
              </div>
              <div>
                <dt className="font-semibold text-primary">OSS and hiring</dt>
                <dd className="mt-1">{w.campaign}</dd>
              </div>
            </dl>
            <details className="mt-4">
              <summary className="min-h-11 cursor-pointer text-sm text-primary">
                Week {w.number} evidence
              </summary>
              <ol className="mt-2 grid gap-3 lg:grid-cols-3">
                {w.items.map((item) => (
                  <EvidenceItem
                    key={item.id}
                    item={item}
                    state={state}
                    onEvidence={onEvidence}
                  />
                ))}
              </ol>
            </details>
          </details>
        ))}
      </section>
      <details className="workspace-panel">
        <summary className="min-h-11">Weekly allocation · 50 hours</summary>
        <dl className="mt-3 space-y-2 text-sm">
          {plan.allocations.map((a) => (
            <div key={a.label} className="flex justify-between gap-4">
              <dt>{a.label}</dt>
              <dd className="shrink-0 tabular-nums">{a.hours}h</dd>
            </div>
          ))}
        </dl>
      </details>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">
          How to execute each workstream
        </h2>
        {plan.sections.map((s) => (
          <details key={s.title} className="workspace-panel">
            <summary className="min-h-11 text-sm font-semibold">
              {s.title}
            </summary>
            <div className="mt-3">
              <RoadmapGuide content={s.content} />
            </div>
          </details>
        ))}
      </section>
      <details className="workspace-panel">
        <summary className="min-h-11">Sources and recheck dates</summary>
        <p className="my-3 text-sm text-muted-foreground">
          Reviewed {plan.reviewedOn}. Recheck live vacancies when applying and
          annual immigration rules for a 2027 application.
        </p>
        <ul className="space-y-2 text-sm">
          {plan.sources.map((s) => (
            <li key={s.url}>
              <a
                className="text-primary underline break-words"
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
