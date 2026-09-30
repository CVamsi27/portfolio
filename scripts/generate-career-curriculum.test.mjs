import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { buildCurriculum, validateCurriculum } from "./generate-career-curriculum.mjs";

const fixtureBible = mkdtempSync(join(tmpdir(), "career-curriculum-"));
const fixtureExpectedChapterPaths = [];
for (let index = 1; index <= 100; index += 1) {
  const path = `10-frontend/10.1-javascript/10.1.${String(index).padStart(2, "0")}.01-chapter-${index}.md`;
  fixtureExpectedChapterPaths.push(path);
  const file = join(fixtureBible, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `# Chapter ${index}\n\n[![Read time](https://img.shields.io/badge/read--time-15_min-informational)](#)\n`);
}
mkdirSync(join(fixtureBible, "80-lanes-abroad-full-stack", "personal"), { recursive: true });
writeFileSync(join(fixtureBible, "80-lanes-abroad-full-stack", "personal", "cv.md"), "# Private CV\n");
writeFileSync(join(fixtureBible, "10-frontend", "INDEX.md"), "# Navigation only\n");
const backendChapterPath = "20-backend/20.1-node/20.1.01-runtime.md";
mkdirSync(dirname(join(fixtureBible, backendChapterPath)), { recursive: true });
writeFileSync(join(fixtureBible, backendChapterPath), "# Runtime\n\n[![Read time](https://img.shields.io/badge/read--time-15_min-informational)](#)\n");
fixtureExpectedChapterPaths.push(backendChapterPath);
for (const [path, title] of [
  ["10-frontend/10.2-typescript/10.2.01-types.md", "TypeScript"],
  ["10-frontend/10.3-react/10.3.01-components.md", "React"],
]) {
  mkdirSync(dirname(join(fixtureBible, path)), { recursive: true });
  writeFileSync(join(fixtureBible, path), `# ${title}\n\n[![Read time](https://img.shields.io/badge/read--time-15_min-informational)](#)\n`);
  fixtureExpectedChapterPaths.push(path);
}

const buildFixture = () => buildCurriculum({
  bibleRoot: fixtureBible,
  startDate: "2026-09-30",
  dayCount: 100,
  studyBaseUrl: "https://study.example.test",
});

test("assigns every public numbered chapter exactly once across 100 consecutive dates", () => {
  const plan = buildFixture();
  const chapters = plan.days.flatMap(day => day.chapters.map(chapter => chapter.path));
  assert.equal(plan.days.length, 100);
  assert.equal(plan.days[0].date, "2026-09-30");
  assert.equal(plan.days.at(-1).date, "2027-01-07");
  assert.equal(new Set(chapters).size, chapters.length);
  assert.deepEqual([...chapters].sort(), [...fixtureExpectedChapterPaths].sort());
});

test("excludes INDEX and private personal documents from the study inventory", () => {
  const plan = buildFixture();
  const chapters = plan.days.flatMap(day => day.chapters);
  assert.equal(chapters.some(chapter => chapter.path.endsWith("INDEX.md") || chapter.path.includes("/personal/")), false);
});

test("rejects a day whose study work exceeds its two-hour budget", () => {
  const plan = buildFixture();
  assert.throws(() => validateCurriculum({
    ...plan,
    days: plan.days.map((day, index) => index === 0
      ? { ...day, chapters: day.chapters.map(chapter => ({ ...chapter, estimatedMinutes: 121 })) }
      : day),
  }), /study budget/i);
});

test("creates direct chapter URLs and a content digest without private paths", () => {
  const plan = buildFixture();
  const serialized = JSON.stringify(plan);
  assert.match(plan.days[0].chapters[0].studyUrl, /^https:\/\/study\.example\.test\//);
  assert.match(plan.sourceDigest, /^[a-f0-9]{64}$/);
  assert.equal(serialized.includes("personal/cv.md"), false);
  assert.equal(plan.totalStudyMinutes, 1545);
});

test("every day has a ten-hour work schedule and protected family and meal anchors", () => {
  const plan = buildFixture();
  const totals = Object.values(plan.days[0].schedule).filter(block => block.work).reduce((sum, block) => sum + block.minutes, 0);
  assert.equal(totals, 600);
  assert.equal(plan.days[0].schedule["18:00-20:00"].minutes, 120);
  assert.equal(plan.days[0].schedule["14:00-14:30"].label, "Lunch");
  assert.equal(plan.days[0].schedule["20:00-20:30"].label, "Dinner");
});

test("starts in JavaScript and keeps the full-stack study sequence ordered", () => {
  const plan = buildFixture();
  const paths = plan.days.flatMap(day => day.chapters.map(chapter => chapter.path));
  assert.match(paths[0], /^10-frontend\/10\.1-javascript\//);
  const javascript = paths.findIndex(path => path.includes("/10.1-javascript/"));
  const typescript = paths.findIndex(path => path.includes("/10.2-typescript/"));
  const react = paths.findIndex(path => path.includes("/10.3-react/"));
  const backend = paths.findIndex(path => path.startsWith("20-backend/"));
  assert.ok(javascript < typescript && typescript < react && react < backend);
  const day = plan.days[0];
  assert.equal(day.checklist.length, 7);
  assert.ok(day.checklist.every(item => Array.isArray(item.instructions) && item.instructions.length >= 2));
  assert.ok(day.steps.length >= 7);
});
