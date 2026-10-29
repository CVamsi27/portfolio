import { test, expect, type Page } from "@playwright/test";
import {
  applyBackup,
  applyBackupWithHistory,
  collectBackup,
  BACKUP_VERSION,
} from "../src/lib/backup";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  encodeTrackerHistory,
  decodeTrackerHistory,
} from "../src/lib/tracker-history";

async function withMountedRestore(
  page: Page,
  run: (
    snapshot: () => Promise<{
      value: { enabled: boolean };
      status: string;
      userId: string;
    }>,
  ) => Promise<void>,
) {
  // Bundle the real hook into a browser fixture: no runtime test page or dependency.
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const { webpack } = require("next/dist/compiled/webpack/webpack.js");
  const directory = await mkdtemp(path.join(tmpdir(), "nova-restore-"));
  try {
    const loader = path.join(directory, "typescript.cjs");
    await writeFile(
      loader,
      `const ts = require(${JSON.stringify(require.resolve("typescript"))}); module.exports = function(source) { return ts.transpileModule(source, { fileName: this.resourcePath, compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText; };`,
    );
    await new Promise<void>((resolve, reject) =>
      webpack(
        {
          mode: "development",
          devtool: false,
          target: "web",
          entry: path.resolve("e2e/fixtures/pending-restore.tsx"),
          output: { path: directory, filename: "fixture.js" },
          resolve: { extensions: [".tsx", ".ts", ".js"] },
          module: { rules: [{ test: /\.tsx?$/, use: loader }] },
          plugins: [
            new webpack.DefinePlugin({
              "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(
                "https://fixture.supabase.test",
              ),
              "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY":
                JSON.stringify("fixture-key"),
            }),
          ],
        },
        (
          error: Error | null,
          stats: { hasErrors(): boolean; toString(): string },
        ) =>
          error || stats.hasErrors()
            ? reject(error ?? new Error(stats.toString()))
            : resolve(),
      ),
    );
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({
      content: await readFile(path.join(directory, "fixture.js"), "utf8"),
    });
    const snapshot = () =>
      page
        .getByTestId("restore-store")
        .textContent()
        .then((text) => JSON.parse(text!));
    await run(snapshot);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("mounted account store uploads a restored opt-out immediately and waits for acknowledgement", async ({
  page,
}) => {
  await withMountedRestore(page, async (snapshot) => {
    await expect.poll(async () => (await snapshot()).status).toBe("synced");
    expect((await snapshot()).value.enabled).toBe(true);
    expect(await page.evaluate(() => window.restoreHarness.restore())).toBe(
      true,
    );
    await expect
      .poll(() =>
        page.evaluate(() => window.restoreHarness.inspect().writes.length),
      )
      .toBe(1);
    expect((await snapshot()).value.enabled).toBe(false);
    expect((await snapshot()).status).toBe("syncing");
    expect(
      (await page.evaluate(() => window.restoreHarness.inspect())).cloud,
    ).toMatchObject({ enabled: true });
    await page.evaluate(() => window.restoreHarness.acknowledge(true));
    await expect.poll(async () => (await snapshot()).status).toBe("error");
    expect(
      (await page.evaluate(() => window.restoreHarness.inspect())).pending,
    ).toBe("true");
    await page.evaluate(() =>
      window.dispatchEvent(new StorageEvent("storage")),
    );
    await expect
      .poll(() =>
        page.evaluate(() => window.restoreHarness.inspect().writes.length),
      )
      .toBe(2);
    expect((await snapshot()).status).toBe("syncing");
    await page.evaluate(() => window.restoreHarness.acknowledge());
    await expect.poll(async () => (await snapshot()).status).toBe("synced");
    expect(
      (await page.evaluate(() => window.restoreHarness.inspect())).cloud,
    ).toMatchObject({ enabled: false, enabledAt: null });
    expect(
      (await page.evaluate(() => window.restoreHarness.inspect())).pending,
    ).toBeNull();
    await page.evaluate(() => window.restoreHarness.switchAccount());
    await expect
      .poll(async () => (await snapshot()).userId)
      .toBe("fixture-other");
    await page.evaluate(() => window.restoreHarness.queueOldAccount());
    expect(
      (await page.evaluate(() => window.restoreHarness.inspect())).writes,
    ).toHaveLength(2);
  });
});

test("a restore queues behind an in-flight enable and its latest opt-out wins", async ({
  page,
}) => {
  await withMountedRestore(page, async (snapshot) => {
    await expect.poll(async () => (await snapshot()).status).toBe("synced");
    await page.evaluate(() => window.restoreHarness.enable());
    await expect
      .poll(() =>
        page.evaluate(() => window.restoreHarness.inspect().writes.length),
      )
      .toBe(1);
    expect(await page.evaluate(() => window.restoreHarness.restore())).toBe(
      true,
    );
    // Attempt the dangerous reverse acknowledgement order. Serialization means
    // the second request cannot exist until the first request has settled.
    expect(
      await page.evaluate(() => window.restoreHarness.acknowledge(false, 1)),
    ).toBe(false);
    expect(
      (await page.evaluate(() => window.restoreHarness.inspect())).writes,
    ).toHaveLength(1);
    expect(
      (await page.evaluate(() => window.restoreHarness.inspect())).pending,
    ).toBe("true");
    expect((await snapshot()).value.enabled).toBe(false);
    expect((await snapshot()).status).toBe("syncing");
    await page.evaluate(() => window.restoreHarness.acknowledge(false, 0));
    await expect
      .poll(() =>
        page.evaluate(() => window.restoreHarness.inspect().writes.length),
      )
      .toBe(2);
    expect(
      (await page.evaluate(() => window.restoreHarness.inspect())).pending,
    ).toBe("true");
    expect((await snapshot()).status).toBe("syncing");
    await page.evaluate(() => window.restoreHarness.acknowledge(false, 1));
    await expect.poll(async () => (await snapshot()).status).toBe("synced");
    expect(
      (await page.evaluate(() => window.restoreHarness.inspect())).cloud,
    ).toMatchObject({ enabled: false, enabledAt: null });
    expect(
      (await page.evaluate(() => window.restoreHarness.inspect())).pending,
    ).toBeNull();
  });
});

const careerPreferences = {
  version: 1,
  enabled: true,
  cadence: "digest-only",
  digestTime: "06:00",
  timezone: "Asia/Kolkata",
  catchUpMinutes: 5,
  enabledAt: "2026-10-27T00:00:00.000Z",
};

function withLocalStorage<T>(run: (store: Map<string, string>) => T): T {
  const store = new Map<string, string>();
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "";
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, String(value)),
        removeItem: (key: string) => store.delete(key),
      },
    },
  });
  const restore = () => {
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  };
  try {
    const result = run(store);
    if (result instanceof Promise) return result.finally(restore) as T;
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

test("career backup preserves cadence but restore requires fresh notification opt-in", () => {
  withLocalStorage((store) => {
    store.set(
      "vk:career:telegram-preferences",
      JSON.stringify(careerPreferences),
    );
    const backup = collectBackup();
    expect(backup.data["career:telegram-preferences"]).toEqual(
      careerPreferences,
    );
    store.clear();
    const report = applyBackup(backup);
    expect(report.ok).toBe(true);
    expect(report.keysRestored).toContain("career:telegram-preferences");
    expect(JSON.parse(store.get("vk:career:telegram-preferences")!)).toEqual({
      ...careerPreferences,
      enabled: false,
      enabledAt: null,
    });
  });
});

test("invalid career backup rejects every write before taking a restore snapshot", () => {
  withLocalStorage((store) => {
    store.set("vk:prefs", '{"theme":"dark"}');
    for (const patch of [
      { enabledAt: null },
      { digestTime: "25:00" },
      { catchUpMinutes: 11 },
      { timezone: "UTC" },
    ]) {
      const before = Array.from(store.entries());
      const report = applyBackup({
        app: "vk-tracker-suite",
        version: BACKUP_VERSION,
        data: {
          prefs: { theme: "light" },
          "career:telegram-preferences": { ...careerPreferences, ...patch },
        },
      });
      expect(report.ok).toBe(false);
      expect(Array.from(store.entries())).toEqual(before);
    }
  });
});

test("restore rejects unknown history formats before changing any tracker data", () => {
  withLocalStorage((store) => {
    store.set("vk:prefs", '{"theme":"dark"}');
    const before = Array.from(store.entries());
    const report = applyBackup({
      app: "vk-tracker-suite",
      version: BACKUP_VERSION,
      data: {
        prefs: { theme: "light" },
        career_command_center: {
          roadmapHistory: {
            __novaHistory: 99,
            codec: "unknown",
            data: "discarded-history",
          },
        },
      },
    });
    expect(report.ok).toBe(false);
    expect(report.error).toMatch(/history/i);
    expect(Array.from(store.entries())).toEqual(before);
  });
});

test("synchronous restore refuses compressed active roadmap and timetable fields without integrity validation", () => {
  withLocalStorage((store) => {
    store.set("vk:prefs", '{"theme":"dark"}');
    for (const data of [
      {
        career_command_center: {
          germanyRoadmap: {
            __novaHistory: 1,
            codec: "gzip-base64",
            data: "unknown compressed plan",
          },
        },
      },
      {
        timetable_100_days: {
          days: {
            __novaHistory: 1,
            codec: "gzip-base64",
            data: "unknown compressed days",
          },
        },
      },
    ]) {
      const before = Array.from(store.entries());
      const result = applyBackup({
        app: "vk-tracker-suite",
        version: BACKUP_VERSION,
        data: { prefs: { theme: "light" }, ...data },
      });
      expect(result.ok).toBe(false);
      expect(Array.from(store.entries())).toEqual(before);
    }
  });
});

test("export preserves a valid compressed history envelope without decoding or replacing it", async () => {
  const career = {
    active: { title: "Current synthetic roadmap" },
    roadmapHistory: [
      {
        title: "Historical synthetic roadmap",
        note: "Retained history. ".repeat(20000),
      },
    ],
  };
  const wire = await encodeTrackerHistory("career_command_center", career);
  withLocalStorage((store) => {
    store.set("vk:career_command_center", JSON.stringify(wire));
    const backup = collectBackup();
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.data.career_command_center).toEqual(wire);
    expect(backup.data.career_command_center).not.toEqual(career);
  });
});

test("validated restore preserves locally compressed active fields and histories through an export round trip", async () => {
  const career = {
    active: { title: "Current synthetic roadmap" },
    germanyRoadmap: {
      title: "Current synthetic plan",
      note: "Retained current assignment. ".repeat(20000),
    },
    roadmapHistory: [
      {
        title: "Historical synthetic roadmap",
        note: "Retained career history. ".repeat(20000),
      },
    ],
  };
  const timetable = {
    timezone: "Asia/Kolkata",
    days: [
      {
        date: "2026-10-30",
        schedule: { "09:00-14:00": "Current study" },
        note: "Retained current timetable day. ".repeat(20000),
      },
    ],
    scheduleHistory: [
      {
        days: [
          {
            date: "2026-10-29",
            note: "Retained timetable history. ".repeat(20000),
          },
        ],
      },
    ],
  };
  const careerWire = await encodeTrackerHistory(
    "career_command_center",
    career,
    { local: true },
  );
  const timetableWire = await encodeTrackerHistory(
    "timetable_100_days",
    timetable,
    { local: true },
  );
  expect(careerWire.germanyRoadmap).not.toEqual(career.germanyRoadmap);
  expect(timetableWire.days).not.toEqual(timetable.days);
  await withLocalStorage(async (store) => {
    store.set("vk:career_command_center", JSON.stringify(careerWire));
    store.set("vk:timetable_100_days", JSON.stringify(timetableWire));
    const backup = collectBackup();
    store.clear();
    const result = await applyBackupWithHistory(backup);
    expect(result.ok).toBe(true);
    expect(result.keysRestored).toEqual(
      expect.arrayContaining(["career_command_center", "timetable_100_days"]),
    );
    expect(JSON.parse(store.get("vk:career_command_center")!)).toEqual(
      careerWire,
    );
    expect(JSON.parse(store.get("vk:timetable_100_days")!)).toEqual(
      timetableWire,
    );
    expect(
      await decodeTrackerHistory(
        "career_command_center",
        JSON.parse(store.get("vk:career_command_center")!),
        { local: true },
      ),
    ).toEqual(career);
    expect(
      await decodeTrackerHistory(
        "timetable_100_days",
        JSON.parse(store.get("vk:timetable_100_days")!),
        { local: true },
      ),
    ).toEqual(timetable);
  });
});

test("validated restore rejects corrupt or unknown history before snapshots and unrelated writes", async () => {
  const career = await encodeTrackerHistory("career_command_center", {
    roadmapHistory: [{ note: "Retained history. ".repeat(20000) }],
  });
  const envelope = career.roadmapHistory as unknown as Record<string, unknown>;
  await withLocalStorage(async (store) => {
    store.set("vk:prefs", '{"theme":"dark"}');
    for (const history of [
      { ...envelope, __novaHistory: 2 },
      { ...envelope, codec: "unknown" },
      { ...envelope, sha256: "0".repeat(64) },
      { ...envelope, data: "not base64" },
      { ...envelope, bytes: Number(envelope.bytes) + 1 },
      { codec: "unknown" },
      null,
    ]) {
      const before = Array.from(store.entries());
      const result = await applyBackupWithHistory({
        app: "vk-tracker-suite",
        version: BACKUP_VERSION,
        data: {
          prefs: { theme: "light" },
          career_command_center: { roadmapHistory: history },
        },
      });
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/history/i);
      expect(Array.from(store.entries())).toEqual(before);
    }
  });
});

test("validated restore rejects damaged active fields and envelopes with the wrong decoded shape", async () => {
  const career = await encodeTrackerHistory(
    "career_command_center",
    { germanyRoadmap: { note: "Current plan. ".repeat(30000) } },
    { local: true },
  );
  const timetable = await encodeTrackerHistory(
    "timetable_100_days",
    { days: [{ note: "Current day. ".repeat(30000) }] },
    { local: true },
  );
  const roadmapEnvelope = career.germanyRoadmap as unknown as Record<
    string,
    unknown
  >;
  const daysEnvelope = timetable.days as unknown as Record<string, unknown>;
  await withLocalStorage(async (store) => {
    store.set("vk:prefs", '{"theme":"dark"}');
    for (const data of [
      {
        career_command_center: {
          germanyRoadmap: { ...roadmapEnvelope, sha256: "0".repeat(64) },
        },
      },
      {
        timetable_100_days: {
          days: { ...daysEnvelope, sha256: "0".repeat(64) },
        },
      },
      { career_command_center: { germanyRoadmap: daysEnvelope } },
      { timetable_100_days: { days: roadmapEnvelope } },
    ]) {
      const before = Array.from(store.entries());
      const result = await applyBackupWithHistory({
        app: "vk-tracker-suite",
        version: BACKUP_VERSION,
        data: { prefs: { theme: "light" }, ...data },
      });
      expect(result.ok).toBe(false);
      expect(Array.from(store.entries())).toEqual(before);
    }
  });
});

test("validated restore keeps legacy history arrays and unrelated fields intact", async () => {
  await withLocalStorage(async (store) => {
    const career = {
      roadmapHistory: [{ title: "Legacy history" }],
      retained: { custom: true },
    };
    const result = await applyBackupWithHistory({
      app: "vk-tracker-suite",
      version: BACKUP_VERSION,
      data: { career_command_center: career },
    });
    expect(result.ok).toBe(true);
    expect(JSON.parse(store.get("vk:career_command_center")!)).toEqual(career);
  });
});

test("a storage failure during validated history restore rolls back all data and snapshots", async () => {
  const career = await encodeTrackerHistory("career_command_center", {
    roadmapHistory: [{ note: "Retained history. ".repeat(20000) }],
  });
  await withLocalStorage(async (store) => {
    store.set("vk:prefs", '{"theme":"dark"}');
    store.set(
      "vk:career_command_center",
      '{"roadmapHistory":[{"title":"Original history"}]}',
    );
    store.set("vk:pre-import", '{"originalSnapshot":true}');
    const before = Array.from(store.entries());
    const originalSet = window.localStorage.setItem;
    let failed = false;
    window.localStorage.setItem = (key, value) => {
      if (key === "vk:career_command_center" && !failed) {
        failed = true;
        throw new DOMException("Synthetic device quota", "QuotaExceededError");
      }
      originalSet(key, value);
    };
    const result = await applyBackupWithHistory({
      app: "vk-tracker-suite",
      version: BACKUP_VERSION,
      data: { prefs: { theme: "light" }, career_command_center: career },
    });
    expect(failed).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Existing data was restored");
    expect(result.keysRestored).toEqual([]);
    expect(Array.from(store.entries())).toEqual(before);
  });
});

test("cloud import queues whole-value keys and stamps local sync metadata", () => {
  const store = new Map<string, string>();
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, String(value)),
        removeItem: (key: string) => store.delete(key),
      },
    },
  });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "example";

  try {
    const report = applyBackup({
      app: "vk-tracker-suite",
      version: BACKUP_VERSION,
      data: {
        todos: [
          {
            id: "t_restore",
            text: "Restored task",
            done: false,
            date: "2026-10-21",
            priority: "P2",
            tag: "Personal",
            createdAt: 1,
          },
        ],
      },
    });

    expect(report.ok).toBe(true);
    const local = "vk:account:signed-out:todos";
    expect(store.get(`${local}:pending`)).toBe("true");
    expect(Number(store.get(`${local}:meta`))).toBeGreaterThan(0);
  } finally {
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined)
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});
