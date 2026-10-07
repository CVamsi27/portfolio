import test from "node:test";
import assert from "node:assert/strict";
import {
  validProgram,
  validNutritionDay,
  programForDate,
  dayQuality,
} from "./nutrition-program.ts";
import type { NutritionProgram } from "./nutrition-program.ts";
import type { FoodEntry } from "./nutrition.ts";
const program = (id = "p"): NutritionProgram => ({
  id,
  startDate: "2026-10-07",
  mode: "manual",
  goal: "maintain",
  days: Array.from({ length: 7 }, () => ({
    energy: 2000,
    protein: 100,
    carbs: 250,
    fat: 60,
  })),
  updatedAt: 1,
});
const entry = (energy: number | null = 200): FoodEntry => ({
  id: "e",
  name: "Food",
  basisAmount: 100,
  basisUnit: "g",
  nutrients: { energy },
  source: "manual",
  updatedAt: 1,
  date: "2026-10-07",
  meal: "Lunch",
  quantity: 150,
  foodId: "f",
});
test("program validation accepts seven user days and rejects invalid targets and dates", () => {
  assert.equal(validProgram(program()), true);
  for (const patch of [
    { days: [] },
    { startDate: "2026-02-30" },
    { mode: "guided" },
    { id: "" },
    { updatedAt: Infinity },
    { goal: "unknown" },
    { deleted: "yes" },
  ])
    assert.equal(validProgram({ ...program(), ...patch }), false);
  assert.equal(
    validProgram({
      ...program(),
      days: program().days.map((d) => ({ ...d, fat: -1 })),
    }),
    false,
  );
  assert.equal(
    validProgram({
      ...program(),
      days: program().days.map((d) => ({ ...d, energy: 0 })),
    }),
    false,
  );
  assert.equal(validProgram({ ...program(), mode: "flexible" }), true);
});
test("effective program selects latest start date, timestamp tie, ignores invalid, future and deleted records", () => {
  const early = { ...program("early"), startDate: "2026-10-01" };
  const latest = { ...program("latest"), updatedAt: 10 };
  const records = {
    early,
    p: program(),
    latest,
    future: { ...program("future"), startDate: "2026-10-09" },
    deleted: { ...program("deleted"), deleted: true, updatedAt: 20 },
  };
  assert.equal(programForDate(records, "2026-10-07")?.id, "latest");
  assert.equal(programForDate(records, "2026-10-06")?.id, "early");
  assert.equal(programForDate(records, "2026-09-01"), null);
  assert.equal(programForDate(records, "bad"), null);
});
test("day records validate real dates, status and deletion marker", () => {
  assert.equal(
    validNutritionDay({ id: "2026-10-07", status: "complete", updatedAt: 1 }),
    true,
  );
  for (const patch of [
    { id: "2026-02-30" },
    { status: "logged" },
    { updatedAt: NaN },
    { deleted: "yes" },
  ])
    assert.equal(
      validNutritionDay({
        id: "2026-10-07",
        status: "partial",
        updatedAt: 1,
        ...patch,
      }),
      false,
    );
});
test("empty logs never infer fasting or complete intake", () => {
  assert.equal(dayQuality("2026-10-07", []).status, "not-logged");
  assert.equal(dayQuality("2026-10-07", []).eligible, false);
  assert.equal(
    dayQuality("2026-10-07", [], {
      id: "2026-10-07",
      status: "complete",
      updatedAt: 1,
    }).eligible,
    false,
  );
});
test("explicit complete days scale energy; missing energy prevents eligibility without losing status", () => {
  const record = {
    id: "2026-10-07",
    status: "complete" as const,
    updatedAt: 1,
  };
  assert.equal(dayQuality(record.id, [entry()], record).energy, 300);
  assert.equal(dayQuality(record.id, [entry()], record).eligible, true);
  assert.equal(dayQuality(record.id, [entry(null)], record).eligible, false);
  assert.equal(dayQuality(record.id, [entry(null)], record).energy, null);
  assert.equal(dayQuality(record.id, [entry(null)], record).status, "complete");
});
test("fasting is explicit, contradicts consumed food, and deleted food is excluded", () => {
  const record = { id: "2026-10-07", status: "fasting" as const, updatedAt: 1 };
  assert.equal(dayQuality(record.id, [], record).energy, 0);
  assert.equal(dayQuality(record.id, [], record).eligible, true);
  assert.equal(dayQuality(record.id, [entry()], record).eligible, false);
  assert.equal(
    dayQuality(record.id, [{ ...entry(), deleted: true }], record).eligible,
    true,
  );
});
test("partial, estimated, stale and mismatched day confirmations never qualify as known complete intake", () => {
  const e = entry();
  for (const status of ["partial", "estimated"] as const)
    assert.equal(
      dayQuality(e.date, [e], { id: e.date, status, updatedAt: 5 }).eligible,
      false,
    );
  assert.equal(
    dayQuality(e.date, [e], {
      id: "2026-10-06",
      status: "complete",
      updatedAt: 5,
    }).status,
    "partial",
  );
  assert.equal(
    dayQuality(e.date, [e], { id: e.date, status: "complete", updatedAt: 0 })
      .status,
    "partial",
  );
  assert.equal(
    dayQuality(e.date, [{ ...e, updatedAt: 9 }], {
      id: e.date,
      status: "complete",
      updatedAt: 5,
    }).status,
    "partial",
  );
  assert.equal(
    dayQuality(e.date, [{ ...e, date: "2026-10-06" }]).status,
    "not-logged",
  );
});
test("validation rejects coerced enum values and negative record timestamps", () => {
  assert.equal(validProgram({ ...program(), mode: ["manual"] }), false);
  assert.equal(validProgram({ ...program(), goal: ["maintain"] }), false);
  assert.equal(
    validNutritionDay({ id: "2026-10-07", status: ["complete"], updatedAt: 1 }),
    false,
  );
  assert.equal(validProgram({ ...program(), updatedAt: -1 }), false);
});
test("later deletion invalidates confirmation and missing calorie subtotals stay unknown", () => {
  const e = entry();
  const record = { id: e.date, status: "complete" as const, updatedAt: 5 };
  assert.equal(
    dayQuality(
      e.date,
      [e, { ...e, id: "other", nutrients: { energy: null } }],
      record,
    ).energy,
    null,
  );
  const quality = dayQuality(
    e.date,
    [{ ...e, deleted: true, updatedAt: 9 }],
    record,
  );
  assert.equal(quality.status, "not-logged");
  assert.equal(quality.eligible, false);
  assert.match(quality.reason, /changed/);
});

test("date-specific program references override only macros and preserve legacy micronutrients", async () => {
  const { nutritionTargetsForDate } = await import("./nutrition-program.ts");
  const references = {
    energy: {
      id: "energy" as const,
      kind: "reference" as const,
      amount: 999,
      updatedAt: 1,
    },
    calcium: {
      id: "calcium" as const,
      kind: "reference" as const,
      amount: 900,
      updatedAt: 1,
    },
  };
  const p = program();
  p.days[3].energy = 1800;
  p.days[4].energy = 2200;
  const wed = nutritionTargetsForDate({ p }, "2026-10-07", references);
  assert.equal(wed.targets.energy.amount, 1800);
  assert.equal(wed.targets.calcium.amount, 900);
  assert.equal(wed.targets.protein.amount, 100);
  assert.equal(references.energy.amount, 999);
  assert.equal(
    nutritionTargetsForDate({ p }, "2026-10-08", references).targets.energy
      .amount,
    2200,
  );
  assert.equal(
    nutritionTargetsForDate({ p }, "2026-10-06", references).targets.energy
      .amount,
    999,
  );
  assert.equal(
    nutritionTargetsForDate({ p }, "2026-10-06", references).program,
    null,
  );
});

test("program editing stays local-enabled but cloud-disabled until explicitly released", async () => {
  const { canEditNutritionProgram } = await import("./nutrition-program.ts");
  assert.equal(canEditNutritionProgram(false, undefined), true);
  assert.equal(canEditNutritionProgram(true, undefined), false);
  assert.equal(canEditNutritionProgram(true, "false"), false);
  assert.equal(canEditNutritionProgram(true, "TRUE"), false);
  assert.equal(canEditNutritionProgram(true, "true"), true);
});
