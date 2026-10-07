import test from "node:test";
import assert from "node:assert/strict";
import { assertDraftOwner } from "./nutrition-drafts.ts";
test("draft operations cannot cross an authentication boundary", () => {
  assert.doesNotThrow(() => assertDraftOwner("account:alice", true, "alice"));
  assert.throws(
    () => assertDraftOwner("account:alice", true, "bob"),
    /account|sign/i,
  );
  assert.throws(
    () => assertDraftOwner("account:alice", true, null),
    /account|sign/i,
  );
  assert.throws(
    () => assertDraftOwner("account:signed-out", true, null),
    /account|sign/i,
  );
  assert.doesNotThrow(() => assertDraftOwner("local", false, null));
  assert.throws(
    () => assertDraftOwner("account:alice", false, null),
    /account|sign/i,
  );
});
