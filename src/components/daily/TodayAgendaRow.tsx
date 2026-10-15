import type { ReactNode } from "react";
import { ChevronDown, Circle, Clock } from "lucide-react";
import type { AgendaItem } from "@/lib/day-plan";

const labels: Record<AgendaItem["kind"], string> = {
  task: "Task",
  study: "Study",
  exercise: "Exercise",
  event: "Personal",
  meal: "Meal",
  supplement: "Supplement",
};

export default function TodayAgendaRow({
  row,
  timeZone,
  status,
  outcome,
  evidenceStatus,
  children,
}: {
  row: AgendaItem;
  timeZone: string;
  status: string;
  outcome?: string;
  evidenceStatus?: "planned" | "saved" | "verified";
  children: ReactNode;
}) {
  const formatTime = (at: number) =>
    new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).format(at);
  return (
    <li className="nova-agenda-row">
      <div className="nova-agenda-time">
        <time dateTime={new Date(row.at).toISOString()}>
          {formatTime(row.at)}
        </time>
        {row.durationMinutes ? <small>{row.durationMinutes} min</small> : null}
      </div>
      <details className="nova-agenda-details">
        <summary>
          <Circle className="nova-agenda-marker" aria-hidden />
          <span className="nova-agenda-label">
            <strong>{row.title}</strong>
            <small className={outcome ? "nova-agenda-outcome" : undefined}>
              {outcome ?? `${labels[row.kind]} · ${status}`}
              {row.block?.id.startsWith("owner:")
                ? " · Bible timetable (IST)"
                : ""}
            </small>
            {evidenceStatus && evidenceStatus !== "planned" && (
              <small className="text-primary">
                {evidenceStatus === "verified" ? "Verified" : "Evidence saved"}
              </small>
            )}
          </span>
          <ChevronDown className="nova-agenda-chevron" aria-hidden />
        </summary>
        <div className="nova-agenda-expanded">
          {row.durationMinutes ? (
            <p className="nova-agenda-range">
              <Clock className="h-4 w-4" aria-hidden />
              {formatTime(row.at)}–
              {formatTime(row.at + row.durationMinutes * 60000)}
            </p>
          ) : null}
          {children}
        </div>
      </details>
    </li>
  );
}
