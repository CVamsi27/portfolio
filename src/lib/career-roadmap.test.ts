import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPlannerTodos, canCompleteEvidence, mergeCareerReminders, mergeExecutionState, validateSeedPayload } from "./career-roadmap.ts";
import type { CareerCurriculum } from "./career-roadmap.ts";

describe("career roadmap state", () => {
  it("preserves evidence on matching IDs and archives removed items", () => {
    const previous = {
      version: 1 as const,
      evidenceByItemId: {
        "career:2026-09-30:study": {
          evidence: { value: "Notes include five ideas and a question." },
          completedAt: "2026-09-30T10:00:00+05:30",
          verifiedAt: "2026-09-30T10:05:00+05:30",
        },
        "career:2026-09-30:obsolete": {
          evidence: { value: "Old note remains archived." },
          completedAt: "2026-09-30T10:00:00+05:30",
        },
      },
      archivedItems: [],
    };
    const next = mergeExecutionState(previous, ["career:2026-09-30:study", "career:2026-10-01:study"], "2026-09-30T11:00:00+05:30");
    assert.equal(next.evidenceByItemId["career:2026-09-30:study"].evidence.value, "Notes include five ideas and a question.");
    assert.equal(next.evidenceByItemId["career:2026-09-30:study"].verifiedAt, "2026-09-30T10:05:00+05:30");
    assert.equal(next.evidenceByItemId["career:2026-09-30:obsolete"], undefined);
    assert.deepEqual(next.archivedItems, [{ id: "career:2026-09-30:obsolete", archivedAt: "2026-09-30T11:00:00+05:30", reason: "Removed from generated curriculum" }]);
  });

  it("retains legacy checkbox claims without promoting them to evidence", () => {
    const previous = { version: 1 as const, evidenceByItemId: {}, archivedItems: [], legacyClaims: [{ id: "old-check", date: "2026-09-29", text: "Old checked task", claimedDone: true as const }] };
    const next = mergeExecutionState(previous, ["new-item"]);
    assert.deepEqual(next.legacyClaims, previous.legacyClaims);
    assert.deepEqual(next.evidenceByItemId, {});
  });

  it("preserves non-roadmap todos and completed planner todos on reseed", () => {
    const merged = buildPlannerTodos({ days: [{ day: 1, date: "2026-09-30", title: "Day 1" }] }, [
      { id: "personal-1", text: "Call family", done: false },
      { id: "career-plan:2026-09-30", text: "Old Day 1", done: true },
    ]);
    assert.deepEqual(merged[0], { id: "personal-1", text: "Call family", done: false });
    assert.equal(merged[1].id, "career-plan:2026-09-30");
    assert.equal(merged[1].done, true);
    assert.equal(merged[1].text, "[Day 1] Day 1");
  });

  it("requires usable evidence before completion", () => {
    assert.equal(canCompleteEvidence({ evidenceType: "commit" }, { value: "" }), false);
    assert.equal(canCompleteEvidence({ evidenceType: "commit" }, { value: "https://github.com/CVamsi27/demo/commit/0123456789abcdef0123456789abcdef01234567" }), true);
    assert.equal(canCompleteEvidence({ evidenceType: "note" }, { value: "too short" }), false);
    assert.equal(canCompleteEvidence({ evidenceType: "note" }, { value: "A sufficiently detailed note with an insight, evidence, and a concrete next step." }), true);
    assert.equal(canCompleteEvidence({ evidenceType: "manual-confirmation" }, { value: "Confirmed", confirmed: false }), false);
    assert.equal(canCompleteEvidence({ evidenceType: "manual-confirmation" }, { value: "Confirmed", confirmed: true }), true);
  });

  it("adds career reminders without resetting existing choices", () => {
    const merged = mergeCareerReminders({ morning: { enabled: true, time: "07:15" }, customSlot: { enabled: true, time: "18:00" } });
    assert.deepEqual(merged.morning, { enabled: true, time: "07:15" });
    assert.deepEqual(merged.study, { enabled: false, time: "10:25" });
    assert.deepEqual(merged.customSlot, { enabled: true, time: "18:00" });
  });

  it("requires a company and source reference for application evidence", () => {
    assert.equal(canCompleteEvidence({ evidenceType: "application" }, { value: "Submitted" }), false);
    assert.equal(canCompleteEvidence({ evidenceType: "application" }, { value: "Company: Acme; application ID: A-102" }), true);
    assert.equal(canCompleteEvidence({ evidenceType: "application" }, { value: "Company: Acme", sourceUrl: "https://jobs.example.test/role" }), true);
  });

  it("rejects a seed payload with the wrong owner or a duplicate day", () => {
    const curriculum = {
      version: 1,
      startDate: "2026-09-30",
      endDate: "2027-01-07",
      chapterCount: 200,
      days: Array.from({ length: 100 }, (_, index) => ({
        id: `career-${index}`,
        day: index + 1,
        date: new Date(Date.UTC(2026, 8, 30 + index, 12)).toISOString().slice(0, 10),
        chapters: [
          { id: `chapter-${index}-a`, studyUrl: "https://study.buildora.work/chapter-a.md" },
          { id: `chapter-${index}-b`, studyUrl: "https://study.buildora.work/chapter-b.md" },
        ],
        checklist: [{ id: `item-${index}`, evidenceType: "note" as const, text: "Write notes", estimatedMinutes: 5, acceptanceCriteria: "Write a note." }],
      })),
    };
    const payload = { ownerEmail: "roadmap-test@example.invalid", curriculum: curriculum as CareerCurriculum, rows: [] };
    assert.throws(() => validateSeedPayload({ ...payload, ownerEmail: "someone@example.invalid" }, "roadmap-test@example.invalid"), /owner/i);
    const duplicate = { ...curriculum, days: [...curriculum.days.slice(0, 99), { ...curriculum.days[99], id: curriculum.days[0].id }] };
    assert.throws(() => validateSeedPayload({ ...payload, curriculum: duplicate }, "roadmap-test@example.invalid"), /duplicate/i);
  });
});
