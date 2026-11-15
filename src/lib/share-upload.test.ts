import test from "node:test";
import assert from "node:assert/strict";
import { uploadDropImages } from "./share-upload.ts";

const image = (n: number) => `data:image/png;base64,${n}`;

test("uploads every image in pick order", async () => {
  const calls: string[] = [];
  const result = await uploadDropImages(
    [image(0), image(1)],
    (index) => `drop-${index}`,
    async (_dataUrl, name) => {
      calls.push(name);
      return `uid/${name}.png`;
    },
  );
  assert.deepEqual(result, {
    paths: ["uid/drop-0.png", "uid/drop-1.png"],
    failed: 0,
  });
  assert.deepEqual(calls, ["drop-0", "drop-1"]);
});

test("retries once before giving up on an image", async () => {
  let attempts = 0;
  const result = await uploadDropImages(
    [image(0)],
    () => "name",
    async () => {
      attempts += 1;
      return attempts === 2 ? "uid/name.png" : null;
    },
  );
  assert.deepEqual(result, { paths: ["uid/name.png"], failed: 0 });
  assert.equal(attempts, 2);
});

test("reports the images that never landed and keeps the rest", async () => {
  const result = await uploadDropImages(
    [image(0), image(1), image(2)],
    (index) => `name-${index}`,
    async (_dataUrl, name) => (name === "name-1" ? null : `uid/${name}.png`),
  );
  assert.deepEqual(result, { paths: ["uid/name-0.png", "uid/name-2.png"], failed: 1 });
});

test("an empty selection uploads nothing", async () => {
  const result = await uploadDropImages([], () => "unused", async () => "never");
  assert.deepEqual(result, { paths: [], failed: 0 });
});
