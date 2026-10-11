import assert from "node:assert/strict";
import test from "node:test";
import {
  isAllowedPersonalUser,
  isLocalHost,
  isPersonalHost,
  isPublicPersonalPath,
  safePersonalReturn,
} from "./personal-access.ts";

const googleUser = (email: string) => ({
  email,
  email_confirmed_at: "2026-10-11T00:00:00Z",
  identities: [
    { provider: "google", identity_data: { email, email_verified: true } },
  ],
});

test("only the two exact verified Google identities can enter the workspace", () => {
  for (const email of [
    "cvamsik99@gmail.com",
    "srija210v@gmail.com",
    " CVamsik99@GMAIL.COM ",
  ])
    assert.equal(isAllowedPersonalUser(googleUser(email)), true);
  for (const email of [
    "other@gmail.com",
    "cvamsik99@gmail.com.evil",
    "cvamsik99+other@gmail.com",
    "",
  ])
    assert.equal(isAllowedPersonalUser(googleUser(email)), false);
  assert.equal(isAllowedPersonalUser(null), false);
  assert.equal(
    isAllowedPersonalUser({
      ...googleUser("cvamsik99@gmail.com"),
      email_confirmed_at: undefined,
    }),
    false,
  );
  assert.equal(
    isAllowedPersonalUser({
      ...googleUser("cvamsik99@gmail.com"),
      identities: [{ provider: "email" }],
    }),
    false,
  );
  assert.equal(
    isAllowedPersonalUser({
      ...googleUser("cvamsik99@gmail.com"),
      identities: googleUser("other@gmail.com").identities,
    }),
    false,
  );
  assert.equal(
    isAllowedPersonalUser({
      ...googleUser("cvamsik99@gmail.com"),
      identities: [
        {
          provider: "google",
          identity_data: {
            email: "cvamsik99@gmail.com",
            email_verified: false,
          },
        },
      ],
    }),
    false,
  );
});

test("host matching cannot turn lookalike production hosts into local development", () => {
  assert.equal(isPersonalHost("PERSONAL.BUILDORA.WORK:443"), true);
  assert.equal(isPersonalHost("personal.buildora.work.evil"), false);
  for (const host of [
    "localhost:3000",
    "127.0.0.1:4111",
    "[::1]:3000",
    "nova.local",
  ])
    assert.equal(isLocalHost(host), true);
  for (const host of ["localhost.evil", "127.evil", "buildora.work"])
    assert.equal(isLocalHost(host), false);
});

test("only sign-in and bootstrap assets are public on the personal host", () => {
  for (const path of [
    "/login",
    "/auth/callback",
    "/sw.js",
    "/manifest.webmanifest",
    "/icons/nova.svg",
    "/_next/static/chunk.js",
  ])
    assert.equal(isPublicPersonalPath(path), true, path);
  for (const path of [
    "/",
    "/hub",
    "/trackers/landing",
    "/share",
    "/share/123",
    "/api/share/123.svg",
    "/login/other",
    "/archive",
  ])
    assert.equal(isPublicPersonalPath(path), false, path);
});

test("callback destinations stay on protected relative pages", () => {
  assert.equal(safePersonalReturn("/goal?view=week"), "/goal?view=week");
  for (const path of [
    null,
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%5cevil.test",
    "/%2f%2fevil.test",
    "/login",
    "/auth/callback?code=secret",
    "/api/share/id",
    "/goal\nLocation: evil",
  ])
    assert.equal(safePersonalReturn(path), "/hub", String(path));
});
