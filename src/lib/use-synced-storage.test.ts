import test from "node:test";
import assert from "node:assert/strict";
import type { TestContext } from "node:test";
import {
  subscribeRealtimeKey,
  getRealtimeHubDebugState,
  resetRealtimeHubsForTesting,
  type RealtimeItem,
} from "./use-synced-storage.ts";

test("Supabase Realtime Channel Multiplexer", async (t) => {
  // Mock window and Supabase environment for test runner
  const originalWindow = globalThis.window;
  const originalEnvUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalEnvKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  type ChannelHandler = (payload: { new?: RealtimeItem }) => void;
  let broadcastCallback: ChannelHandler | null = null;
  let channelCreatedCount = 0;
  let channelRemovedCount = 0;

  const mockChannel = {
    topic: "realtime:rt_tracker_data_testuser",
    on: (_type: string, _filter: unknown, callback: ChannelHandler) => {
      broadcastCallback = callback;
      return mockChannel;
    },
    subscribe: () => mockChannel,
  };

  const mockSupabase = {
    getChannels: () => [],
    channel: (_name: string) => {
      channelCreatedCount++;
      return mockChannel;
    },
    removeChannel: (_channel: unknown) => {
      channelRemovedCount++;
    },
  };

  // Setup globals
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-key";

  // Mock getSupabase via setSupabaseClientForTesting
  const { setSupabaseClientForTesting } = await import("./supabase/client.ts");
  setSupabaseClientForTesting(
    mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
  );

  t.after(() => {
    resetRealtimeHubsForTesting();
    (globalThis as unknown as { window: unknown }).window = originalWindow;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnvUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnvKey;
    setSupabaseClientForTesting(undefined);
  });

  await t.test(
    "multiplexes multiple subscriptions on the same key into a single channel",
    () => {
      const events1: RealtimeItem[] = [];
      const events2: RealtimeItem[] = [];

      const unsub1 = subscribeRealtimeKey(
        "testuser_abc",
        "study:completed_chapters",
        (item) => {
          events1.push(item);
        },
      );

      const unsub2 = subscribeRealtimeKey(
        "testuser_abc",
        "study:completed_chapters",
        (item) => {
          events2.push(item);
        },
      );

      // Exactly one Supabase channel should have been created
      assert.equal(channelCreatedCount, 1);

      const state = getRealtimeHubDebugState("testuser_abc");
      assert.equal(state?.totalListeners, 2);
      assert.deepEqual(state?.keys, ["study:completed_chapters"]);

      // Simulate realtime broadcast from Postgres
      assert.ok(broadcastCallback);
      broadcastCallback({
        new: {
          key: "study:completed_chapters",
          value: [{ chapterId: "10.1.1.01", completedAt: 12345 }],
          updated_at: "2026-10-01T08:00:00Z",
        },
      });

      // Both subscribers should have received the event
      assert.equal(events1.length, 1);
      assert.equal(events2.length, 1);
      assert.equal(events1[0].key, "study:completed_chapters");
      assert.equal(events2[0].key, "study:completed_chapters");

      unsub1();
      unsub2();
    },
  );

  await t.test("routes events to correct keys without interference", () => {
    const completedEvents: RealtimeItem[] = [];
    const roadmapEvents: RealtimeItem[] = [];

    const unsub1 = subscribeRealtimeKey(
      "testuser_abc",
      "study:completed_chapters",
      (item) => {
        completedEvents.push(item);
      },
    );

    const unsub2 = subscribeRealtimeKey(
      "testuser_abc",
      "career_execution_state",
      (item) => {
        roadmapEvents.push(item);
      },
    );

    // Still using the same shared channel
    assert.equal(channelCreatedCount, 1);

    // Broadcast only to career_execution_state
    broadcastCallback?.({
      new: {
        key: "career_execution_state",
        value: { currentDay: 1 },
      },
    });

    assert.equal(completedEvents.length, 0);
    assert.equal(roadmapEvents.length, 1);
    assert.equal(roadmapEvents[0].key, "career_execution_state");

    unsub1();
    unsub2();
  });
});

test("empty storage never shares a cached default between readers", async (t) => {
  const originalWindow = globalThis.window;
  const store = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  };
  const { __readLocalForTesting, __resetLocalValueCacheForTesting } =
    await import("./use-synced-storage.ts");
  __resetLocalValueCacheForTesting();
  t.after(() => {
    __resetLocalValueCacheForTesting();
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });

  assert.deepEqual(__readLocalForTesting("probe", { first: true }), {
    first: true,
  });
  assert.deepEqual(__readLocalForTesting("probe", { second: true }), {
    second: true,
  });

  store.set("probe", '{"stored":true}');
  assert.deepEqual(__readLocalForTesting("probe", { second: true }), {
    stored: true,
  });
  assert.deepEqual(__readLocalForTesting("probe", { other: true }), {
    stored: true,
  });
});

test("cloud values remain readable when browser storage quota rejects persistence", async (t) => {
  const originalWindow = globalThis.window;
  const store = new Map([["quota-probe", '{"stale":true}']]);
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: () => {
        throw new DOMException("Full", "QuotaExceededError");
      },
    },
  };
  const storage = await import("./use-synced-storage.ts");
  storage.__resetLocalValueCacheForTesting();
  t.after(() => {
    storage.__resetLocalValueCacheForTesting();
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });
  assert.equal(typeof storage.__writeLocalForTesting, "function");
  const latest = {
    days: [{ date: "2026-10-30", title: "Actual cloud assignment" }],
  };
  storage.__writeLocalForTesting("quota-probe", latest);
  assert.deepEqual(storage.__readLocalForTesting("quota-probe", null), latest);
  assert.deepEqual(storage.__readLocalForTesting("quota-probe", null), latest);
  assert.equal(storage.__readLocalForTesting("other-account", null), null);
});

test("an equal-version cloud read restores an evicted cache but cannot overwrite a pending edit", async () => {
  const { cloudReadMayReplaceLocal } = await import("./use-synced-storage.ts");
  assert.equal(cloudReadMayReplaceLocal(100, 100, false), true);
  assert.equal(cloudReadMayReplaceLocal(100, 100, true), false);
  assert.equal(cloudReadMayReplaceLocal(101, 100, true), true);
  assert.equal(cloudReadMayReplaceLocal(99, 100, false), false);
});

test("compressed history survives a quota-limited cache reload and remains editable", async (t) => {
  const original = globalThis.window,
    store = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (value.length > 10000)
          throw new DOMException("Full", "QuotaExceededError");
        store.set(key, value);
      },
    },
  };
  const storage = await import("./use-synced-storage.ts"),
    codec = await import("./tracker-history.ts");
  t.after(() => {
    storage.__resetLocalValueCacheForTesting();
    (globalThis as unknown as { window: unknown }).window = original;
  });
  const value = {
      profile: { name: "Synthetic" },
      roadmapHistory: [{ note: "retained case ".repeat(30000) }],
    },
    key = "vk:career_command_center";
  const wire = await codec.encodeTrackerHistory("career_command_center", value);
  assert.equal(storage.__writeLocalForTesting(key, value, wire), true);
  storage.__resetLocalValueCacheForTesting();
  storage.__readLocalForTesting(key, null);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.deepEqual(storage.__readLocalForTesting(key, null), value);
  const edited = {
    ...storage.__readLocalForTesting(key, value),
    profile: { name: "Changed" },
  };
  assert.equal(
    storage.__writeLocalForTesting(
      key,
      edited,
      codec.cachedTrackerHistory("career_command_center", edited),
    ),
    true,
  );
  assert.deepEqual(storage.__readLocalForTesting(key, null), edited);
});

async function until(check: () => boolean) {
  const deadline = Date.now() + 2000;
  while (!check()) {
    if (Date.now() >= deadline)
      assert.fail("Asynchronous history operation did not finish");
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

async function historyWindow(t: TestContext) {
  const original = globalThis.window;
  const store = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  };
  const storage = await import("./use-synced-storage.ts");
  storage.__resetLocalValueCacheForTesting();
  t.after(() => {
    storage.__resetLocalValueCacheForTesting();
    (globalThis as unknown as { window: unknown }).window = original;
  });
  return { storage, store };
}

/** Gate real gzip output; real hashing signals that resumed decodes have settled. */
function delayedFirstHistory(t: TestContext) {
  const NativeDecompression = globalThis.DecompressionStream;
  const nativeDigest = crypto.subtle.digest;
  let release!: () => void,
    started!: () => void,
    hashes = 0,
    first = true;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  (
    globalThis as unknown as { DecompressionStream: unknown }
  ).DecompressionStream = function (format: CompressionFormat) {
    const native = new NativeDecompression(format);
    if (!first) return native;
    first = false;
    return {
      writable: native.writable,
      readable: native.readable.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
          async transform(chunk, controller) {
            started();
            await gate;
            controller.enqueue(chunk);
          },
        }),
      ),
    };
  };
  crypto.subtle.digest = async (algorithm, data) => {
    const result = await nativeDigest.call(crypto.subtle, algorithm, data);
    hashes++;
    return result;
  };
  t.after(() => {
    release();
    globalThis.DecompressionStream = NativeDecompression;
    crypto.subtle.digest = nativeDigest;
  });
  return {
    entered,
    release,
    settled: async (count: number) => {
      await until(() => hashes >= count);
      await new Promise<void>((resolve) => setImmediate(resolve));
    },
  };
}

test("a delayed decode cannot replace a newer raw value for the same account key", async (t) => {
  const { storage, store } = await historyWindow(t);
  const codec = await import("./tracker-history.ts");
  const old = {
    revision: "old",
    roadmapHistory: [{ note: "old trace ".repeat(30000) }],
  };
  const next = {
    revision: "new",
    roadmapHistory: [{ note: "new trace ".repeat(30000) }],
  };
  const oldWire = await codec.encodeTrackerHistory(
    "career_command_center",
    old,
  );
  const nextWire = await codec.encodeTrackerHistory(
    "career_command_center",
    next,
  );
  const delayed = delayedFirstHistory(t);
  const key = "vk:account:synthetic-a:career_command_center";
  store.set(key, JSON.stringify(oldWire));
  assert.equal(storage.__readLocalForTesting(key, null), null);
  await delayed.entered;
  store.set(key, JSON.stringify(nextWire));
  assert.equal(storage.__readLocalForTesting(key, null), null);
  await delayed.settled(1);
  const current = storage.__readLocalForTesting(key, null);
  assert.deepEqual(current, next);
  delayed.release();
  await delayed.settled(2);
  assert.equal(storage.__readLocalForTesting(key, null), current);
  assert.equal(store.get(key), JSON.stringify(nextWire));
});

test("account-scoped history decodes remain isolated when another account finishes first", async (t) => {
  const { storage, store } = await historyWindow(t);
  const codec = await import("./tracker-history.ts");
  const a = {
    account: "a",
    roadmapHistory: [{ note: "account a ".repeat(30000) }],
  };
  const b = {
    account: "b",
    roadmapHistory: [{ note: "account b ".repeat(30000) }],
  };
  const aKey = "vk:account:synthetic-a:career_command_center",
    bKey = "vk:account:synthetic-b:career_command_center";
  store.set(
    aKey,
    JSON.stringify(
      await codec.encodeTrackerHistory("career_command_center", a),
    ),
  );
  store.set(
    bKey,
    JSON.stringify(
      await codec.encodeTrackerHistory("career_command_center", b),
    ),
  );
  const delayed = delayedFirstHistory(t);
  assert.equal(storage.__readLocalForTesting(aKey, null), null);
  await delayed.entered;
  assert.equal(storage.__readLocalForTesting(bKey, null), null);
  await delayed.settled(1);
  const bSnapshot = storage.__readLocalForTesting(bKey, null);
  assert.deepEqual(bSnapshot, b);
  delayed.release();
  await delayed.settled(2);
  assert.deepEqual(storage.__readLocalForTesting(aKey, null), a);
  assert.equal(storage.__readLocalForTesting(bKey, null), bSnapshot);
  assert.equal(
    storage.__readLocalForTesting(
      "vk:account:synthetic-c:career_command_center",
      null,
    ),
    null,
  );
});

test("local history corruption surfaces as an error and a changed raw record can recover", async (t) => {
  const { storage, store } = await historyWindow(t);
  const codec = await import("./tracker-history.ts");
  const wire = await codec.encodeTrackerHistory("career_command_center", {
    roadmapHistory: [{ note: "retained ".repeat(40000) }],
  });
  (
    wire as unknown as { roadmapHistory: { sha256: string } }
  ).roadmapHistory.sha256 = "0".repeat(64);
  const key = "vk:account:synthetic-a:career_command_center";
  store.set(key, JSON.stringify(wire));
  assert.equal(storage.__readLocalForTesting(key, null), null);
  let failure: unknown;
  await until(() => {
    try {
      storage.__readLocalForTesting(key, null);
      return false;
    } catch (error) {
      failure = error;
      return true;
    }
  });
  assert.match((failure as Error).message, /integrity/i);
  const recovered = { revision: "recovered", roadmapHistory: [] };
  store.set(key, JSON.stringify(recovered));
  assert.deepEqual(storage.__readLocalForTesting(key, null), recovered);
});

test("a restored compressed document is fully decoded before a queued cloud save reads it", async (t) => {
  const original = globalThis.window,
    store = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    },
  };
  const storage = await import("./use-synced-storage.ts"),
    codec = await import("./tracker-history.ts");
  storage.__resetLocalValueCacheForTesting();
  t.after(() => {
    storage.__resetLocalValueCacheForTesting();
    (globalThis as unknown as { window: unknown }).window = original;
  });
  const value = {
    germanyRoadmap: { note: "Restored active plan ".repeat(20000) },
    roadmapHistory: [{ note: "Retained history ".repeat(20000) }],
  };
  store.set(
    "vk:account:synthetic:career_command_center",
    JSON.stringify(
      await codec.encodeTrackerHistory("career_command_center", value, {
        local: true,
      }),
    ),
  );
  assert.deepEqual(
    await storage.__readLocalReadyForTesting(
      "vk:account:synthetic:career_command_center",
      null,
    ),
    value,
  );
});
