/**
 * NOVA//OS service worker.
 *
 * Strategy:
 * - App shell (root documents + icons) precached at install.
 * - Static assets (/_next/static/*, icons): cache-first, versioned URLs.
 * - Pages: network-first with cache fallback so the app opens offline.
 * - Tracker routes get a dedicated offline shell (the cached /hub page).
 *
 * Bump CACHE_VERSION to invalidate everything.
 */
const CACHE_VERSION = "nova-os-v3";
const OFFLINE_URL = "/hub";

const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      // Individual awaits so one failed fetch can't break the install.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API or auth-adjacent traffic.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/sb-")) {
    return;
  }

  // Static assets & icons: cache-first (immutable /_next/static is hashed).
  const isStatic =
    url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
  if (isStatic) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_VERSION);
        const hit = await cache.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return new Response("", { status: 504, statusText: "Offline" });
        }
      })(),
    );
    return;
  }

  // Navigations (pages): network-first, fall back to cache then offline shell.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, res.clone());
          return res;
        } catch {
          const cache = await caches.open(CACHE_VERSION);
          const hit = await cache.match(request, { ignoreSearch: true });
          if (hit) return hit;
          const shell = await cache.match(OFFLINE_URL);
          if (shell) return shell;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })(),
    );
    return;
  }

  // Same-origin GETs (manifest, RSC payload fetches, etc.): stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const hit = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit ?? (await network);
    })(),
  );
});
