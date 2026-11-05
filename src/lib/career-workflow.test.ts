import assert from "node:assert/strict";
import test from "node:test";
import {
  parseResearchSnapshot,
  previewResearchImport,
  applyResearchImport,
  newOpportunity,
  recordCareerActivity,
  nextCareerActions,
  careerReview,
  addBusinessDays,
  availabilityNeedsReview,
  adaptLegacyCompanyRecords,
  validCareerCollection,
  careerWritesEnabled,
  trackerKeyWritesEnabled,
  type CareerResearchRole,
  type CareerActivity,
} from "./career-workflow.ts";

function role(overrides: Partial<CareerResearchRole> = {}): CareerResearchRole {
  return {
    id: "synthetic-role",
    company: "Example Studio",
    title: "Full-stack engineer",
    roleUrl: "https://example.test/jobs/one",
    kind: "employment",
    location: "Remote India",
    availability: "active",
    checkedOn: "2026-11-05",
    eligibility: "eligible",
    eligibilityEvidence: "Employer explicitly permits remote work from India.",
    fit: ["React and Node delivery"],
    gaps: ["Confirm database scope"],
    questions: ["First-pay date?"],
    suggestedAction: "Prepare a relevant application",
    rank: 1,
    compensation: "Unconfirmed",
    contacts: [],
    draft: "An editable and unsent application note.",
    updatedAt: 100,
    ...overrides,
  };
}
function activity(overrides: Partial<CareerActivity> = {}): CareerActivity {
  return {
    id: "event-one",
    opportunityId: "synthetic-role",
    kind: "application",
    date: "2026-11-05",
    reference: "Employer confirmation ABC123",
    note: "Submitted the actual application.",
    updatedAt: 200,
    ...overrides,
  };
}
const snapshot = (roles = [role()]) => ({
  schemaVersion: 1 as const,
  exportedAt: "2026-11-05T12:00:00Z",
  roles,
});

test("invalid research rejects the whole snapshot before any import", () => {
  assert.throws(() =>
    parseResearchSnapshot(
      snapshot([role(), role({ id: "bad", roleUrl: "javascript:alert(1)" })]),
    ),
  );
  assert.throws(() =>
    parseResearchSnapshot(
      snapshot([role({ roleUrl: "https://secret:password@example.test/job" })]),
    ),
  );
  assert.throws(() => parseResearchSnapshot(snapshot([role(), role()])));
  assert.throws(() =>
    parseResearchSnapshot({ ...snapshot(), schemaVersion: 99 }),
  );
  assert.throws(() =>
    parseResearchSnapshot(
      snapshot([
        role({
          contacts: [
            {
              name: "Hiring",
              url: "mailto:hiring@example.test%0Abcc:other.test",
            },
          ],
        }),
      ]),
    ),
  );
});
test("preview is selective and identical reimport preserves object identity", () => {
  const current = {};
  const payload = parseResearchSnapshot(
    snapshot([
      role(),
      role({ id: "second", roleUrl: "https://example.test/jobs/two" }),
    ]),
  );
  assert.deepEqual(
    previewResearchImport(payload, current).map((r) => r.change),
    ["added", "added"],
  );
  const next = applyResearchImport(current, payload, ["synthetic-role"]);
  assert.deepEqual(Object.keys(next), ["synthetic-role"]);
  assert.deepEqual(current, {});
  assert.equal(applyResearchImport(next, payload, ["synthetic-role"]), next);
});
test("research refresh changes facts without owning application records", () => {
  const current = { "synthetic-role": role() };
  const opportunity = {
    ...newOpportunity(role(), 200),
    stage: "applied" as const,
    draft: "User edited draft",
    followUpOn: "2026-11-12",
  };
  const refreshed = parseResearchSnapshot(
    snapshot([role({ compensation: "A newly checked range", updatedAt: 300 })]),
  );
  const next = applyResearchImport(current, refreshed, ["synthetic-role"]);
  assert.equal(next["synthetic-role"].compensation, "A newly checked range");
  assert.equal(opportunity.stage, "applied");
  assert.equal(opportunity.draft, "User edited draft");
  assert.equal(opportunity.followUpOn, "2026-11-12");
});
test("older snapshots and duplicate role URLs cannot replace a newer role", () => {
  const current = {
    "synthetic-role": role({ checkedOn: "2026-11-06", updatedAt: 300 }),
  };
  assert.equal(previewResearchImport(snapshot(), current)[0].change, "older");
  assert.equal(
    applyResearchImport(current, snapshot(), ["synthetic-role"]),
    current,
  );
  const sameURL = snapshot([
    role({
      id: "another-id",
      roleUrl: "https://example.test/jobs/one?utm_source=feed#apply",
    }),
  ]);
  assert.equal(previewResearchImport(sameURL, current)[0].change, "duplicate");
});
test("application logging requires actual date and receipt and schedules five weekdays", () => {
  const initial = { "synthetic-role": newOpportunity(role(), 100) };
  assert.throws(() =>
    recordCareerActivity(initial, {}, activity({ reference: "" })),
  );
  assert.throws(() =>
    recordCareerActivity(initial, {}, activity({ date: "2026-02-30" })),
  );
  const next = recordCareerActivity(initial, {}, activity());
  assert.equal(next.opportunities["synthetic-role"].stage, "applied");
  assert.equal(next.opportunities["synthetic-role"].followUpOn, "2026-11-12");
  assert.equal(initial["synthetic-role"].stage, "ready");
  assert.equal(addBusinessDays("2026-11-06", 5), "2026-11-13");
});
test("reply clears follow-up while drafts and notes never count as sent", () => {
  const initial = {
    "synthetic-role": {
      ...newOpportunity(role(), 100),
      followUpOn: "2026-11-12",
    },
  };
  const next = recordCareerActivity(
    initial,
    {},
    activity({ kind: "reply", reference: "Hiring team response" }),
  );
  assert.equal(next.opportunities["synthetic-role"].followUpOn, null);
  const noted = recordCareerActivity(
    initial,
    {},
    activity({ kind: "note", reference: "", note: "Draft prepared only" }),
  );
  assert.equal(careerReview(noted.activities, "2026-11-05").applications, 0);
});
test("a conversation does not regress an advanced opportunity stage", () => {
  const initial = {
    "synthetic-role": {
      ...newOpportunity(role(), 100),
      stage: "offer" as const,
    },
  };
  const next = recordCareerActivity(
    initial,
    {},
    activity({ kind: "application" }),
  );
  assert.equal(next.opportunities["synthetic-role"].stage, "offer");
});
test("next actions prioritize scheduled work and due follow-ups before role rank", () => {
  const a = role(),
    b = role({ id: "two", roleUrl: "https://example.test/jobs/two", rank: 2 }),
    c = role({
      id: "three",
      roleUrl: "https://example.test/jobs/three",
      rank: 3,
    });
  const research = Object.fromEntries([a, b, c].map((r) => [r.id, r]));
  const opportunities = {
    two: {
      ...newOpportunity(b, 100),
      stage: "applied" as const,
      followUpOn: "2026-11-05",
    },
    three: newOpportunity(c, 100),
  };
  const events = {
    interview: activity({
      id: "interview",
      opportunityId: "three",
      kind: "interview",
      scheduledAt: "2026-11-05T10:00:00+05:30",
    }),
  };
  assert.deepEqual(
    nextCareerActions(research, opportunities, events, "2026-11-05").map(
      (a) => a.opportunityId,
    ),
    ["three", "two", "synthetic-role"],
  );
  assert.equal(
    nextCareerActions(research, opportunities, events, "2026-11-05").length,
    3,
  );
});
test("uncertain eligibility leads to clarification and old checks request review", () => {
  const uncertain = role({ eligibility: "clarify" });
  assert.equal(newOpportunity(uncertain, 100).stage, "clarify");
  assert.equal(availabilityNeedsReview(role(), "2026-11-12"), false);
  assert.equal(availabilityNeedsReview(role(), "2026-11-13"), true);
  const actions = nextCareerActions(
    { "synthetic-role": role() },
    {},
    {},
    "2026-11-13",
  );
  assert.match(actions[0].title, /recheck/i);
});
test("closed, ineligible and expired roles cannot suggest an application", () => {
  const expired = role({ availability: "expired" });
  assert.equal(
    nextCareerActions({ [expired.id]: expired }, {}, {}, "2026-11-05").length,
    0,
  );
  const closed = { ...newOpportunity(role(), 100), stage: "closed" as const };
  assert.equal(
    nextCareerActions(
      { "synthetic-role": role() },
      { "synthetic-role": closed },
      {},
      "2026-11-05",
    ).length,
    0,
  );
});
test("agreed paid delivery remains a priority after a contract is won", () => {
  const won = { ...newOpportunity(role(), 100), stage: "won" as const };
  const delivery = activity({
    id: "delivery",
    kind: "delivery",
    note: "Deliver the agreed integration",
    scheduledAt: "2026-11-05T13:00:00+05:30",
  });
  const actions = nextCareerActions(
    { "synthetic-role": role() },
    { "synthetic-role": won },
    { delivery },
    "2026-11-05",
  );
  assert.equal(actions[0]?.title, "Deliver the agreed paid work");
  assert.equal(
    nextCareerActions(
      { "synthetic-role": role() },
      { "synthetic-role": won },
      { delivery: { ...delivery, done: true } },
      "2026-11-05",
    ).length,
    0,
  );
});
test("weekly results count actual events and keep currencies separate", () => {
  const events = [
    activity(),
    activity({ id: "outreach", kind: "outreach" }),
    activity({ id: "proposal", kind: "proposal" }),
    activity({ id: "call", kind: "conversation" }),
    activity({ id: "usd", kind: "payment", amount: 100, currency: "USD" }),
    activity({ id: "inr", kind: "payment", amount: 5000, currency: "INR" }),
    activity({ id: "old", date: "2026-10-30" }),
    activity({ id: "deleted", deleted: true }),
    activity({ id: "future", date: "2026-11-06" }),
  ];
  const review = careerReview(
    Object.fromEntries(events.map((e) => [e.id, e])),
    "2026-11-05",
  );
  assert.equal(review.applications, 1);
  assert.equal(review.conversations, 1);
  assert.equal(review.proposals, 1);
  assert.deepEqual(review.payments, { USD: 100, INR: 5000 });
});
test("payment entries reject missing currency, nonfinite or nonpositive amounts", () => {
  const opportunities = { "synthetic-role": newOpportunity(role(), 100) };
  for (const change of [
    { currency: "", amount: 1 },
    { currency: "USD", amount: 0 },
    { currency: "USD", amount: Infinity },
  ]) {
    assert.throws(() =>
      recordCareerActivity(
        opportunities,
        {},
        activity({ kind: "payment", ...change }),
      ),
    );
  }
});
test("November checkpoint assesses the mature outreach cohort, not old unrelated calls", () => {
  const events = {
    sent: activity({ id: "sent", date: "2026-11-05" }),
    oldCall: activity({
      id: "oldCall",
      opportunityId: "another-role",
      kind: "conversation",
      date: "2026-11-03",
    }),
    fresh: activity({
      id: "fresh",
      opportunityId: "fresh-role",
      date: "2026-11-12",
    }),
  };
  assert.equal(careerReview(events, "2026-11-13").matureOutreach, 1);
  assert.equal(careerReview(events, "2026-11-13").checkpointDue, true);
  const replied = {
    ...events,
    booked: activity({ id: "booked", kind: "interview", date: "2026-11-18" }),
  };
  assert.equal(careerReview(replied, "2026-11-13").checkpointDue, false);
});
test("legacy adaptation matches exact vacancies rather than company names", () => {
  const research = {
    "synthetic-role": role(),
    second: role({ id: "second", roleUrl: "https://example.test/jobs/two" }),
  };
  const legacy = {
    DE01: {
      stage: "submitted",
      eligibility: "eligible",
      checkedOn: "2026-11-05",
      roleUrl: "https://example.test/jobs/one",
      confirmation: "Actual ABC receipt",
      note: "Original tracked evidence",
    },
    DE02: { stage: "submitted", roleUrl: "https://example.test/jobs/unknown" },
  };
  const result = adaptLegacyCompanyRecords(legacy, research, 500);
  assert.equal(result.opportunities["synthetic-role"].stage, "applied");
  assert.equal(result.opportunities.second, undefined);
  assert.deepEqual(result.unmatched, ["DE02"]);
  assert.equal(legacy.DE01.stage, "submitted");
});
test("collection validation rejects malformed entries before restore", () => {
  assert.equal(
    validCareerCollection("career:research", { "synthetic-role": role() }),
    true,
  );
  assert.equal(
    validCareerCollection("career:activities", { broken: activity() }),
    false,
  );
  assert.equal(
    validCareerCollection("career:opportunities", {
      "synthetic-role": newOpportunity(role(), 100),
    }),
    true,
  );
  assert.equal(
    validCareerCollection("career:research", JSON.parse('{"__proto__":{}}')),
    false,
  );
});
test("signed-in career writes stay gated until explicitly enabled", () => {
  assert.equal(careerWritesEnabled(false, undefined), true);
  assert.equal(careerWritesEnabled(true, undefined), false);
  assert.equal(careerWritesEnabled(true, "true"), true);
  assert.equal(
    trackerKeyWritesEnabled("career:activities", true, undefined),
    false,
  );
  assert.equal(trackerKeyWritesEnabled("career:research", true, "true"), true);
  assert.equal(
    trackerKeyWritesEnabled("career_execution_state", true, undefined),
    true,
  );
  assert.equal(
    trackerKeyWritesEnabled("nutrition:entries", true, undefined),
    true,
  );
});
