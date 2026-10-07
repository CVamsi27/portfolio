import test from "node:test";
import assert from "node:assert/strict";
import { readDraft, writeDraft, deleteDraft } from "./nutrition-drafts.ts";
import type { MealDraft } from "./nutrition-meals.ts";

const draft: MealDraft = { id: "meal-1", date: "2026-10-07", meal: "Lunch", items: [], updatedAt: 1 };

test("unavailable durable storage is a visible failure, never a successful memory fallback", async () => {
  await assert.rejects(readDraft("account-a"), /storage/i);
  await assert.rejects(writeDraft("account-a", draft), /storage/i);
  await assert.rejects(deleteDraft("account-a"), /storage/i);
});

test("invalid drafts and scopes reject before opening storage", async () => {
  await assert.rejects(writeDraft("account-a", { ...draft, date: "2026-02-30" }), /draft/i);
  await assert.rejects(readDraft(""), /scope/i);
  await assert.rejects(deleteDraft(" "), /scope/i);
});

// Small event-driven transaction harness: tests the wrapper's commit/error
// contract and account keys. Actual IndexedDB persistence is exercised in browsers.
function installStorage() {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  const records = new Map<string, unknown>();
  let failCommit = false;
  const factory = {
    open: () => {
      const request: Record<string, unknown> = {};
      request.result = {
        close: () => {},
        transaction: () => {
          const transaction: Record<string, unknown> = {};
          const perform = (key: string, action: "get" | "put" | "delete", value?: unknown) => {
            const item: Record<string, unknown> = {};
            queueMicrotask(() => {
              item.result = action === "get" ? structuredClone(records.get(key)) : key;
              (item.onsuccess as (() => void) | undefined)?.();
              queueMicrotask(() => {
                if (failCommit) {
                  transaction.error = new Error("Quota exceeded");
                  (transaction.onabort as (() => void) | undefined)?.();
                } else {
                  if (action === "put") records.set(key, structuredClone(value));
                  if (action === "delete") records.delete(key);
                  (transaction.oncomplete as (() => void) | undefined)?.();
                }
              });
            });
            return item;
          };
          transaction.objectStore = () => ({
            get: (key: string) => perform(key, "get"),
            put: (value: unknown, key: string) => perform(key, "put", value),
            delete: (key: string) => perform(key, "delete"),
          });
          return transaction;
        },
      };
      queueMicrotask(() => (request.onsuccess as (() => void) | undefined)?.());
      return request;
    },
  };
  Object.defineProperty(globalThis, "indexedDB", { value: factory, configurable: true });
  return {
    records,
    fail: () => { failCommit = true; },
    restore: () => {
      if (previous) Object.defineProperty(globalThis, "indexedDB", previous);
      else Reflect.deleteProperty(globalThis, "indexedDB");
    },
  };
}

test("drafts isolate account keys, snapshot edits and delete only the selected account", async (t) => {
  const storage = installStorage(); t.after(storage.restore);
  const first = { ...draft, meal: "Breakfast" };
  const saving = writeDraft("account-a", first);
  first.meal = "Dinner";
  await saving;
  await writeDraft("account-b", { ...draft, id: "meal-2" });
  assert.equal((await readDraft("account-a"))?.meal, "Breakfast");
  assert.equal((await readDraft("account-b"))?.id, "meal-2");
  await deleteDraft("account-a");
  assert.equal(await readDraft("account-a"), null);
  assert.equal((await readDraft("account-b"))?.id, "meal-2");
});

test("a transaction failure after a successful request rejects a claimed save", async (t) => {
  const storage = installStorage(); t.after(storage.restore);
  storage.fail();
  await assert.rejects(writeDraft("account-a", draft), /Quota exceeded/);
  assert.equal(storage.records.has("account-a"), false);
  await assert.rejects(deleteDraft("account-a"), /Quota exceeded/);
});

test("corrupt persisted drafts surface an error and can be explicitly discarded", async (t) => {
  const storage = installStorage(); t.after(storage.restore);
  storage.records.set("account-a", { ...draft, items: [{ bad: true }] });
  await assert.rejects(readDraft("account-a"), /invalid/);
  await deleteDraft("account-a");
  assert.equal(await readDraft("account-a"), null);
});
