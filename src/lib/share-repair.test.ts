import test from "node:test";
import assert from "node:assert/strict";
import {
  applyImageRepairs,
  inlineImageRepairTargets,
  repairInlineImages,
  type RepairableDrop,
} from "./share-repair.ts";

const inline = (name: string) => `data:image/jpeg;base64,${name}`;

test("only drops holding inline bytes need a repair", () => {
  const targets = inlineImageRepairTargets([
    { id: "a", images: [inline("one"), "uid/one.jpg"] },
    { id: "b", images: ["uid/two.jpg"] },
    { id: "c", image: inline("legacy") },
    { id: "d", image: "uid/legacy.jpg" },
    { id: "e" },
  ]);
  assert.deepEqual(
    targets.map((target) => target.drop.id),
    ["a", "c"],
  );
  assert.deepEqual(targets[0].sources, [inline("one"), "uid/one.jpg"]);
  assert.deepEqual(targets[1].sources, [inline("legacy")]);
});

test("legacy single-image fields are reported once", () => {
  const [target] = inlineImageRepairTargets([
    { id: "a", image: "uid/one.jpg", imagePath: "uid/one.jpg" },
  ]);
  assert.equal(target, undefined);
  const [inlineTarget] = inlineImageRepairTargets([
    { id: "b", image: inline("x"), imagePath: inline("x") },
  ]);
  assert.deepEqual(inlineTarget.sources, [inline("x")]);
});

test("applying repairs rewrites the gallery and clears legacy fields", () => {
  const drops: (RepairableDrop & { text: string })[] = [
    {
      id: "a",
      text: "keep me",
      image: inline("one"),
      imagePath: null,
      images: [inline("one")],
    },
    { id: "b", text: "untouched", image: null, images: ["uid/b.jpg"] },
  ];
  const result = applyImageRepairs(drops, new Map([["a", ["uid/a.jpg"]]]));
  assert.deepEqual(result[0], {
    id: "a",
    text: "keep me",
    image: null,
    imagePath: "uid/a.jpg",
    images: ["uid/a.jpg"],
  });
  assert.equal(result[1], drops[1]);
});

test("repairs that failed to upload leave the inline bytes in place", () => {
  const drops: RepairableDrop[] = [
    { id: "a", image: inline("one"), images: [inline("one"), inline("two")] },
  ];
  const result = applyImageRepairs(drops, {
    a: [inline("one"), "uid/two.jpg"],
  });
  assert.deepEqual(result[0].images, [inline("one"), "uid/two.jpg"]);
  assert.equal(result[0].imagePath, "uid/two.jpg");
  assert.equal(result[0].image, null);
});

test("a repair pass uploads every inline image once", async () => {
  const targets = inlineImageRepairTargets([
    { id: "a", images: [inline("one"), "uid/kept.jpg"] },
  ]);
  const names: string[] = [];
  const { repairs, attempts } = await repairInlineImages(
    targets,
    async (_dataUrl, name) => {
      names.push(name);
      return `uid/${name}.png`;
    },
    async () => undefined,
  );
  assert.equal(attempts, 1);
  assert.deepEqual(names, ["repair-a-0"]);
  assert.deepEqual(repairs.get("a"), ["uid/repair-a-0.png", "uid/kept.jpg"]);
});

test("a repair pass retries after a failed attempt", async () => {
  const targets = inlineImageRepairTargets([
    { id: "a", images: [inline("one")] },
  ]);
  let calls = 0;
  const slept: number[] = [];
  const { repairs, attempts } = await repairInlineImages(
    targets,
    async (_dataUrl, name) => {
      calls += 1;
      return calls > 1 ? `uid/${name}.png` : null;
    },
    async (ms) => {
      slept.push(ms);
    },
  );
  assert.equal(attempts, 2);
  assert.deepEqual(slept, [1500]);
  assert.deepEqual(repairs.get("a"), ["uid/repair-a-0.png"]);
});

test("a repair pass gives up after the attempt budget", async () => {
  const targets = inlineImageRepairTargets([
    { id: "a", images: [inline("one")] },
  ]);
  const slept: number[] = [];
  let uploads = 0;
  const { repairs, attempts } = await repairInlineImages(
    targets,
    async () => {
      uploads += 1;
      return null;
    },
    async (ms) => {
      slept.push(ms);
    },
  );
  assert.equal(attempts, 3);
  assert.equal(uploads, 3);
  assert.deepEqual(slept, [1500, 3000]);
  assert.equal(repairs.size, 0);
});

test("an empty repair table returns the original drops", () => {
  const drops: RepairableDrop[] = [{ id: "a", images: [inline("one")] }];
  assert.equal(applyImageRepairs(drops, {}), drops);
  assert.equal(applyImageRepairs(drops, new Map()), drops);
});
