import { test, expect } from "@playwright/test";
import { applyBackup, collectBackup, BACKUP_VERSION } from "../src/lib/backup";
import type { NutritionProgram } from "../src/lib/nutrition-program";

const makeProgram = (): NutritionProgram => ({
  id: "program",
  startDate: "2026-10-07",
  mode: "flexible",
  goal: "maintain",
  days: Array.from({ length: 7 }, () => ({
    energy: 2000,
    protein: 100,
    carbs: 200,
    fat: 80,
  })),
  updatedAt: 1,
});
const makeRecipe = () => ({
  id: "recipe",
  name: "Rice bowl",
  basisAmount: 4,
  basisUnit: "serving",
  nutrients: { energy: 250 },
  source: "User-entered · label",
  updatedAt: 1,
  ingredients: [
    { name: "Rice", nutrients: { energy: 1000 }, quantity: 400, unit: "g" },
  ],
  servings: 4,
  cookedWeightGrams: 800,
  notes: "Weigh after cooking",
});
const file = (data: Record<string, unknown>) => ({
  app: "vk-tracker-suite",
  version: BACKUP_VERSION,
  exportedAt: "2026-10-07T00:00:00Z",
  data,
});
let originalWindow: PropertyDescriptor | undefined;
let storage: Map<string, string>;
test.beforeEach(() => {
  originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  storage = new Map();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) =>
          storage.set(key, String(value)),
        removeItem: (key: string) => storage.delete(key),
      },
    },
  });
});
test.afterEach(() => {
  if (originalWindow)
    Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

test("nutrition program and day reviews survive export and restore with pending sync", () => {
  const program = makeProgram();
  const day = { id: "2026-10-07", status: "complete", updatedAt: 2 };
  storage.set("vk:nutrition:programs", JSON.stringify({ program }));
  storage.set("vk:nutrition:days", JSON.stringify({ [day.id]: day }));
  const backup = collectBackup();
  expect(backup.data["nutrition:programs"]).toEqual({ program });
  expect(backup.data["nutrition:days"]).toEqual({ [day.id]: day });
  storage.clear();
  const report = applyBackup(backup);
  expect(report.ok).toBe(true);
  expect(report.keysRestored).toEqual(
    expect.arrayContaining(["nutrition:programs", "nutrition:days"]),
  );
  expect(JSON.parse(storage.get("vk:nutrition:programs")!)).toEqual({
    program,
  });
  expect(storage.get("vk:nutrition:days:pending")).toBe("true");
});

test("invalid nutrition programs and mismatched record ids reject the entire import before snapshots", () => {
  for (const program of [
    { ...makeProgram(), days: [] },
    { ...makeProgram(), id: "mismatch" },
    { ...makeProgram(), startDate: "2026-02-30" },
  ]) {
    storage.clear();
    storage.set("vk:prefs", '{"theme":"dark"}');
    const before = Array.from(storage.entries());
    const report = applyBackup(
      file({ prefs: { theme: "light" }, "nutrition:programs": { program } }),
    );
    expect(report.ok).toBe(false);
    expect(Array.from(storage.entries())).toEqual(before);
  }
});

test("invalid and mismatched nutrition-day records cannot replace existing data", () => {
  for (const day of [
    { id: "2026-10-07", status: "invalid", updatedAt: 1 },
    { id: "2026-10-08", status: "complete", updatedAt: 1 },
    { id: "2026-10-07", status: "complete", updatedAt: -1 },
  ]) {
    storage.clear();
    storage.set("vk:nutrition:days", "{}");
    const before = Array.from(storage.entries());
    expect(
      applyBackup(
        file({
          "nutrition:days": { "2026-10-07": day },
          "nutrition:programs": { program: makeProgram() },
        }),
      ).ok,
    ).toBe(false);
    expect(Array.from(storage.entries())).toEqual(before);
  }
});

test("rich recipes preserve preparation metadata and legacy recipes remain importable", () => {
  const rich = makeRecipe();
  const { servings: _s, cookedWeightGrams: _g, notes: _n, ...legacy } = rich;
  expect(
    applyBackup(
      file({
        "nutrition:recipes": {
          recipe: rich,
          legacy: { ...legacy, id: "legacy" },
        },
      }),
    ).ok,
  ).toBe(true);
  const restored = JSON.parse(storage.get("vk:nutrition:recipes")!);
  expect(restored.recipe).toEqual(rich);
  expect(restored.legacy).toEqual({ ...legacy, id: "legacy" });
});

test("invalid optional recipe yields and notes reject all writes rather than losing metadata", () => {
  for (const patch of [
    { servings: 0 },
    { servings: Infinity },
    { servings: "4" },
    { cookedWeightGrams: -1 },
    { cookedWeightGrams: NaN },
    { notes: "x".repeat(2001) },
    { notes: [] },
    { ingredients: [null] },
  ]) {
    storage.clear();
    storage.set("vk:prefs", '{"theme":"dark"}');
    const before = Array.from(storage.entries());
    const report = applyBackup(
      file({
        prefs: { theme: "light" },
        "nutrition:recipes": { recipe: { ...makeRecipe(), ...patch } },
      }),
    );
    expect(report.ok).toBe(false);
    expect(Array.from(storage.entries())).toEqual(before);
  }
});

test('meal templates and prepared snapshots are backed up without becoming intake',()=>{
 const recipe=makeRecipe();
 const template={id:'usual',name:'Usual meal',items:[{food:{...recipe,id:'food',basisAmount:100,basisUnit:'g'},quantity:150}],updatedAt:1};
 const batch={id:'batch',recipe,preparedDate:'2026-10-07',updatedAt:1};
 storage.set('vk:nutrition:templates',JSON.stringify({usual:template}));
 storage.set('vk:nutrition:batches',JSON.stringify({batch}));
 const backup=collectBackup();
 expect(backup.data['nutrition:templates']).toEqual({usual:template});
 expect(backup.data['nutrition:batches']).toEqual({batch});
 storage.clear();
 const result=applyBackup(backup);
 expect(result.ok).toBe(true);
 expect(JSON.parse(storage.get('vk:nutrition:batches')!)).toEqual({batch});
 expect(storage.has('vk:nutrition:entries')).toBe(false);
});
test('invalid reusable meals reject the whole restore before replacing any record',()=>{
 const before=JSON.stringify({unchanged:true});storage.set('vk:nutrition:foods',before);
 const result=applyBackup(file({'nutrition:templates':{bad:{id:'bad',name:'Bad',items:[],updatedAt:1}},'nutrition:foods':{}}));
 expect(result.ok).toBe(false);expect(storage.get('vk:nutrition:foods')).toBe(before);
});
test('undeclared portions and unpaired batch metadata are rejected before any restore',()=>{
 const invalid={...makeRecipe(),portions:[{name:'cup',amount:0,unit:'serving'}]};
 expect(applyBackup(file({'nutrition:recipes':{recipe:invalid}})).ok).toBe(false);
 const entry={...makeRecipe(),id:'portion',foodId:'recipe',date:'2026-10-07',meal:'Lunch',quantity:1,batchId:'batch'};
 expect(applyBackup(file({'nutrition:entries':{portion:entry}})).ok).toBe(false);
});
