import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Flag,
  Github,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { interviewReadySprint as sprint } from "@/data/interview-ready-sprint";

export default function InterviewSprint() {
  const phases = sprint.phases ?? [];
  const days = sprint.days ?? [];
  const gates = sprint.gates ?? [];
  return (
    <div className="career-stack" data-testid="interview-sprint">
      <div className="career-heading">
        <div>
          <p className="career-sprint-kicker">
            Interview sprint · defense {sprint.defenseDate}
          </p>
          <h2>{sprint.headline}</h2>
          <p className="career-help">{sprint.summary}</p>
        </div>
        <div className="career-actions">
          <a
            className="career-button career-button-primary"
            href={sprint.repositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} aria-hidden />
            RLS Rehearsal
            <ArrowUpRight size={16} aria-hidden />
          </a>
          <Link className="career-button" href="/roadmap?view=practice">
            Record practice
          </Link>
        </div>
      </div>

      <dl className="career-sprint-facts">
        <div>
          <dt>
            <Flag size={14} aria-hidden /> Income gate
          </dt>
          <dd>{sprint.triggerDate}</dd>
        </div>
        <div>
          <dt>
            <CalendarDays size={14} aria-hidden /> Ten-day sprint
          </dt>
          <dd>{sprint.sprintWindow}</dd>
        </div>
        <div>
          <dt>
            <ShieldCheck size={14} aria-hidden /> Defense
          </dt>
          <dd>{sprint.defenseDate}</dd>
        </div>
      </dl>

      <section className="career-sprint-phases" aria-label="Sprint phases">
        {phases.map((phase) => (
          <article className="career-sprint-phase" key={phase.id}>
            <header>
              <div>
                <p className="career-sprint-kicker">{phase.window}</p>
                <h3>{phase.label}</h3>
              </div>
              <span
                className="career-sprint-status"
                data-status={phase.status}
              >
                {phase.status === "active" ? "Active" : "Gated"}
              </span>
            </header>
            <p className="career-help">{phase.summary}</p>
            <ul>
              {(phase.points ?? []).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="career-stack" aria-labelledby="sprint-days-title">
        <div className="career-heading">
          <div>
            <h3 id="sprint-days-title">
              <ListChecks size={16} aria-hidden /> Ten working days
            </h3>
            <p className="career-help">
              Each day ends with a command, test or recording. If a day slips,
              cut the UI or metrics, not the isolation and atomicity checks.
            </p>
          </div>
        </div>
        <ol className="career-sprint-days">
          {days.map((day) => (
            <li className="career-sprint-day" key={day.day}>
              <span aria-hidden>{String(day.day).padStart(2, "0")}</span>
              <div>
                <h4>
                  <span>{day.date}</span> {day.build}
                </h4>
                <p className="career-help">{day.evidence}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="career-stack" aria-labelledby="sprint-gates-title">
        <h3 id="sprint-gates-title">Readiness gates</h3>
        <ol className="career-sprint-gates">
          {gates.map((gate) => (
            <li key={gate}>{gate}</li>
          ))}
        </ol>
      </section>

      <p className="career-banner">{sprint.frontendNote}</p>
      <p className="career-banner">{sprint.triggerNote}</p>
    </div>
  );
}
