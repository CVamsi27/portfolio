"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  FileUp,
  Plus,
  ArrowUpRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { useCareerWorkflow } from "@/lib/career-workflow-store";
import {
  newOpportunity,
  availabilityNeedsReview,
  CAREER_STAGES,
} from "@/lib/career-workflow";
import { useNow } from "@/lib/tracker-store";
import { zonedDate } from "@/lib/routine-reminders";
import { isCalendarDate } from "@/lib/personal-timetable";
import {
  CAREER_QUEUE_VIEWS,
  CAREER_QUEUE_LABELS,
  CAREER_STAGE_LABELS,
  careerQueueCounts,
  matchesCareerQueue,
  type CareerQueueView,
} from "@/lib/career-queue";
import ResearchImport from "./ResearchImport";
import OpportunityForm from "./OpportunityForm";
import OpportunityDetail from "./OpportunityDetail";
import OpportunityBrief from "./OpportunityBrief";
import CareerPractice from "./CareerPractice";
import CareerWeeklyReview from "./CareerWeeklyReview";
import "@/app/career-workflow.css";
import "@/app/career-desk.css";

export type CareerView = "opportunities" | "practice" | "weekly-review";
const viewLabels: Record<CareerView, string> = {
  opportunities: "Opportunities",
  practice: "Practice",
  "weekly-review": "Weekly review",
};

export default function CareerWorkspace({
  view,
  onView,
}: {
  view: CareerView;
  onView: (view: CareerView) => void;
}) {
  const workflow = useCareerWorkflow();
  const params = useSearchParams();
  const today = zonedDate(useNow(60_000), "Asia/Kolkata");
  const selectedDate = params.get("date");
  const reviewDate =
    selectedDate && isCalendarDate(selectedDate) ? selectedDate : today;
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const query = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    // These are local views, not server navigation. Keep controls synchronous
    // and preserve keyboard focus while Next observes the URL update.
    window.history.replaceState(null, "", `/roadmap?${next}`);
  };
  const roles = Object.values(workflow.research.value).filter(
    (role) => !role.deleted,
  );
  const selectedRole = roles.find((role) => role.id === params.get("role"));
  const records = workflow.opportunities.value;
  const events = workflow.activities.value;
  const due = roles.filter((role) =>
    matchesCareerQueue(
      role,
      records[role.id] ?? newOpportunity(role, 0),
      today,
      "followups",
    ),
  ).length;
  const total = roles.filter((role) => !records[role.id]?.deleted).length;
  const search = params.get("q") ?? "",
    kind = params.get("kind") ?? "all",
    stage = params.get("stage") ?? "all",
    location = params.get("location") ?? "all",
    eligibility = params.get("eligibility") ?? "all",
    followUp = params.get("follow-up") === "due";
  const queue = CAREER_QUEUE_VIEWS.includes(
    params.get("queue") as CareerQueueView,
  )
    ? (params.get("queue") as CareerQueueView)
    : "all";
  const scopedRoles = roles.filter((role) => {
    const opportunity = records[role.id] ?? newOpportunity(role, 0);
    return (
      (!search.trim() ||
        `${role.company} ${role.title} ${role.location} ${opportunity.nextAction}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())) &&
      (location === "all" ||
        (location === "remote"
          ? /remote/i.test(role.location)
          : /hyderabad/i.test(role.location)))
    );
  });
  const queueCounts = careerQueueCounts(
    Object.fromEntries(scopedRoles.map((role) => [role.id, role])),
    records,
    today,
  );
  const hasFilters = Boolean(
    search.trim() ||
      queue !== "all" ||
      kind !== "all" ||
      stage !== "all" ||
      location !== "all" ||
      eligibility !== "all" ||
      followUp,
  );
  const visibleRoles = scopedRoles
    .filter((role) => {
      const opportunity = records[role.id] ?? newOpportunity(role, 0);
      return (
        !opportunity.deleted &&
        matchesCareerQueue(role, opportunity, today, queue) &&
        (kind === "all" || role.kind === kind) &&
        (stage === "all" || opportunity.stage === stage) &&
        (eligibility === "all" || role.eligibility === eligibility) &&
        (!followUp || matchesCareerQueue(role, opportunity, today, "followups"))
      );
    })
    .sort(
      (a, b) =>
        (records[a.id]?.priority ?? a.rank) -
          (records[b.id]?.priority ?? b.rank) ||
        a.company.localeCompare(b.company),
    );
  const unavailable = [
    workflow.research.status,
    workflow.opportunities.status,
    workflow.activities.status,
  ].some((status) => status === "error");
  const preview =
    visibleRoles.find((role) => role.id === params.get("brief")) ??
    visibleRoles[0];
  return (
    <div className="career-workflow" data-testid="career-workflow">
      <div className="career-toolbar">
        <nav className="career-tabs" aria-label="Career views">
          {(Object.keys(viewLabels) as CareerView[]).map((item) => (
            <button
              key={item}
              aria-pressed={view === item}
              onClick={() => onView(item)}
            >
              {viewLabels[item]}
            </button>
          ))}
        </nav>
        <Link
          className="career-button career-today-shortcut"
          href={`/hub?date=${today}`}
        >
          Today&apos;s actions <ArrowUpRight size={16} aria-hidden />
        </Link>
      </div>
      {!workflow.enabled && (
        <p role="status" className="career-banner">
          Career records are read-only on this signed-in release. Writing
          becomes available after the database migration and cloud verification
          are enabled. Your existing research remains readable.
        </p>
      )}
      {unavailable && (
        <p role="alert" className="career-banner">
          Cloud sync could not finish. Local records remain available. Check
          your connection and retry from Settings before assuming another device
          is up to date.
        </p>
      )}
      {notice && (
        <p role="status" className="career-banner">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="career-error">
          {error}
        </p>
      )}
      {view === "opportunities" && (
        <>
          <div className="career-heading career-queue-heading">
            <div>
              <h2 className={roles.length ? "sr-only" : undefined}>
                Your opportunity queue
              </h2>
              <p className="career-queue-summary">
                {total} opportunities · {due} follow-ups due
              </p>
            </div>
            <div className="career-actions">
              <button
                className="career-button career-button-quiet"
                onClick={() => query({ import: "1" })}
              >
                <FileUp size={16} aria-hidden />
                Import research
              </button>
              <button
                className="career-button career-button-primary"
                disabled={!workflow.enabled}
                onClick={() => query({ add: "1" })}
              >
                <Plus size={16} aria-hidden />
                Add an opportunity
              </button>
            </div>
          </div>
          {roles.length > 0 ? (
            <>
              <nav
                className="career-queue-views"
                aria-label="Opportunity views"
              >
                {CAREER_QUEUE_VIEWS.map((view) => (
                  <button
                    key={view}
                    className="career-button career-queue-chip"
                    aria-label={CAREER_QUEUE_LABELS[view]}
                    aria-describedby={`queue-count-${view}`}
                    aria-pressed={queue === view}
                    onClick={() =>
                      query({
                        queue: view === "all" ? null : view,
                        kind: null,
                        stage: null,
                        eligibility: null,
                        "follow-up": null,
                      })
                    }
                  >
                    <span>{CAREER_QUEUE_LABELS[view]}</span>
                    <span
                      id={`queue-count-${view}`}
                      className="career-queue-count"
                    >
                      {queueCounts[view]}
                      <span className="sr-only"> opportunities</span>
                    </span>
                  </button>
                ))}
              </nav>
              <div className="career-filterbar">
                <div className="career-primary-filters">
                  <label className="career-label career-search">
                    <span className="sr-only">Search opportunities</span>
                    <Search size={17} aria-hidden />
                    <input
                      className="career-input"
                      type="search"
                      value={search}
                      onChange={(e) => query({ q: e.target.value })}
                      placeholder="Search company, role or location"
                    />
                  </label>
                  <label className="career-label">
                    <span className="sr-only">Opportunity type</span>
                    <select
                      className="career-input"
                      value={kind}
                      onChange={(e) =>
                        query({ kind: e.target.value, queue: null })
                      }
                    >
                      <option value="all">All types</option>
                      <option value="employment">Employment</option>
                      <option value="contract">Contracts</option>
                    </select>
                  </label>
                </div>
                <details
                  className="career-resources"
                  open={
                    stage !== "all" ||
                    location !== "all" ||
                    eligibility !== "all" ||
                    followUp ||
                    undefined
                  }
                >
                  <summary>
                    More filters <ChevronDown size={15} aria-hidden />
                  </summary>
                  <div className="career-filters">
                    <label className="career-label">
                      Actual stage
                      <select
                        className="career-input"
                        value={stage}
                        onChange={(e) =>
                          query({ stage: e.target.value, queue: null })
                        }
                      >
                        <option value="all">All stages</option>
                        {CAREER_STAGES.map((item) => (
                          <option key={item} value={item}>
                            {CAREER_STAGE_LABELS[item]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="career-label">
                      Work location
                      <select
                        className="career-input"
                        value={location}
                        onChange={(e) => query({ location: e.target.value })}
                      >
                        <option value="all">All locations</option>
                        <option value="remote">Remote</option>
                        <option value="hyderabad">Hyderabad</option>
                      </select>
                    </label>
                    <label className="career-label">
                      Eligibility filter
                      <select
                        className="career-input"
                        value={eligibility}
                        onChange={(e) =>
                          query({ eligibility: e.target.value, queue: null })
                        }
                      >
                        <option value="all">All eligibility states</option>
                        <option value="eligible">Eligible</option>
                        <option value="clarify">Needs clarification</option>
                        <option value="ineligible">Ineligible</option>
                      </select>
                    </label>
                    <label className="career-actions text-sm min-h-11">
                      <input
                        type="checkbox"
                        checked={followUp}
                        onChange={(e) =>
                          query({
                            "follow-up": e.target.checked ? "due" : null,
                            queue: null,
                          })
                        }
                      />
                      Follow-ups due
                    </label>
                  </div>
                </details>
              </div>
              {hasFilters && (
                <div className="career-toolbar career-results">
                  <p className="career-help" role="status">
                    {visibleRoles.length} matching opportunities
                  </p>
                  <button
                    className="career-button career-button-quiet"
                    onClick={() =>
                      query({
                        q: null,
                        kind: null,
                        stage: null,
                        location: null,
                        eligibility: null,
                        "follow-up": null,
                        queue: null,
                      })
                    }
                  >
                    Clear filters
                  </button>
                </div>
              )}
              {preview ? (
                <div className="career-desk">
                  <div className="career-list career-index">
                    <div className="career-index-caption" aria-hidden>
                      Role index
                    </div>
                    {visibleRoles.map((role) => {
                      const opportunity =
                        records[role.id] ?? newOpportunity(role, 0);
                      return (
                        <article
                          className="career-row"
                          key={role.id}
                          data-preview={preview.id === role.id}
                        >
                          <button
                            className="career-preview-entry"
                            aria-label={`Preview ${role.company} ${role.title}`}
                            aria-controls="career-role-brief"
                            aria-pressed={preview.id === role.id}
                            onClick={() => query({ brief: role.id })}
                          >
                            <span className="career-index-priority">
                              {opportunity.priority}
                            </span>
                            <span className="career-index-label">
                              <strong>{role.company}</strong>
                              <span>{role.title}</span>
                              <small>
                                {CAREER_STAGE_LABELS[opportunity.stage]}
                              </small>
                            </span>
                          </button>
                          <button
                            className="career-open"
                            aria-label={`Open ${role.company} ${role.title}`}
                            onClick={() =>
                              query({ role: role.id, brief: role.id })
                            }
                          >
                            <span className="career-entry-label">
                              <strong>{role.company}</strong>
                              <span>{role.title}</span>
                              <small className="career-help">
                                {role.location} ·{" "}
                                {role.kind === "contract"
                                  ? "Contract"
                                  : "Employment"}
                              </small>
                            </span>
                            <ArrowUpRight
                              size={16}
                              className="career-entry-arrow"
                              aria-hidden
                            />
                          </button>
                          <div className="career-row-meta">
                            <span
                              className={`career-badge ${role.eligibility === "eligible" ? "career-badge-positive" : "career-badge-warning"}`}
                            >
                              {role.eligibility === "clarify"
                                ? "Clarify eligibility"
                                : role.eligibility === "eligible"
                                  ? "Eligible"
                                  : "Not eligible"}
                            </span>
                            <small className="career-help">
                              {role.availability} ·{" "}
                              {availabilityNeedsReview(role, today)
                                ? "Recheck source"
                                : `Checked ${role.checkedOn}`}
                            </small>
                          </div>
                          <div className="career-row-meta">
                            <span className="career-stage">
                              {CAREER_STAGE_LABELS[opportunity.stage]}
                            </span>
                            {opportunity.followUpOn && (
                              <small className="career-help">
                                Follow up {opportunity.followUpOn}
                              </small>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <OpportunityBrief
                    role={preview}
                    opportunity={
                      records[preview.id] ?? newOpportunity(preview, 0)
                    }
                    today={today}
                    onOpen={() =>
                      query({ role: preview.id, brief: preview.id })
                    }
                  />
                </div>
              ) : (
                <section className="career-empty">
                  <h3>No opportunities match these filters</h3>
                  <p className="career-help">
                    Clear a filter or add a specific role or client brief.
                  </p>
                </section>
              )}
            </>
          ) : (
            <section className="career-empty">
              <Briefcase size={24} className="text-primary" aria-hidden />
              <h3>Start with a reviewed shortlist</h3>
              <p className="career-help">
                Import the career-ops research snapshot or add one exact
                opening. You can begin without a study plan. Nothing is applied
                for automatically.
              </p>
              <p className="career-help">
                Keep uncertain eligibility in clarification. Record an
                application only after sending it yourself.
              </p>
            </section>
          )}
        </>
      )}
      {view === "practice" && (
        <CareerPractice roles={roles} enabled={workflow.enabled} />
      )}
      {view === "weekly-review" && (
        <CareerWeeklyReview
          research={workflow.research.value}
          opportunities={records}
          activities={events}
          today={reviewDate}
        />
      )}
      {workflow.research.status === "local-only" && (
        <p className="career-help">
          Local workspace · records stay in this browser. Export a backup in
          Settings to keep a copy.
        </p>
      )}
      <details className="career-resources">
        <summary>
          Resources <ChevronDown size={15} aria-hidden />
        </summary>
        <div className="career-stack">
          <div className="career-actions">
            <Link className="career-button" href="/roadmap?view=curriculum">
              Curriculum reference
            </Link>
            <Link className="career-button" href="/roadmap?view=plan">
              Career plan guide
            </Link>
            <Link
              className="career-button"
              href="/roadmap?view=execution&panel=today"
            >
              Dated assignments and history
            </Link>
            <Link
              className="career-button"
              href="/roadmap?view=execution&panel=exams"
            >
              Assessments
            </Link>
            <Link className="career-button" href="/roadmap?view=germany">
              Relocation guidance
            </Link>
            <Link className="career-button" href="/settings#backup">
              Backup and sync
            </Link>
          </div>
          <p className="career-help">
            Existing stage import matches exact role URLs only. Ambiguous
            records remain in the original history.
          </p>
          <button
            className="career-button"
            disabled={!workflow.enabled}
            onClick={() => {
              try {
                const result = workflow.adaptLegacy();
                setNotice(
                  `${result.matched} existing stages imported. ${result.unmatched.length} unmatched records retained in history.`,
                );
                setError("");
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Existing stages could not be imported.",
                );
              }
            }}
          >
            Import existing stages
          </button>
        </div>
      </details>
      {params.get("import") === "1" && (
        <ResearchImport
          open
          research={workflow.research.value}
          enabled={workflow.enabled}
          onClose={() => query({ import: null })}
          onImport={(snapshot, ids) => {
            workflow.importSnapshot(snapshot, ids);
            setNotice("Selected research imported. Actual activity unchanged.");
          }}
        />
      )}
      {params.get("add") === "1" && (
        <OpportunityForm
          open
          today={today}
          enabled={workflow.enabled}
          onClose={() => query({ add: null })}
          onSave={(role) => {
            workflow.addManualRole(role);
            setNotice("Opportunity added. Nothing sent.");
          }}
        />
      )}
      {selectedRole && (
        <OpportunityDetail
          key={selectedRole.id}
          role={selectedRole}
          opportunity={
            records[selectedRole.id] ?? newOpportunity(selectedRole, 0)
          }
          activities={Object.values(events)
            .filter(
              (activity) =>
                !activity.deleted && activity.opportunityId === selectedRole.id,
            )
            .sort(
              (a, b) =>
                b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt,
            )}
          today={today}
          enabled={workflow.enabled}
          onClose={() => query({ role: null, brief: selectedRole.id })}
          onSave={workflow.saveOpportunity}
          onActivity={workflow.addActivity}
          onResearchCheck={(check) =>
            workflow.saveResearchCheck(selectedRole.id, check)
          }
        />
      )}
      {params.get("role") && !selectedRole && (
        <p role="status" className="career-help">
          This opportunity is not in the current research. Import its source or
          choose another role.
        </p>
      )}
    </div>
  );
}
