import test from "node:test";
import assert from "node:assert/strict";
import {
  catalogQuery,
  normalizeFdcPortions,
  searchCatalog,
  validCatalogFood,
  portionQuantity,
  readCatalog,
  cacheFoods,
  type CatalogFood,
} from "./nutrition-catalog.ts";
const food: CatalogFood = {
  id: "rice",
  name: "Rice",
  basisAmount: 100,
  basisUnit: "g",
  nutrients: { energy: 130, calcium: null, sodium: 0 },
  source: "Declared label",
  updatedAt: 1,
  portions: [{ name: "Bowl", amount: 1, unit: "serving", gramWeight: 180 }],
};
test("declared portions convert only explicit grams or compatible units", () => {
  assert.equal(portionQuantity(food, food.portions![0]), 180);
  assert.equal(
    portionQuantity(food, { name: "Grams", amount: 75, unit: "g" }),
    75,
  );
  assert.equal(
    portionQuantity(food, { name: "Cup", amount: 1, unit: "serving" }),
    null,
  );
  assert.equal(
    portionQuantity({ ...food, basisUnit: "ml" }, food.portions![0]),
    null,
  );
});
test("aliases aid retrieval without changing or inventing food snapshots", () => {
  assert.equal(catalogQuery("curds"), "yogurt");
  const yogurt = { ...food, id: "yogurt", name: "Plain yogurt" };
  const matches = searchCatalog([yogurt, food], "curds");
  assert.deepEqual(matches, [yogurt]);
  assert.equal(matches[0].nutrients.calcium, null);
  assert.equal(matches[0].nutrients.sodium, 0);
  assert.equal(catalogQuery("Dal cooked"), "lentils cooked");
});
test("catalog rejects malformed portions, invalid snapshots and deleted records", () => {
  assert.equal(validCatalogFood(food), true);
  for (const change of [
    { portions: [{ name: "Cup", amount: 0, unit: "g" }] },
    { portions: [{ name: "Cup", amount: 1, unit: "g", gramWeight: -1 }] },
    { portions: "bad" },
    { deleted: true },
    { source: "" },
  ])
    assert.equal(validCatalogFood({ ...food, ...change }), false);
});
test("storage unavailable and invalid accounts are explicit failures", async () => {
  await assert.rejects(readCatalog("account:a"), /storage/i);
  await assert.rejects(cacheFoods("account:a", [food], 1), /storage/i);
  await assert.rejects(readCatalog(""), /scope/i);
  await assert.rejects(cacheFoods("account:a", [food], -1), /timestamp/i);
});

function installStorage() {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  const records = new Map<string, unknown>();
  let fail = false;
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: {
      open: () => {
        const request: Record<string, unknown> = {};
        request.result = {
          close() {},
          transaction() {
            const tx: Record<string, unknown> = {};
            let pending = 0,
              ended = false;
            const stage = new Map(records);
            const finish = () => {
              if (pending || ended) return;
              ended = true;
              if (fail) {
                tx.error = new Error("Quota exceeded");
                (tx.onabort as () => void)?.();
              } else {
                records.clear();
                for (const [key, value] of stage) records.set(key, value);
                (tx.oncomplete as () => void)?.();
              }
            };
            const perform = (key: string, action: string, value?: unknown) => {
              pending++;
              const item: Record<string, unknown> = {};
              queueMicrotask(() => {
                item.result =
                  action === "get" ? structuredClone(stage.get(key)) : key;
                if (action === "put") stage.set(key, structuredClone(value));
                if (action === "delete") stage.delete(key);
                (item.onsuccess as () => void)?.();
                pending--;
                queueMicrotask(finish);
              });
              return item;
            };
            tx.abort = () => {
              ended = true;
              (tx.onabort as () => void)?.();
            };
            tx.objectStore = () => ({
              get: (key: string) => perform(key, "get"),
              put: (value: unknown, key: string) => perform(key, "put", value),
              delete: (key: string) => perform(key, "delete"),
            });
            return tx;
          },
        };
        queueMicrotask(() => (request.onsuccess as () => void)?.());
        return request;
      },
    },
  });
  return {
    records,
    fail: () => {
      fail = true;
    },
    restore: () => {
      if (previous) Object.defineProperty(globalThis, "indexedDB", previous);
      else Reflect.deleteProperty(globalThis, "indexedDB");
    },
  };
}
test("catalog commits whole snapshots, merges without older replacement, and isolates accounts", async (t) => {
  const storage = installStorage();
  t.after(storage.restore);
  const original = structuredClone(food);
  const save = cacheFoods("account:a", [original], 9);
  original.nutrients.energy = 999;
  await save;
  await cacheFoods("account:b", [{ ...food, id: "other" }], 8);
  await cacheFoods(
    "account:a",
    [{ ...food, updatedAt: 0, nutrients: { energy: 999 } }],
    10,
  );
  assert.equal((await readCatalog("account:a"))[0].food.nutrients.energy, 130);
  assert.equal((await readCatalog("account:a"))[0].retrievedAt, 9);
  assert.equal((await readCatalog("account:b"))[0].food.id, "other");
  assert.equal((await readCatalog("local")).length, 0);
});
test("commit failure rejects and corrupt stored data is preserved rather than overwritten", async (t) => {
  const storage = installStorage();
  t.after(storage.restore);
  storage.records.set("account:a", [{ food: { bad: true }, retrievedAt: 1 }]);
  await assert.rejects(readCatalog("account:a"), /invalid/);
  await assert.rejects(cacheFoods("account:a", [food], 1), /invalid/);
  assert.deepEqual(storage.records.get("account:a"), [
    { food: { bad: true }, retrievedAt: 1 },
  ]);
  storage.fail();
  await assert.rejects(cacheFoods("account:b", [food], 1), /Quota/);
  assert.equal(storage.records.has("account:b"), false);
});

test("query words that match object prototypes remain literal food names", () => {
  assert.equal(catalogQuery("constructor toString"), "constructor tostring");
});

test("USDA portion normalization preserves declared total gram weights without guessing densities", () => {
  assert.deepEqual(
    normalizeFdcPortions([
      {
        amount: 3,
        measureUnit: { name: "teaspoon", abbreviation: "tsp" },
        modifier: "level",
        gramWeight: 15,
      },
      { portionDescription: "1 cup, cooked", gramWeight: 180 },
      { amount: 1, modifier: "medium (7 inch)", gramWeight: 118 },
      { amount: 1, measureUnit: { name: "cup" }, gramWeight: null },
      { amount: 1, modifier: "10205", gramWeight: 180 },
      null,
    ]),
    [
      { name: "3 tsp, level", amount: 1, unit: "serving", gramWeight: 15 },
      { name: "1 cup, cooked", amount: 1, unit: "serving", gramWeight: 180 },
      {
        name: "1 medium (7 inch)",
        amount: 1,
        unit: "serving",
        gramWeight: 118,
      },
    ],
  );
  assert.deepEqual(normalizeFdcPortions({ bad: true }), []);
});
