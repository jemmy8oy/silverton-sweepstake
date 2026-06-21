const CACHE_VERSION = "silverton-sweepstake-v1";
const SW_FILE = "/sw.js";
const basePath = self.location.pathname.endsWith(SW_FILE)
  ? self.location.pathname.slice(0, -SW_FILE.length)
  : "";

const offlineUrl = `${basePath}/offline`;
const precacheUrls = [
  `${basePath}/`,
  offlineUrl,
  `${basePath}/manifest.webmanifest`,
  `${basePath}/icon-192`,
  `${basePath}/icon-512`,
  `${basePath}/apple-icon`
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(precacheUrls)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
          );
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? caches.match(offlineUrl);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
            );
          }
          return response;
        })
        .catch(() => cached);

      return cached ?? networkFetch;
    })
  );
});
