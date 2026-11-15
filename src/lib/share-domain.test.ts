import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSharedDropPayload,
  dropHasImages,
  dropImageSources,
  imageStoragePath,
  isInlineImage,
  storagePathFromUrl,
} from "./share-domain.ts";

const inline = "data:image/jpeg;base64,abc";
const publicUrl =
  "https://project.supabase.co/storage/v1/object/public/drops/uid/one.png";

test("gallery order wins and repeated picks are preserved", () => {
  assert.deepEqual(
    dropImageSources({ images: [inline, inline, "uid/two.jpg"] }),
    [inline, inline, "uid/two.jpg"],
  );
});

test("legacy single-image fields fold into the gallery without duplicates", () => {
  assert.deepEqual(dropImageSources({ image: "uid/one.jpg" }), ["uid/one.jpg"]);
  assert.deepEqual(
    dropImageSources({
      image: "uid/one.jpg",
      imagePath: "uid/one.jpg",
      images: ["uid/one.jpg"],
    }),
    ["uid/one.jpg"],
  );
  assert.deepEqual(
    dropImageSources({
      image: "https://cdn.test/one.png",
      imagePath: "uid/one.png",
      images: ["uid/one.png"],
    }),
    ["uid/one.png", "https://cdn.test/one.png"],
  );
});

test("empty and missing image fields report no media", () => {
  assert.deepEqual(dropImageSources({}), []);
  assert.deepEqual(dropImageSources({ image: null, images: [] }), []);
  assert.equal(dropHasImages({ image: inline }), true);
  assert.equal(dropHasImages({ text: "note" } as never), false);
});

test("image references resolve to storage paths or inline bytes", () => {
  assert.equal(imageStoragePath(inline), null);
  assert.equal(imageStoragePath("uid/one.jpg"), "uid/one.jpg");
  assert.equal(imageStoragePath(publicUrl), "uid/one.png");
  assert.equal(
    imageStoragePath(
      "https://project.supabase.co/storage/v1/object/sign/drops/uid/a.jpg?token=1",
    ),
    "uid/a.jpg",
  );
  assert.equal(isInlineImage(inline), true);
  assert.equal(isInlineImage("uid/a.jpg"), false);
  assert.equal(storagePathFromUrl("https://cdn.test/no-marker.png"), null);
});

test("a single-image share publishes image_path only", () => {
  const payload = buildSharedDropPayload({
    owner: "user-1",
    text: "note",
    imagePath: "uid/one.jpg",
    expiresAt: null,
    createdFromDrop: "drop-1",
    ownerEmail: "me@example.com",
    access: "private",
    allowedEmails: ["friend@example.com"],
  });
  assert.equal(payload.image_path, "uid/one.jpg");
  assert.equal("image_paths" in payload, false);
  assert.deepEqual(payload.allowed_emails, ["friend@example.com"]);
});

test("a gallery share publishes every path with the first as the cover", () => {
  const payload = buildSharedDropPayload({
    owner: "user-1",
    text: "note",
    imagePath: "uid/one.jpg",
    imagePaths: ["uid/one.jpg", "uid/two.jpg", "uid/three.jpg"],
    expiresAt: "2026-12-01T00:00:00.000Z",
    createdFromDrop: "drop-1",
    ownerEmail: "me@example.com",
    access: "public",
    allowedEmails: ["ignored@example.com"],
  });
  assert.equal(payload.image_path, "uid/one.jpg");
  assert.deepEqual(payload.image_paths, [
    "uid/one.jpg",
    "uid/two.jpg",
    "uid/three.jpg",
  ]);
  assert.equal(payload.is_public, true);
  assert.deepEqual(payload.allowed_emails, []);
});

test("imagePaths without a cover still fills image_path", () => {
  const payload = buildSharedDropPayload({
    owner: "user-1",
    text: "",
    imagePath: null,
    imagePaths: ["uid/only.jpg"],
    expiresAt: null,
    createdFromDrop: "drop-1",
    ownerEmail: null,
    access: "public",
    allowedEmails: [],
  });
  assert.equal(payload.image_path, "uid/only.jpg");
  assert.equal("image_paths" in payload, false);
});

test("a text-only share sends no image columns", () => {
  const payload = buildSharedDropPayload({
    owner: "user-1",
    text: "hello",
    imagePath: null,
    imagePaths: [],
    expiresAt: null,
    createdFromDrop: "drop-1",
    ownerEmail: null,
    access: "private",
    allowedEmails: [],
  });
  assert.equal(payload.image_path, null);
  assert.equal("image_paths" in payload, false);
});
