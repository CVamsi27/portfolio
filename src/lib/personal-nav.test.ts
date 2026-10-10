import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PERSONAL_PRIMARY_NAV,
  PERSONAL_MORE_NAV,
  isPersonalPrimaryPath,
} from "./personal-nav.ts";
test("Roadmap is directly reachable and owns its active navigation state", () => {
  assert.equal(
    PERSONAL_PRIMARY_NAV.find((n) => n.id === "roadmap")?.href,
    "/roadmap",
  );
  assert.deepEqual(
    PERSONAL_PRIMARY_NAV.filter((n) =>
      isPersonalPrimaryPath("/roadmap", n.href),
    ).map((n) => n.id),
    ["roadmap"],
  );
  assert.equal(PERSONAL_MORE_NAV.filter((n) => n.id === "roadmap").length, 0);
  assert.deepEqual(
    PERSONAL_PRIMARY_NAV.filter((n) =>
      isPersonalPrimaryPath("/todo", n.href),
    ).map((n) => n.id),
    ["plan"],
  );
});
