"use client";
import { useEffect, useState } from "react";
import type { GermanyRoadmap } from "@/lib/germany-roadmap";
import { campaignPosition } from "@/lib/germany-roadmap";
import {
  datedAssignments,
  examReadiness,
  scoreExam,
  type GermanyExamAttempt,
  type GermanyDay,
  type GermanyCompanyRecord,
} from "@/lib/germany-execution";
import type {
  CareerChecklistItem,
  CareerEvidence,
  CareerExecutionState,
} from "@/lib/career-roadmap";
import { isCalendarDate } from "@/lib/personal-timetable";
import DailyTimetable, {
  type DailySchedule,
} from "@/components/trackers/DailyTimetable";
import RoadmapGuide from "./RoadmapGuide";
import EvidenceItem from "./RoadmapEvidenceItem";
import GermanyExamForm from "./GermanyExamForm";
import GermanyCompanyForm from "./GermanyCompanyForm";
const panels = ["Today", "This week", "Exams", "Companies", "Guides"] as const;
type Panel = (typeof panels)[number];
export default function GermanyExecutionView({
  plan,
  date,
  setDate,
  today,
  schedule,
  state,
  onEvidence,
  onAttempt,
  onCompany,
}: {
  plan: GermanyRoadmap;
  date: string;
  setDate: (date: string) => void;
  today: string;
  schedule: DailySchedule;
  state: CareerExecutionState;
  onEvidence: (
    item: CareerChecklistItem,
    evidence: CareerEvidence,
    verify: boolean,
  ) => void;
  onAttempt?: (attempt: GermanyExamAttempt) => void;
  onCompany?: (id: string, record: GermanyCompanyRecord) => void;
}) {
  const e = plan.execution!;
  const [panel, setPanel] = useState<Panel>("Today"),
    [search, setSearch] = useState(""),
    [guide, setGuide] = useState("");
  useEffect(() => {
    const sync = () => {
      const candidate = new URLSearchParams(window.location.search).get(
        "panel",
      );
      setPanel(
        panels.find((p) => p.toLowerCase().replace(" ", "-") === candidate) ??
          "Today",
      );
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    const task = new URLSearchParams(window.location.search).get("task");
    if (panel === "Today" && task === `germany:2026:day:${date}`) {
      const frame = requestAnimationFrame(() => {
        const target = document.getElementById(task);
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: "start" });
        }
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [date, panel]);
  const choose = (next: Panel) => {
    setPanel(next);
    const url = new URL(window.location.href);
    url.searchParams.set("panel", next.toLowerCase().replace(" ", "-"));
    window.history.replaceState({}, "", url);
  };
  const navigate = (next: string) => {
    if (!isCalendarDate(next)) return;
    setDate(next);
    const url = new URL(window.location.href);
    url.searchParams.set("date", next);
    url.searchParams.delete("task");
    window.history.replaceState({}, "", url);
  };
  const openGuide = (id: string) => {
    setGuide(id);
    choose("Guides");
  };
  const position = campaignPosition(plan, date),
    week = plan.weeks[position.week - 1],
    campaign = e.weeks[position.week - 1];
  const day = e.days.find((d) => d.date === date),
    assignments = datedAssignments(e, date);
  const attempts = state.germanyExamAttempts ?? [];
  const retakes = attempts.filter((a) => {
    const round = e.rounds.find((r) => r.id === a.roundId);
    return (
      round &&
      a.promptVersion === e.assessmentVersion &&
      scoreExam(round, a).status === "repair" &&
      a.retakeDate <= date &&
      !attempts.some(
        (b) =>
          b.roundId === a.roundId &&
          b.track === a.track &&
          Date.parse(b.startedAt) > Date.parse(a.startedAt),
      )
    );
  });
  const nextExam = e.assessments.find((a) => a.date >= date);
  const verified = plan.weeks
    .flatMap((w) => w.items)
    .filter((i) => state.evidenceByItemId[i.id]?.verifiedAt).length;
  const context = {
    date,
    task: `germany:2026:day:${date}`,
    onGuide: openGuide,
  };
  const evidence = (
    id: string,
    text: string,
    minutes = 90,
  ): CareerChecklistItem => ({
    id,
    text,
    evidenceType: "note",
    estimatedMinutes: minutes,
    acceptanceCriteria:
      "Save the actual output, source/revision, observed check and remaining gap. Reading needs an unaided explanation, trace and correction. A date or draft never proves completion or submission. Verify the saved evidence after inspecting it.",
  });
  const dayContent = (d: GermanyDay) => (
    <div className="space-y-4" id={d.id}>
      <RoadmapGuide
        content={
          "**Study:** " +
          d.blocks.study +
          "\n\n**Project:** " +
          d.blocks.project +
          "\n\n" +
          (d.blocks.assessment
            ? "**Assessment:** " + d.blocks.assessment
            : "**Practice:** " +
              d.blocks.practice +
              "\n\n**Speak:** " +
              d.blocks.speak)
        }
        context={{ ...context, date: d.date, task: d.id }}
      />
      <ul>
        <EvidenceItem
          item={evidence(
            d.id + ":result",
            "Daily explanation, project check and practice result",
          )}
          state={state}
          onEvidence={onEvidence}
        />
      </ul>
    </div>
  );
  return (
    <div className="space-y-6 min-w-0" data-testid="germany-roadmap">
      <section className="border-l-4 border-primary bg-card p-4 sm:p-6 space-y-3 rounded-r-xl">
        <p className="font-utility text-xs uppercase tracking-widest text-primary">
          Germany campaign · 50 hours/week
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold">
          Build proof. Apply every week.
        </h2>
        <p className="text-sm leading-relaxed">{plan.target.split(". ")[0]}.</p>
        <p className="text-xs text-muted-foreground">
          {plan.startDate} → {plan.endDate} · {verified}/
          {plan.weeks.flatMap((w) => w.items).length} milestones verified ·
          Reviewed {plan.reviewedOn}
        </p>
        <p className="text-sm">
          {position.stage === "before"
            ? "Prepare the launch packet; the dated campaign begins on 12 October."
            : position.stage === "after"
              ? "Continue the hiring cycle. Use the January 4–7 study ending, actual interview feedback and current eligible roles to choose the next two weeks."
              : `Week ${week.number}: ${week.deliverable}`}
        </p>
      </section>
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <label className="text-sm">
          Plan date
          <input
            type="date"
            value={date}
            className="block mt-1 min-h-11 max-w-full rounded-lg border border-border bg-background px-2"
            onChange={(event) => navigate(event.target.value)}
          />
        </label>
        <button
          className="inline-action min-h-11"
          onClick={() => {
            navigate(today);
            choose("Today");
          }}
        >
          Go to today
        </button>
      </div>
      <nav
        aria-label="Germany roadmap sections"
        className="flex flex-wrap gap-2"
      >
        {panels.map((p) => (
          <button
            key={p}
            aria-pressed={panel === p}
            className={`min-h-11 rounded-lg border px-3 text-sm ${panel === p ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
            onClick={() => choose(p)}
          >
            {p}
          </button>
        ))}
      </nav>
      {panel === "Today" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <section className="rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-semibold">Next assessment</h3>
              {nextExam ? (
                <>
                  <p className="text-sm">
                    {nextExam.id} · {nextExam.date} · {nextExam.time} IST
                  </p>
                  <RoadmapGuide content={nextExam.content} />
                  <button
                    className="inline-action min-h-11"
                    onClick={() => choose("Exams")}
                  >
                    Open prompts and rubrics
                  </button>
                </>
              ) : (
                <p className="text-sm">
                  Review the weakest round and set a changed-prompt retake in
                  the next cycle.
                </p>
              )}
            </section>
            <section className="rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-semibold">Campaign action</h3>
              <RoadmapGuide content={campaign.application} />
              <button
                className="inline-action min-h-11"
                onClick={() => choose("Companies")}
              >
                Open company queue
              </button>
            </section>
          </div>
          {retakes.length > 0 && (
            <section className="rounded-xl border border-primary/30 p-4 space-y-2">
              <h3 className="font-semibold">Repair due</h3>
              {retakes.map((a) => (
                <p key={a.id} className="text-sm">
                  {a.roundId} {a.track} · {a.retakeDate}: {a.repair}
                </p>
              ))}
              <p className="text-sm">
                The failed-round retake replaces the next Wednesday checkpoint.
                R4 uses separate project blocks; preserve the original attempt.
              </p>
              <button
                className="inline-action min-h-11"
                onClick={() => choose("Exams")}
              >
                Record the changed-prompt retake
              </button>
            </section>
          )}
          {Object.keys(assignments).length ? (
            <section className="space-y-3" id={day?.id}>
              <h2 className="font-display text-xl font-semibold">
                {day?.title ?? `Saturday · ${date}`}
              </h2>
              <p className="text-xs text-muted-foreground">
                All times IST. Wednesday assessment includes coding and
                speaking. Actual interviews replace equal blocks; no extra
                hours.
              </p>
              {Object.entries(assignments).map(([range, content]) => (
                <article
                  key={range}
                  className="border-t border-border pt-4 space-y-3"
                >
                  <h3 className="font-utility text-sm font-semibold text-primary">
                    {range.replace("-", "–")}
                  </h3>
                  <RoadmapGuide content={content} context={context} />
                  {range === "16:15-17:15" &&
                    !day?.blocks.assessment &&
                    e.practices
                      .filter((p) =>
                        new RegExp("\\b" + p.id + "\\b").test(content),
                      )
                      .map((p) => (
                        <div
                          key={p.id}
                          className="rounded-lg bg-muted/40 p-3 space-y-2"
                        >
                          <p className="font-semibold text-sm">
                            {p.id}: {p.task}
                          </p>
                          <RoadmapGuide content={p.cases} />
                        </div>
                      ))}
                  {range === "08:30-10:00" && day && (
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">
                        Revision questions for this reading
                      </p>
                      {[
                        ...new Set(
                          [
                            ...day.blocks.study.matchAll(
                              /https:\/\/study\.buildora\.work\/([^\s)]+)/g,
                            ),
                          ].map((match) =>
                            match[0].replace(/[^/]+$/, "REVISION.md"),
                          ),
                        ),
                      ].map((url, index) => (
                        <RoadmapGuide
                          key={url}
                          content={`[Revision companion ${index + 1}](${url})`}
                          context={context}
                        />
                      ))}
                    </div>
                  )}
                  {range === "14:30-16:00" &&
                    e.posts
                      .filter((post) => post.date === date)
                      .map((post) => (
                        <details
                          key={post.id}
                          className="rounded-lg border border-border p-3"
                        >
                          <summary className="min-h-11 cursor-pointer font-semibold text-sm">
                            {post.id}: {post.title} · prepare/review draft
                          </summary>
                          <RoadmapGuide content={post.content} />
                        </details>
                      ))}
                  {range === "08:30-10:00" && (
                    <p className="text-sm">
                      15 min delayed recall → 40 min selected reading → 25 min
                      closed-page trace → 10 min correction. Use the chapter’s
                      See Also revision companion; repair unclear prerequisites
                      before adding topics.
                    </p>
                  )}
                </article>
              ))}
              <ul>
                <EvidenceItem
                  item={evidence(
                    `germany:2026:day:${date}:result`,
                    "Save today’s explanation, project check and practice result",
                  )}
                  state={state}
                  onEvidence={onEvidence}
                />
              </ul>
            </section>
          ) : (
            <section className="rounded-xl border border-border p-4 text-sm space-y-3">
              <p>
                {position.stage === "active"
                  ? "Recovery Sunday. No required work; missed work replaces lower-priority work on the next working day."
                  : position.stage === "before"
                    ? "Launch preparation: verify truthful materials and identify the first eligible roles."
                    : "Choose the next cycle from actual stages and failed-round repairs. The completed campaign remains available in This week."}
              </p>
              {position.stage === "before" && (
                <button
                  className="inline-action min-h-11"
                  onClick={() => navigate(plan.startDate)}
                >
                  Open 12 October launch day
                </button>
              )}
            </section>
          )}
          <DailyTimetable
            schedule={schedule}
            date={date}
            timeZone="Asia/Kolkata"
            title="Today's timetable"
            initiallyExpanded={false}
          />
        </div>
      )}
      {panel === "This week" && (
        <section className="space-y-4">
          <h2 className="font-display text-xl">
            Week {week.number} · {week.start}–{week.end}
          </h2>
          <p className="text-sm">
            Select a date to inspect another week. Reading assignments do not
            move historical chapters or complete the library.
          </p>
          {e.days
            .filter((d) => d.week === week.number)
            .map((d) => (
              <details
                key={d.id}
                className="rounded-xl border border-border p-4"
              >
                <summary className="cursor-pointer min-h-11 text-sm font-semibold">
                  {d.title}
                </summary>
                <div className="pt-3">{dayContent(d)}</div>
                <button
                  className="inline-action min-h-11 mt-3"
                  onClick={() => {
                    navigate(d.date);
                    choose("Today");
                  }}
                >
                  Open this day
                </button>
              </details>
            ))}
          <details className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer min-h-11 font-semibold text-sm">
              Saturday: exam, funnel, relocation and review
            </summary>
            <div className="space-y-4 pt-3">
              {Object.entries(
                datedAssignments(
                  e,
                  e.assessments.find(
                    (a) => a.id === "E" + String(week.number).padStart(2, "0"),
                  )!.date,
                ),
              ).map(([time, content]) => (
                <div key={time}>
                  <p className="font-semibold text-sm">{time} IST</p>
                  <RoadmapGuide content={content} context={context} />
                </div>
              ))}
            </div>
          </details>
          <h3 className="font-semibold">Weekly acceptance evidence</h3>
          <ul className="space-y-3">
            {week.items.map((item) => (
              <EvidenceItem
                key={item.id}
                item={item}
                state={state}
                onEvidence={onEvidence}
              />
            ))}
          </ul>
        </section>
      )}
      {panel === "Exams" && (
        <section className="space-y-4">
          <h2 className="font-display text-xl">Interview exams and retakes</h2>
          <p className="text-sm">
            Two passes on different prompts establish preparation readiness.
            Both practical tracks are required for full-stack readiness.
            Self-assessment stays labeled; actual employer stages and tool rules
            take precedence.
          </p>
          <button
            className="inline-action min-h-11"
            onClick={() => openGuide("exams")}
          >
            Open full exam guide and task fixtures
          </button>
          {e.rounds.map((round) => (
            <details
              key={round.id}
              className="rounded-xl border border-border p-4"
            >
              <summary className="min-h-11 cursor-pointer font-semibold text-sm">
                {round.title}
              </summary>
              <div className="space-y-4 pt-3">
                <p className="text-sm">
                  Pass ≥{round.passTotal}/{round.dimensions.length * 4}; every
                  dimension ≥2;{" "}
                  {round.minimum3.map((i) => round.dimensions[i]).join(" and ")}{" "}
                  ≥3. Any critical failure or overtime requires repair.
                </p>
                {(round.id === "R2"
                  ? ["frontend", "backend"]
                  : ["general"]
                ).map((track) => (
                  <p key={track} className="text-sm font-medium">
                    {track === "general" ? "Readiness" : track + " readiness"}:{" "}
                    {examReadiness(round, attempts, e.assessmentVersion, track)}
                  </p>
                ))}
                <RoadmapGuide content={round.content} context={context} />
                {onAttempt && (
                  <GermanyExamForm
                    round={round}
                    version={e.assessmentVersion}
                    onSave={onAttempt}
                  />
                )}
                <h4 className="font-semibold text-sm">Attempt history</h4>
                {attempts.filter((a) => a.roundId === round.id).length ? (
                  attempts
                    .filter((a) => a.roundId === round.id)
                    .map((a) => {
                      const result = scoreExam(round, a);
                      return (
                        <article
                          key={a.id}
                          className="rounded-lg bg-muted/30 p-3 space-y-2 text-sm"
                        >
                          <p className="font-semibold">
                            {a.promptVersion !== e.assessmentVersion
                              ? "Criteria changed · needs review"
                              : result.status === "passed"
                                ? `Passed · ${a.reviewerType === "self" ? "self-assessed" : "human reviewed"}${result.eligible ? "" : " · assisted practice"}`
                                : result.status === "repair"
                                  ? "Repair needed"
                                  : "Attempt recorded · unscored"}
                          </p>
                          <p>
                            {a.prompt} · {a.track} · {a.focusedMinutes} min ·{" "}
                            {result.total}/{round.dimensions.length * 4}
                          </p>
                          <p>
                            {new Date(a.startedAt).toLocaleString("en-GB", {
                              timeZone: "Asia/Kolkata",
                            })}{" "}
                            IST · {a.reviewer}
                          </p>
                          <p>{a.evidence}</p>
                          {a.criticalFailures && (
                            <p>Critical failure: {a.criticalFailures}</p>
                          )}
                          <p>
                            Next repair: {a.repair} · {a.retakeDate}
                          </p>
                          <details>
                            <summary className="min-h-11 cursor-pointer">
                              Dimension observations
                            </summary>
                            {round.dimensions.map((name, i) => (
                              <p key={name}>
                                {name}: {a.scores[i] ?? "unscored"} —{" "}
                                {a.reasons[i]}
                              </p>
                            ))}
                          </details>
                        </article>
                      );
                    })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No attempts recorded. A scheduled exam is pending until you
                    run and score it.
                  </p>
                )}
              </div>
            </details>
          ))}
          <h3 className="font-semibold">Wednesday and Saturday calendar</h3>
          <p className="text-sm">
            After week 1, a failed-round retake takes priority over a Wednesday
            checkpoint. Full loops use project and Friday practice blocks plus
            Saturday R3/R5/R6; the exam guide specifies the split.
          </p>
          {e.assessments.map((a) => (
            <details key={a.id} className="rounded-lg border border-border p-3">
              <summary className="min-h-11 cursor-pointer text-sm">
                {a.id} · {a.date} · {a.time} IST
              </summary>
              <RoadmapGuide content={a.content} />
              <button
                className="inline-action min-h-11 mt-2"
                onClick={() => {
                  navigate(a.date);
                  choose("Today");
                }}
              >
                Open this exam day
              </button>
            </details>
          ))}
        </section>
      )}
      {panel === "Companies" && (
        <section className="space-y-4">
          <h2 className="font-display text-xl">
            Companies and verified contact paths
          </h2>
          <p className="text-sm">
            Research reviewed {plan.reviewedOn}. Body read, indexed lead and
            board/watch describe source evidence. Check the complete role and
            eligibility on the submission day. Prepared drafts are separate from
            sent applications.
          </p>
          <label className="block text-sm">
            Find a company or requirement
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="block mt-1 w-full min-h-11 rounded-lg border border-border bg-background p-2"
            />
          </label>
          <button
            className="inline-action min-h-11"
            onClick={() => openGuide("campaign")}
          >
            Open outreach drafts and campaign calendar
          </button>
          {e.companies
            .filter((c) =>
              (c.title + " " + c.status + " " + c.action)
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((c) => (
              <article
                key={c.id}
                className="rounded-xl border border-border p-4 space-y-3"
              >
                <h3 className="font-semibold text-base">{c.id}</h3>
                <RoadmapGuide content={c.title} />
                <p className="text-xs text-muted-foreground">{c.status}</p>
                <RoadmapGuide content={c.action} />
                {onCompany && (
                  <GermanyCompanyForm
                    record={state.germanyCompanyRecords?.[c.id]}
                    onSave={(record) => onCompany(c.id, record)}
                  />
                )}
                <ul>
                  <EvidenceItem
                    item={evidence(
                      "germany:2026:company:" + c.id,
                      "Actual role, eligibility check and application/contact stage",
                    )}
                    state={state}
                    onEvidence={onEvidence}
                  />
                </ul>
              </article>
            ))}
        </section>
      )}
      {panel === "Guides" && (
        <section className="space-y-4">
          <h2 className="font-display text-xl">Detailed execution guides</h2>
          <p className="text-sm">
            Use these when you need the full method, task fixture, outreach
            wording or personal dependency. Daily assignments remain in Today
            and This week.
          </p>
          {e.guides.map((g) => (
            <details
              key={g.id + guide}
              open={g.id === guide}
              id={"germany-guide-" + g.id}
              className="rounded-xl border border-border p-4"
            >
              <summary className="min-h-11 cursor-pointer font-semibold">
                {g.title}
              </summary>
              <div className="pt-4">
                <RoadmapGuide content={g.content} context={context} />
              </div>
            </details>
          ))}
          <details className="rounded-xl border border-border p-4">
            <summary className="min-h-11 cursor-pointer font-semibold">
              Dated post drafts
            </summary>
            <div className="space-y-5 pt-3">
              {e.posts.map((p) => (
                <article key={p.id} className="space-y-2">
                  <h3 className="font-semibold text-sm">
                    {p.id} · {p.date} · {p.title}
                  </h3>
                  <RoadmapGuide content={p.content} />
                </article>
              ))}
            </div>
          </details>
          <details className="rounded-xl border border-border p-4">
            <summary className="min-h-11 cursor-pointer font-semibold">
              Weekly time budget and original strategy
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              {plan.allocations.map((a) => (
                <li key={a.label}>
                  {a.label}: {a.hours}h
                </li>
              ))}
            </ul>
            {plan.sections.map((s) => (
              <details
                key={s.title}
                className="border-t border-border mt-3 pt-3"
              >
                <summary className="min-h-11 cursor-pointer text-sm">
                  {s.title}
                </summary>
                <RoadmapGuide content={s.content} context={context} />
              </details>
            ))}
          </details>
        </section>
      )}
    </div>
  );
}
