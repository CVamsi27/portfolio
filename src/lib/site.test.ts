import test from "node:test";
import assert from "node:assert/strict";
import { PORTFOLIO_ORIGIN, PERSONAL_ORIGIN } from "./site.ts";

test("canonical origins match the deployed hosts", () => {
  assert.equal(PORTFOLIO_ORIGIN, "https://www.buildora.work");
  assert.equal(PERSONAL_ORIGIN, "https://personal.buildora.work");
  assert.equal(new URL(PORTFOLIO_ORIGIN).hostname, "www.buildora.work");
});
