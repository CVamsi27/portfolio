import assert from "node:assert/strict";
import { test } from "node:test";
import {
  campaignPosition,
  mergeGermanyCareer,
  alignCampaignTimetable,
} from "./germany-roadmap.ts";
const plan = {
  version: 1 as const,
  reviewedOn: "2026-10-10",
  startDate: "2026-10-12",
  endDate: "2027-01-03",
  target: "Senior engineer",
  sourceDigest: "a".repeat(64),
  weeks: [
    {
      number: 1,
      start: "2026-10-12",
      end: "2026-10-18",
      study: "Study",
      deliverable: "Build",
      campaign: "Apply",
      items: [],
    },
  ],
  allocations: [],
  sections: [],
  sources: [],
};
test("campaign position distinguishes launch, dated work and the continuing hiring cycle", () => {
  assert.deepEqual(campaignPosition(plan, "2026-10-10"), {
    stage: "before",
    week: 1,
  });
  assert.deepEqual(campaignPosition(plan, "2026-10-18"), {
    stage: "active",
    week: 1,
  });
  assert.deepEqual(campaignPosition(plan, "2026-10-19"), {
    stage: "active",
    week: 2,
  });
  assert.deepEqual(campaignPosition(plan, "2027-01-04"), {
    stage: "after",
    week: 12,
  });
  assert.throws(() => campaignPosition(plan, "2026-02-30"), /date/i);
});
test("targeted merge preserves account fields and never rewrites historical schedules", () => {
  const prior = {
    profile: { custom: true },
    germanyChecklist: [{ id: "old", done: true }],
    extra: "keep",
  };
  const next = mergeGermanyCareer(prior, plan);
  assert.deepEqual(next.profile, prior.profile);
  assert.deepEqual(next.germanyChecklist, prior.germanyChecklist);
  assert.equal(next.extra, "keep");
  assert.equal("germanyRoadmap" in prior, false);
  const historical = {
    date: "2026-10-05",
    schedule: { old: "history" },
    checklist: [{ id: "past", done: true }],
  };
  const future = {
    date: "2026-10-18",
    schedule: { old: "future" },
    checklist: [{ id: "future", done: true }],
  };
  const timetable = { days: [historical, future], custom: "keep" };
  const aligned = alignCampaignTimetable("cvamsik99@gmail.com", timetable);
  assert.equal(aligned.days[0], historical);
  assert.equal(aligned.days[1].checklist, future.checklist);
  assert.deepEqual(aligned.days[1].schedule, {});
  assert.equal(aligned.custom, "keep");
  assert.deepEqual(future.schedule, { old: "future" });
  assert.equal(
    alignCampaignTimetable("other@example.com", timetable),
    timetable,
  );
});

test("saving the same evidence never verifies it and changed evidence requires another check", async () => {
  const { recordGermanyEvidence } = await import("./germany-roadmap.ts");
  const item = {
    id: "germany:2026:w01:project",
    text: "Build",
    evidenceType: "note" as const,
    acceptanceCriteria: "Test",
    estimatedMinutes: 120,
  };
  const evidence = {
    value:
      "A reproducible test passes for the two tenant boundary, with the revision and remaining local-only limitation recorded.",
  };
  const initial = {
    version: 1 as const,
    evidenceByItemId: {},
    archivedItems: [],
    legacyClaims: [],
  };
  assert.throws(
    () => recordGermanyEvidence(initial, item, evidence, true),
    /saved/i,
  );
  const saved = recordGermanyEvidence(initial, item, evidence, false);
  assert.equal(
    recordGermanyEvidence(saved, item, evidence, false).evidenceByItemId[
      item.id
    ].verifiedAt,
    undefined,
  );
  const verified = recordGermanyEvidence(saved, item, evidence, true);
  assert.ok(verified.evidenceByItemId[item.id].verifiedAt);
  const changed = recordGermanyEvidence(
    verified,
    item,
    { value: evidence.value + " More." },
    false,
  );
  assert.equal(changed.evidenceByItemId[item.id].verifiedAt, undefined);
  assert.throws(
    () => recordGermanyEvidence(initial, item, { value: "done" }, false),
    /evidence/i,
  );
});

test("plan validation rejects unsafe sources and incomplete campaign payloads", async () => {
  const { isGermanyRoadmap } = await import("./germany-roadmap.ts");
  const full = {
    ...plan,
    weeks: Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      start: new Date(Date.UTC(2026, 9, 12 + i * 7)).toISOString().slice(0, 10),
      end: new Date(Date.UTC(2026, 9, 18 + i * 7)).toISOString().slice(0, 10),
      study: "Study",
      deliverable: "Build",
      campaign: "Apply",
      items: [],
    })),
    allocations: [{ label: "Work", hours: 50 }],
    sources: [{ label: "Official", url: "https://example.org/" }],
  };
  assert.equal(isGermanyRoadmap(full), true);
  assert.equal(isGermanyRoadmap({ ...full, allocations: [] }), false);
  assert.equal(
    isGermanyRoadmap({
      ...full,
      sources: [{ label: "Unsafe", url: "javascript:alert(1)" }],
    }),
    false,
  );
  assert.equal(
    isGermanyRoadmap({
      ...full,
      weeks: full.weeks.map((w, i) =>
        i === 2 ? { ...w, start: "2026-10-12" } : w,
      ),
    }),
    false,
  );
});

test('replaces superseded planning quotas while retaining custom targets and historical requirements',()=>{
 const old={weeklyTargets:{focusedStudyHours:14,ossPRs:1,leetcodeProblems:25,germanPracticeMinutes:75,customTarget:3},verificationChecklist:{label:'Checks',items:[{id:'verify-germany',text:'Finish all documents before applications'},{id:'custom',text:'Keep this check'}]}};
 const next=mergeGermanyCareer(old,plan);
 const targets=next.weeklyTargets as Record<string,number>;
 assert.equal(targets.focusedStudyHours,7.5);
 assert.equal(targets.germanPracticeMinutes,225);
 assert.equal(targets.ossPRs,undefined);
 assert.equal(targets.customTarget,3);
 assert.deepEqual(next.legacyWeeklyTargets,old.weeklyTargets);
 assert.match((next.verificationChecklist as typeof old.verificationChecklist).items[0].text,/parallel/);
 assert.equal((next.verificationChecklist as typeof old.verificationChecklist).items[1].text,'Keep this check');
});

test('a requirement reviewed against the current wording stays reviewed on reseed',()=>{
 const old={germanyChecklist:[{id:'germany-blue-card',text:'Old threshold',done:true}]};
 const refreshed=mergeGermanyCareer(old,plan);
 const rows=refreshed.germanyChecklist as Array<Record<string,unknown>>;
 assert.equal(rows[0].reviewRequired,true);
 const reviewed={...refreshed,germanyChecklist:rows.map(row=>({...row,reviewRequired:false}))};
 const repeated=mergeGermanyCareer(reviewed,plan);
 assert.equal((repeated.germanyChecklist as Array<Record<string,unknown>>)[0].reviewRequired,false);
});
