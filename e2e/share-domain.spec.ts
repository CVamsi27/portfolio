import { expect, test } from "@playwright/test";
import { buildSharedDropPayload } from "../src/lib/share-domain";

test("public share payload includes the authenticated owner required by RLS", () => {
  expect(buildSharedDropPayload({
    id: "drop-1",
    owner: "user-123",
    text: "A public note",
    expiresAt: "2026-10-01T00:00:00.000Z",
    imagePath: null,
    createdFromDrop: "drop-1",
    access: "public",
    ownerEmail: "cvamsik99@gmail.com",
    allowedEmails: [],
  })).toMatchObject({
    id: "drop-1",
    owner: "user-123",
    is_public: true,
    allowed_emails: [],
  });
});
