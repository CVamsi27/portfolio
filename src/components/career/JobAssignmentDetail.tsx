import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  jobEvidenceStatus,
  jobProgress,
  type JobAssignment,
} from "@/lib/job-plan";
import type { CareerExecutionEntry } from "@/lib/career-roadmap";
import RoadmapGuide from "./RoadmapGuide";
export function assignmentHref(a: JobAssignment) {
  return `/roadmap?view=execution&panel=today&date=${a.date}&task=germany:2026:day:${a.date}&assignment=${encodeURIComponent(a.id)}#${a.id}`;
}
export default function JobAssignmentDetail({
  assignment: a,
  onGuide,
  recordLink = false,
}: {
  assignment: JobAssignment;
  onGuide?: (id: string) => void;
  recordLink?: boolean;
}) {
  const context = { date: a.date, task: `germany:2026:day:${a.date}`, onGuide };
  return (
    <div className="job-assignment-detail space-y-5">
      <RoadmapGuide content={a.brief} context={context} />
      <div>
        <h3 className="font-semibold text-sm mb-2">Steps</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          {a.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>
      <dl className="space-y-4 text-sm">
        {[
          ["Save", a.deliverable],
          ["Done when", a.doneCheck],
          ["Before starting", a.dependency],
          ["If blocked", a.blocked],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="font-semibold mb-1">{label}</dt>
            <dd>
              <RoadmapGuide content={value} context={context} />
            </dd>
          </div>
        ))}
      </dl>
      {recordLink && (
        <Link className="inline-action min-h-11" href={assignmentHref(a)}>
          Record assignment evidence
        </Link>
      )}
    </div>
  );
}
export function JobAssignmentRow({
  assignment: a,
  onGuide,
  children,
  open = false,
  recordLink = false,
  evidence,
}: {
  assignment: JobAssignment;
  evidence?: CareerExecutionEntry;
  onGuide?: (id: string) => void;
  children?: ReactNode;
  open?: boolean;
  recordLink?: boolean;
}) {
  return (
    <details
      id={a.id}
      data-testid={`assignment-${a.id}`}
      data-evidence-state={jobEvidenceStatus(evidence)}
      className="job-assignment-row group border-t border-border py-4 min-w-0"
      open={open || undefined}
    >
      <summary className="flex items-start gap-3 list-none [&::-webkit-details-marker]:hidden cursor-pointer min-h-11">
        <span className="block min-w-0 flex-1">
          <span className="block text-xs text-muted-foreground mb-1 tabular-nums">
            {a.range.replace("-", "–")} · {a.minutes} min
          </span>
          <strong className="block font-semibold">{a.title}</strong>
          <JobEvidenceLabel entry={evidence} />
          <span className="job-assignment-outcome block text-sm font-normal text-muted-foreground mt-1 leading-relaxed">
            {a.outcome}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className="h-4 w-4 shrink-0 mt-1 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="pt-5 space-y-5">
        <JobAssignmentDetail
          assignment={a}
          onGuide={onGuide}
          recordLink={recordLink}
        />
        {children}
      </div>
    </details>
  );
}

export function JobEvidenceLabel({ entry }: { entry?: CareerExecutionEntry }) {
  const status = jobEvidenceStatus(entry);
  return status === "planned" ? null : (
    <small className="block mt-1 text-xs font-medium text-primary">
      {status === "verified" ? "Verified" : "Evidence saved"}
    </small>
  );
}
export function JobProgressLabel({
  assignments,
  entries,
}: {
  assignments: JobAssignment[];
  entries: Record<string, CareerExecutionEntry> | undefined;
}) {
  const p = jobProgress(assignments, entries);
  return p.verified > 0 ? (
    <small className="block text-xs font-normal text-primary mt-1">
      {p.verified}/{p.total} verified
    </small>
  ) : p.saved > 0 ? (
    <small className="block text-xs font-normal text-muted-foreground mt-1">
      {p.saved} evidence saved
    </small>
  ) : null;
}
