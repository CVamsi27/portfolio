import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Flag,
  Github,
  ListChecks,
  ShieldCheck,
  Target,
  Timer,
} from "lucide-react";
import { interviewReadySprint as sprint } from "@/data/interview-ready-sprint";

const statusCopy = {
  active: "Active",
  gated: "Gated",
  next: "Next",
} as const;

export default function InterviewSprint() {
  const stages = sprint.stages ?? [];
  const days = sprint.days ?? [];
  const gates = sprint.gates ?? [];
  const blocks = sprint.cadence?.blocks ?? [];
  const targets = sprint.targets ?? [];
  return (
    <div className="career-stack" data-testid="interview-sprint">
      <div className="career-heading">
        <div>
          <p className="career-sprint-kicker">
            Six-stage roadmap · defense {sprint.defenseDate}
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
            <CalendarDays size={14} aria-hidden /> Gated sprint
          </dt>
          <dd>{sprint.sprintWindow}</dd>
        </div>
        <div>
          <dt>
            <Timer size={14} aria-hidden /> Weekly capacity
          </dt>
          <dd>{sprint.weeklyCapacity}</dd>
        </div>
        <div>
          <dt>
            <ShieldCheck size={14} aria-hidden /> Defense
          </dt>
          <dd>{sprint.defenseDate}</dd>
        </div>
      </dl>

      <section className="career-sprint-stages" aria-label="Six-stage roadmap">
        {stages.map((stage) => (
          <article className="career-sprint-phase" key={stage.id}>
            <header>
              <div>
                <p className="career-sprint-kicker">
                  Stage {stage.number} · {stage.window}
                </p>
                <h3>{stage.label}</h3>
              </div>
              <span
                className="career-sprint-status"
                data-status={stage.status}
              >
                {statusCopy[stage.status]}
              </span>
            </header>
            <p className="career-help">{stage.summary}</p>
            <ul>
              {(stage.points ?? []).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="career-sprint-exit">
              <strong>Exit:</strong> {stage.exit}
            </p>
          </article>
        ))}
      </section>

      <section className="career-stack" aria-labelledby="sprint-cadence-title">
        <div className="career-heading">
          <div>
            <h3 id="sprint-cadence-title">
              <Timer size={16} aria-hidden /> {sprint.cadence.headline}
            </h3>
            <p className="career-help">{sprint.cadence.note}</p>
          </div>
        </div>
        <dl className="career-sprint-cadence">
          {blocks.map((block, index) => (
            <div key={`${block.days}-${index}`}>
              <dt>
                {block.days}
                <span>{block.time}</span>
              </dt>
              <dd>{block.work}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="career-stack" aria-labelledby="sprint-targets-title">
        <h3 id="sprint-targets-title">
          <Target size={16} aria-hidden /> Weekly funnel targets
        </h3>
        <ul className="career-sprint-targets">
          {targets.map((target) => (
            <li key={target.label}>
              <strong>{target.value}</strong>
              <span>{target.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="career-stack" aria-labelledby="sprint-days-title">
        <div className="career-heading">
          <div>
            <h3 id="sprint-days-title">
              <ListChecks size={16} aria-hidden /> Ten working days · gated
              sprint
            </h3>
            <p className="career-help">
              Each day ends with a command, test or recording. If a day slips,
              cut the UI or metrics, not the isolation and rollback checks.
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
