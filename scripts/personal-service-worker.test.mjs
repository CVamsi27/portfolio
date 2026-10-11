import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
function worker(host, offline = false) {
  const handlers = new Map();
  const deleted = [];
  let opened = 0;
  let network = 0;
  const caches = {
    keys: async () => ["nova-os-v4", "unrelated-cache"],
    delete: async (key) => { deleted.push(key); return true; },
    open: async () => {
      opened++;
      return { add: async () => {}, put: async () => {}, match: async () => new Response("cached private workspace") };
    },
  };
  vm.runInNewContext(source, {
    self: { location: new URL(`https://${host}`), addEventListener: (name, handler) => handlers.set(name, handler),
      skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches, URL, Response,
    Request: class extends Request {
      constructor(input, init) { super(new URL(input, `https://${host}`), init); }
    },
    fetch: async () => { network++; if (offline) throw new Error("offline"); return new Response("network login"); },
  });
  return { handlers, deleted, stats: () => ({ opened, network }) };
}
async function runLifetime(handler) {
  const waits = [];
  handler({ waitUntil: (promise) => waits.push(promise) });
  await Promise.all(waits);
}
async function navigation(instance, host) {
  let result;
  instance.handlers.get("fetch")({
    request: { method: "GET", mode: "navigate", url: `https://${host}/hub`, headers: new Headers() },
    respondWith: (promise) => { result = promise; },
  });
  return result ? await result : null; // null means the browser uses the network.
}

test("personal worker never precaches private HTML and purges old caches", async () => {
  const instance = worker("personal.buildora.work");
  await runLifetime(instance.handlers.get("install"));
  assert.equal(instance.stats().opened, 0);
  await runLifetime(instance.handlers.get("activate"));
  assert.deepEqual(instance.deleted, ["nova-os-v4", "unrelated-cache"]);
});

test("personal navigations never replay an authenticated cached page online or offline", async () => {
  for (const offline of [false, true]) {
    const instance = worker("personal.buildora.work", offline);
    const response = await navigation(instance, "personal.buildora.work");
    assert.equal(response, null);
    assert.equal(instance.stats().opened, 0);
  }
});

test("localhost retains its offline workspace fallback", async () => {
  const instance = worker("localhost", true);
  const response = await navigation(instance, "localhost");
  assert.equal(await response.text(), "cached private workspace");
});
