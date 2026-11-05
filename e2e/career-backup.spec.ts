import { test, expect } from "@playwright/test";
import { applyBackup, collectBackup, BACKUP_VERSION } from "../src/lib/backup";

const role = {
  id: "synthetic-role",
  company: "Example Engineering",
  title: "Full-stack engineer",
  roleUrl: "https://example.test/jobs/one",
  kind: "employment",
  location: "India remote",
  availability: "active",
  checkedOn: "2026-11-05",
  eligibility: "eligible",
  eligibilityEvidence: "The exact listing permits remote India.",
  fit: ["React"],
  gaps: [],
  questions: [],
  suggestedAction: "Prepare application",
  rank: 1,
  compensation: "Unconfirmed",
  contacts: [],
  draft: "Unsent draft",
  updatedAt: 1,
};
const opportunity = {
  id: role.id,
  stage: "applied",
  priority: 1,
  draft: "Saved draft",
  notes: "Keep this note",
  nextAction: "Wait for reply",
  followUpOn: "2026-11-12",
  scope: "",
  terms: "",
  weeklyHours: "",
  startOn: null,
  firstPaymentOn: null,
  updatedAt: 2,
};
const activity = {
  id: "application-one",
  opportunityId: role.id,
  kind: "application",
  date: "2026-11-05",
  reference: "Actual submission receipt",
  note: "Sent manually",
  updatedAt: 3,
};
const file = (data: Record<string, unknown>) => ({
  app: "vk-tracker-suite",
  version: BACKUP_VERSION,
  exportedAt: "2026-11-05T00:00:00Z",
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

test("career facts, actual actions and drafts survive backup and restore", () => {
  storage.set("vk:career:research", JSON.stringify({ [role.id]: role }));
  storage.set(
    "vk:career:opportunities",
    JSON.stringify({ [role.id]: opportunity }),
  );
  storage.set(
    "vk:career:activities",
    JSON.stringify({ [activity.id]: activity }),
  );
  const backup = collectBackup();
  expect(backup.data["career:research"]).toEqual({ [role.id]: role });
  expect(backup.data["career:opportunities"]).toEqual({
    [role.id]: opportunity,
  });
  expect(backup.data["career:activities"]).toEqual({ [activity.id]: activity });
  storage.clear();
  expect(applyBackup(backup).ok).toBe(true);
  expect(
    JSON.parse(storage.get("vk:career:opportunities")!)[role.id].followUpOn,
  ).toBe("2026-11-12");
  expect(
    JSON.parse(storage.get("vk:career:activities")!)[activity.id].reference,
  ).toBe("Actual submission receipt");
  expect(storage.get("vk:career:activities:pending")).toBe("true");
});

test("invalid career records reject the entire backup before writes or snapshots", () => {
  for (const data of [
    {
      "career:research": {
        [role.id]: { ...role, roleUrl: "javascript:alert(1)" },
      },
    },
    { "career:research": { wrong: role } },
    {
      "career:opportunities": {
        [role.id]: { ...opportunity, followUpOn: "2026-02-30" },
      },
    },
    { "career:activities": { [activity.id]: { ...activity, reference: "" } } },
    {
      "career:activities": {
        payment: {
          ...activity,
          id: "payment",
          kind: "payment",
          amount: 100,
          currency: "",
        },
      },
    },
  ]) {
    storage.clear();
    storage.set("vk:prefs", '{"theme":"dark"}');
    const before = Array.from(storage.entries());
    expect(applyBackup(file({ prefs: { theme: "light" }, ...data })).ok).toBe(
      false,
    );
    expect(Array.from(storage.entries())).toEqual(before);
  }
});
