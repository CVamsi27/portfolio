import assert from "node:assert/strict";
import test from "node:test";
import { careerRole, contractRole } from "../../e2e/career-workflow-fixture.ts";
import { availabilityNeedsReview, newOpportunity } from "./career-workflow.ts";
import {
  updateResearchCheck,
  canPreservePreparationStage,
  preservedPreparationStage,
} from "./career-research.ts";
import { mergeRecords } from "./record-merge.ts";
import {
  canPrepareApplication,
  careerQueueCounts,
  matchesCareerQueue,
} from "./career-queue.ts";

test("a future check date cannot make research appear freshly verified", () => {
  assert.equal(
    availabilityNeedsReview(
      { ...careerRole, checkedOn: "2026-11-06" },
      "2026-11-05",
    ),
    true,
  );
});

test("an unknown remote application stage must finish loading before a default is preserved", () => {
  assert.equal(canPreservePreparationStage(false, false, "local-only"), true);
  assert.equal(canPreservePreparationStage(true, false, "syncing"), false);
  assert.equal(canPreservePreparationStage(true, false, "error"), false);
  assert.equal(canPreservePreparationStage(true, false, "synced"), true);
  assert.equal(canPreservePreparationStage(true, true, "error"), true);
});

test("a default preparation snapshot cannot replace a concurrent actual application", () => {
  const placeholder = preservedPreparationStage({
    ...careerRole,
    eligibility: "clarify",
  });
  const actual = {
    ...newOpportunity(careerRole, 100),
    stage: "applied" as const,
    draft: "Actual user-edited wording",
  };
  const merged = mergeRecords(
    { [careerRole.id]: placeholder },
    { [careerRole.id]: actual },
  );
  assert.equal(merged[careerRole.id].stage, "applied");
  assert.equal(merged[careerRole.id].draft, "Actual user-edited wording");
  assert.equal(preservedPreparationStage(careerRole, actual), actual);
});
test("recording a research check preserves vacancy identity and uses a newer merge timestamp", () => {
  const original = {
    ...careerRole,
    eligibility: "clarify" as const,
    updatedAt: 500,
  };
  const check = {
    availability: "active" as const,
    eligibility: "eligible" as const,
    checkedOn: "2026-11-05",
    eligibilityEvidence: "The employer confirms remote India in writing.",
  };
  const result = updateResearchCheck(original, check, "2026-11-05", 400);
  assert.equal(result.updatedAt, 501);
  assert.equal(result.sourceUpdatedAt, 501);
  assert.equal(result.eligibility, "eligible");
  assert.equal(original.eligibility, "clarify");
  assert.equal(result.roleUrl, original.roleUrl);
  assert.equal(result.id, original.id);
  assert.deepEqual(result.contacts, original.contacts);
  assert.equal(result.draft, original.draft);
});
test("invalid research corrections fail before changing existing facts", () => {
  const check = {
    availability: "active" as const,
    eligibility: "eligible" as const,
    checkedOn: "2026-11-05",
    eligibilityEvidence: "Employer checked",
  };
  for (const fields of [
    { checkedOn: "2026-11-06" },
    { checkedOn: "2026-02-30" },
    { eligibilityEvidence: "" },
    { availability: "guessed" },
  ]) {
    assert.throws(() =>
      updateResearchCheck(
        careerRole,
        { ...check, ...fields } as typeof check,
        "2026-11-05",
        700,
      ),
    );
  }
});
test("ready applications require current eligible research and an unsent preparation stage", () => {
  const opportunity = newOpportunity(careerRole, 0);
  assert.equal(
    canPrepareApplication(careerRole, opportunity, "2026-11-05"),
    true,
  );
  assert.equal(
    canPrepareApplication(
      { ...careerRole, checkedOn: "2026-10-28" },
      opportunity,
      "2026-11-05",
    ),
    false,
  );
  assert.equal(
    canPrepareApplication(
      { ...careerRole, eligibility: "clarify" },
      opportunity,
      "2026-11-05",
    ),
    false,
  );
  assert.equal(
    canPrepareApplication(
      { ...careerRole, availability: "uncertain" },
      opportunity,
      "2026-11-05",
    ),
    false,
  );
  assert.equal(
    canPrepareApplication(
      careerRole,
      { ...opportunity, stage: "applied" },
      "2026-11-05",
    ),
    false,
  );
  assert.equal(
    canPrepareApplication(
      careerRole,
      { ...opportunity, stage: "clarify" },
      "2026-11-05",
    ),
    false,
  );
});
test("queue views distinguish applications, follow-ups, stale research and agreed contracts", () => {
  const ready = careerRole;
  const sent = {
    ...careerRole,
    id: "sent",
    roleUrl: "https://example.test/jobs/sent",
  };
  const stale = {
    ...careerRole,
    id: "stale",
    roleUrl: "https://example.test/jobs/stale",
    checkedOn: "2026-10-28",
  };
  const research = Object.fromEntries(
    [ready, sent, stale, contractRole].map((r) => [r.id, r]),
  );
  const opportunities = {
    [sent.id]: {
      ...newOpportunity(sent, 0),
      stage: "applied" as const,
      followUpOn: "2026-11-05",
    },
    [contractRole.id]: {
      ...newOpportunity(contractRole, 0),
      stage: "won" as const,
    },
  };
  assert.deepEqual(careerQueueCounts(research, opportunities, "2026-11-05"), {
    all: 4,
    ready: 1,
    followups: 1,
    contracts: 1,
    recheck: 1,
  });
  assert.equal(
    matchesCareerQueue(
      stale,
      newOpportunity(stale, 0),
      "2026-11-05",
      "recheck",
    ),
    true,
  );
  assert.equal(
    matchesCareerQueue(
      contractRole,
      { ...newOpportunity(contractRole, 0), stage: "closed" },
      "2026-11-05",
      "contracts",
    ),
    false,
  );
});
