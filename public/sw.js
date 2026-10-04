/**
 * NOVA service worker.
 *
 * Strategy:
 * - App shell (root documents + icons) precached at install.
 * - Static assets (/_next/static/*, icons): cache-first, versioned URLs.
 * - Pages: network-first with cache fallback so the app opens offline.
 * - Tracker routes get a dedicated offline shell (the cached /hub page).
 *
 * Bump CACHE_VERSION to invalidate everything.
 */
const CACHE_VERSION = "nova-os-v4";
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
          cache
            .add(new Request(url, { cache: "reload" }))
            .catch(() => undefined),
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

  // Next owns the router cache. Persisting Flight/prefetch payloads here can
  // replay module references from an earlier deployment and stall navigation.
  // Let these requests use the network rather than stale-while-revalidate.
  if (
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("Next-Router-Segment-Prefetch") ||
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return;
  }

  // Static assets & icons: cache-first (immutable /_next/static is hashed).
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/");
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
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        }
      })(),
    );
    return;
  }

  // Other same-origin GETs (such as the manifest): stale-while-revalidate.
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

// Server push is separate from local timers; payloads never mark completion.
self.addEventListener('push', (event) => {
 let payload; try { payload=event.data?.json(); } catch { payload=null; }
 const title=typeof payload?.title==='string'?payload.title.slice(0,160):'NOVA reminder';
 event.waitUntil(self.registration.showNotification(title,{body:typeof payload?.body==='string'?payload.body.slice(0,240):'Open NOVA to view your routine.',tag:payload?.tag,data:{url:'/routine'},icon:'/icons/icon-192.png'}));
});
self.addEventListener('notificationclick', (event) => {
 event.notification.close();
 event.waitUntil((async()=>{const url=new URL('/routine',self.location.origin).href;const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});const current=windows.find(client=>new URL(client.url).origin===self.location.origin);if(current){await current.navigate(url);return current.focus();}return self.clients.openWindow(url);})());
});
