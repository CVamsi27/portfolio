import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

// A broken path, undersized photo or missing credit makes the gallery unusable.
test("Germany gallery bundles three sharp photographs with source credits", async () => {
  const catalog = await readFile(
    new URL("../src/data/germany-motivation.json", import.meta.url),
    "utf8",
  ).catch(() => "[]");
  const photos = JSON.parse(catalog);
  assert.equal(
    photos.length,
    3,
    "Three Germany views must be available locally",
  );
  assert.equal(new Set(photos.map((photo) => photo.id)).size, 3);
  for (const photo of photos) {
    assert.match(photo.src, /^\/images\/motivation\/germany-[a-z-]+\.webp$/);
    assert.match(photo.alt, /Germany/);
    assert.ok(photo.photographer);
    assert.match(photo.sourceUrl, /^https:\/\/unsplash.com\/photos\//);
    const image = await sharp(
      new URL(`../public${photo.src}`, import.meta.url).pathname,
    ).metadata();
    assert.equal(image.format, "webp");
    assert.ok(image.width >= 1600);
    assert.ok(image.height >= 900);
  }
});
