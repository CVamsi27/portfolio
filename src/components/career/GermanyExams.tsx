"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  examTrend,
  examTimeLimit,
  examReadiness,
  scoreExam,
  type GermanyExecution,
  type GermanyExamAttempt,
} from "@/lib/germany-execution";
import TrendChart from "@/components/progress/TrendChart";
import GermanyExamForm from "./GermanyExamForm";
import RoadmapGuide from "./RoadmapGuide";
import Modal from "@/components/trackers/Modal";
import { progressDates } from "@/lib/personal-progress";
import { zonedDate } from "@/lib/routine-reminders";
import { useNow } from "@/lib/tracker-store";

export default function GermanyExams({
  execution: e,
  attempts,
  onAttempt,
  onBack,
}: {
  execution: GermanyExecution;
  attempts: GermanyExamAttempt[];
  onAttempt?: (attempt: GermanyExamAttempt) => void;
  onBack: () => void;
}) {
  const params = useSearchParams();
  const now = useNow(60_000);
  const [dirty, setDirty] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const [pending, setPending] = useState<{
    id: string;
    track: string;
    back?: boolean;
    close?: boolean;
  } | null>(null);
  const [range, setRange] = useState(30);
  const [roundId, setRound] = useState(
    params.get("round") || e.rounds[0]?.id || "R0",
  );
  const [selectedTrack, setTrack] = useState(params.get("track") || "frontend");
  const round = e.rounds.find((r) => r.id === roundId) ?? e.rounds[0];
  if (!round) return <p>No exam rubric is available for this plan.</p>;
  const track =
    round.id === "R2"
      ? selectedTrack === "backend"
        ? "backend"
        : "frontend"
      : "general";
  const history = [...attempts]
    .reverse()
    .filter((a) => a.roundId === round.id && a.track === track)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const current = history.filter(
    (a) => a.promptVersion === e.assessmentVersion,
  );
  const latest = current[0];
  const dates = progressDates(zonedDate(now, "Asia/Kolkata"), range);
  const readings = new Map(
    examTrend(round, attempts, e.assessmentVersion, track).map((point) => [
      point.date,
      point.value,
    ]),
  );
  const hasScores = dates.some((date) => readings.has(date));
  const applySelection = (id: string, nextTrack = selectedTrack) => {
    setRound(id);
    setTrack(nextTrack);
    const url = new URL(window.location.href);
    url.searchParams.set("round", id);
    url.searchParams.set("track", id === "R2" ? nextTrack : "general");
    window.history.replaceState(null, "", url);
  };
  const transition = (next: {
    id: string;
    track: string;
    back?: boolean;
    close?: boolean;
  }) => {
    if (dirty) {
      setPending(next);
      return;
    }
    if (next.back) onBack();
    else if (next.close) setEditorRevision((value) => value + 1);
    else applySelection(next.id, next.track);
  };
  const update = (id: string, nextTrack = selectedTrack) =>
    transition({ id, track: nextTrack });
  return (
    <section data-testid="germany-exams" className="space-y-5 min-w-0">
      <section
        className={`workspace-progress-lead${!hasScores ? " is-empty" : ""}`}
        aria-label="Exam score progress"
      >
        <div className="workspace-progress-heading">
          <h2>{`${round.id} · Exam scores`}</h2>
          <div className="workspace-progress-controls">
            <span className="text-sm text-muted-foreground">
              {track} · Current rubric
            </span>
            <label>
              Range
              <select
                value={range}
                onChange={(event) => setRange(Number(event.target.value))}
              >
                {[7, 30, 90].map((days) => (
                  <option value={days} key={days}>
                    {days} days
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {hasScores && (
          <>
            {" "}
            <TrendChart
              points={dates.map((date) => ({
                date,
                value: readings.get(date) ?? null,
              }))}
              label={`${round.id} ${track} score`}
              unit={`points / ${round.dimensions.length * 4}`}
              domain={{ min: 0, max: round.dimensions.length * 4 }}
            />
            <p className="text-sm text-muted-foreground">
              Latest eligible score per date. Assisted practice and older
              rubrics stay in history.
            </p>
          </>
        )}
        {!hasScores && (
          <p className="text-sm text-muted-foreground">
            Log an eligible score to start this chart.
          </p>
        )}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="inline-action"
          onClick={() => transition({ id: round.id, track, back: true })}
        >
          Back to Career
        </button>
      </div>
      <div className="exam-rounds" role="group" aria-label="Exam round">
        {e.rounds.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={round.id === r.id}
            onClick={() => update(r.id)}
          >
            {r.id}
          </button>
        ))}
      </div>
      <div className="workspace-heading">
        <div>
          <h3 className="font-semibold">{round.title}</h3>
          <p className="text-sm text-muted-foreground">
            {examTimeLimit(round.id)} minute limit ·{" "}
            {["R2", "R4"].includes(round.id)
              ? "Official docs allowed"
              : "Unaided runtime"}
          </p>
        </div>
        {round.id === "R2" && (
          <label className="field-label">
            Track
            <select
              value={track}
              onChange={(event) => update(round.id, event.target.value)}
            >
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
            </select>
          </label>
        )}
      </div>
      <section className="workspace-panel space-y-3">
        <h3 className="font-semibold">
          {latest && scoreExam(round, latest).status === "repair"
            ? "Repair before the retake"
            : "Next attempt"}
        </h3>
        <p>{examReadiness(round, attempts, e.assessmentVersion, track)}</p>
        {latest?.repair && (
          <p className="text-sm">
            {latest.repair}
            {latest.retakeDate ? ` · Retake ${latest.retakeDate}` : ""}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Use a changed prompt. A total alone does not establish a pass.
        </p>
        {onAttempt && (
          <GermanyExamForm
            key={`${round.id}:${track}:${editorRevision}`}
            round={round}
            version={e.assessmentVersion}
            initialTrack={track}
            onSave={onAttempt}
            onDirtyChange={setDirty}
            onCancel={() => transition({ id: round.id, track, close: true })}
          />
        )}
      </section>
      <details className="workspace-disclosure">
        <summary>Rubric & prompt guide</summary>
        <p className="text-sm py-3">
          Pass ≥{round.passTotal}/{round.dimensions.length * 4}; every dimension
          ≥2; {round.minimum3.map((i) => round.dimensions[i]).join(" and ")} ≥3.
          Critical failures and overtime require repair.
        </p>
        <RoadmapGuide content={round.content} />
      </details>
      <details className="workspace-disclosure">
        <summary>Attempt history · {history.length}</summary>
        {history.length ? (
          history.map((a) => {
            const result = scoreExam(round, a);
            return (
              <article key={a.id} className="exam-history-row">
                <h3>
                  {a.promptVersion !== e.assessmentVersion
                    ? "Criteria changed · review earlier attempt"
                    : result.status === "passed"
                      ? `Passed · ${a.reviewerType === "self" ? "Self-assessed" : "Human reviewed"}${result.eligible ? "" : " · Assisted practice"}`
                      : result.status === "repair"
                        ? "Repair needed"
                        : "Unscored"}
                </h3>
                <p className="text-sm">
                  {a.prompt} · {a.focusedMinutes} min · {result.total}/
                  {round.dimensions.length * 4}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(a.startedAt).toLocaleString("en-GB", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST · {a.reviewer}
                </p>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {a.evidence}
                </p>
                {a.criticalFailures && (
                  <p className="text-sm">
                    Critical failure: {a.criticalFailures}
                  </p>
                )}
                <p className="text-sm">
                  Repair: {a.repair} · {a.retakeDate}
                </p>
                <details>
                  <summary className="min-h-11">Dimension observations</summary>
                  {round.dimensions.map((name, i) => (
                    <p className="text-sm" key={name}>
                      {name}: {a.scores[i] ?? "Unscored"} — {a.reasons[i]}
                    </p>
                  ))}
                </details>
              </article>
            );
          })
        ) : (
          <p className="text-sm py-4 text-muted-foreground">
            No attempts recorded for this round and track.
          </p>
        )}
      </details>
      <details className="workspace-disclosure">
        <summary>Assessment calendar</summary>
        {e.assessments.map((a) => (
          <details key={a.id} className="py-3">
            <summary className="min-h-11">
              {a.id} · {a.date} · {a.time} IST
            </summary>
            <RoadmapGuide content={a.content} />
          </details>
        ))}
      </details>
      <Modal
        open={Boolean(pending)}
        title="Discard unsaved attempt?"
        onClose={() => setPending(null)}
      >
        <p className="text-sm">Your attempt has not been saved.</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            type="button"
            className="inline-action"
            onClick={() => setPending(null)}
          >
            Keep editing
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => {
              const next = pending;
              setPending(null);
              setDirty(false);
              if (!next) return;
              if (next.back) onBack();
              else if (next.close) setEditorRevision((value) => value + 1);
              else applySelection(next.id, next.track);
            }}
          >
            Discard draft
          </button>
        </div>
      </Modal>
    </section>
  );
}
