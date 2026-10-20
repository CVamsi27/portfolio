import test from "node:test";
import assert from "node:assert/strict";
import { parseStoredValue } from "./local-parse.ts";

test("missing storage returns each caller's own default", () => {
  assert.deepEqual(parseStoredValue(null, { first: true }), { first: true });
  assert.deepEqual(parseStoredValue(null, { second: true }), { second: true });
});

test("stored JSON wins; null and corrupt JSON fall back", () => {
  assert.deepEqual(parseStoredValue('{"stored":true}', { stored: false }), {
    stored: true,
  });
  assert.deepEqual(parseStoredValue("null", { fallback: true }), {
    fallback: true,
  });
  assert.deepEqual(parseStoredValue("{", { fallback: true }), {
    fallback: true,
  });
});
