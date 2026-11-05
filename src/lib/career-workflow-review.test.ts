import assert from "node:assert/strict";
import test from "node:test";
import {
  applyResearchImport,
  careerReview,
  nextCareerActions,
  newOpportunity,
  parseResearchSnapshot,
  recordCareerActivity,
  type CareerActivity,
  type CareerResearchRole,
} from "./career-workflow.ts";
import { mergeRecords } from "./record-merge.ts";

const role: CareerResearchRole = {
  id: "review-role",
  company: "Example Engineering",
  title: "Full-stack engineer",
  roleUrl: "https://example.test/jobs/review",
  kind: "employment",
  location: "India remote",
  availability: "active",
  checkedOn: "2026-11-05",
  eligibility: "eligible",
  eligibilityEvidence: "Explicit India remote opening",
  fit: [],
  gaps: [],
  questions: [],
  suggestedAction: "Review the role",
  rank: 1,
  compensation: "Unconfirmed",
  contacts: [],
  draft: "Original researched draft",
  updatedAt: 100,
};
const event = (override: Partial<CareerActivity>): CareerActivity => ({
  id: "review-application",
  opportunityId: role.id,
  kind: "application",
  date: "2026-11-05",
  reference: "Actual employer receipt",
  note: "A recorded action",
  updatedAt: 200,
  ...override,
});

test("an approved same-day research correction survives the record-merge acknowledgement", () => {
  const cloud = { [role.id]: role };
  const snapshot = {
    schemaVersion: 1 as const,
    exportedAt: "2026-11-05T14:00:00Z",
    roles: [{ ...role, draft: "Corrected source facts" }],
  };
  const imported = applyResearchImport(cloud, snapshot, [role.id]);
  // The server and client both use strictly-newer timestamp merging. A changed
  // import with an unchanged stamp is otherwise replaced by the old cloud row.
  const acknowledged = mergeRecords(imported, cloud);
  assert.equal(acknowledged[role.id].draft, "Corrected source facts");
});

test("logging a historical application cannot restart follow-ups after a later reply", () => {
  const opportunities = {
    [role.id]: {
      ...newOpportunity(role, 100),
      stage: "applied" as const,
      followUpOn: null,
    },
  };
  const reply = event({
    id: "review-reply",
    kind: "reply",
    date: "2026-11-10",
    reference: "Actual reply received",
    updatedAt: 300,
  });
  const result = recordCareerActivity(
    opportunities,
    { [reply.id]: reply },
    event({ updatedAt: 400 }),
  );
  assert.equal(result.opportunities[role.id].followUpOn, null);
});

test("an unrelated historical conversation does not suppress the mature-cohort checkpoint", () => {
  const application = event({ date: "2026-11-05" });
  const unrelated = event({
    id: "old-conversation",
    opportunityId: "unrelated-old-role",
    kind: "conversation",
    date: "2026-08-01",
    reference: "Historical call",
  });
  const result = careerReview(
    { [application.id]: application, [unrelated.id]: unrelated },
    "2026-11-13",
  );
  assert.equal(result.matureOutreach, 1);
  assert.equal(result.checkpointDue, true);
});

test("research enum arrays are rejected before import instead of creating unsyncable records", () => {
  for (const field of ["kind", "availability", "eligibility"] as const) {
    assert.throws(() =>
      parseResearchSnapshot({
        schemaVersion: 1,
        exportedAt: "2026-11-05T14:00:00Z",
        roles: [{ ...role, [field]: [role[field]] }],
      }),
    );
  }
});

test("an interview booked today becomes a Today action on its scheduled date", () => {
  const interview = event({
    kind: "interview",
    date: "2026-11-05",
    scheduledAt: "2026-11-10T10:00:00+05:30",
  });
  const opportunities = {
    [role.id]: { ...newOpportunity(role, 100), stage: "interview" as const },
  };
  const activities = { [interview.id]: interview };
  assert.equal(
    nextCareerActions(
      { [role.id]: role },
      opportunities,
      activities,
      "2026-11-05",
    ).length,
    0,
  );
  assert.equal(
    nextCareerActions(
      { [role.id]: role },
      opportunities,
      activities,
      "2026-11-10",
    )[0].id,
    interview.id,
  );
});
