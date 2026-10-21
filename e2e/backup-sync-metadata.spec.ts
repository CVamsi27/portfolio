import { test, expect } from "@playwright/test";
import { applyBackup, BACKUP_VERSION } from "../src/lib/backup";

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
