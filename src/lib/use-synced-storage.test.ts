import test from "node:test";
import assert from "node:assert/strict";
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
  setSupabaseClientForTesting(mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient);

  t.after(() => {
    resetRealtimeHubsForTesting();
    (globalThis as unknown as { window: unknown }).window = originalWindow;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnvUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnvKey;
    setSupabaseClientForTesting(undefined);
  });

  await t.test("multiplexes multiple subscriptions on the same key into a single channel", () => {
    const events1: RealtimeItem[] = [];
    const events2: RealtimeItem[] = [];

    const unsub1 = subscribeRealtimeKey("testuser_abc", "study:completed_chapters", (item) => {
      events1.push(item);
    });

    const unsub2 = subscribeRealtimeKey("testuser_abc", "study:completed_chapters", (item) => {
      events2.push(item);
    });

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
  });

  await t.test("routes events to correct keys without interference", () => {
    const completedEvents: RealtimeItem[] = [];
    const roadmapEvents: RealtimeItem[] = [];

    const unsub1 = subscribeRealtimeKey("testuser_abc", "study:completed_chapters", (item) => {
      completedEvents.push(item);
    });

    const unsub2 = subscribeRealtimeKey("testuser_abc", "career_execution_state", (item) => {
      roadmapEvents.push(item);
    });

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
