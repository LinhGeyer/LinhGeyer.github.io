const CACHE = "amphi-v3.03";

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./styles.css",
        "./app.js",
        "./manifest.json"
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  try {
    const url = new URL(req.url);

    // Use network-first for the app shell so edits to app.js/index.html get picked up
    if (url.pathname.endsWith("/app.js") || url.pathname.endsWith("/index.html") || url.pathname === "./app.js") {
      event.respondWith(
        fetch(req).then(networkResponse => {
          caches.open(CACHE).then(cache => cache.put(req, networkResponse.clone()));
          return networkResponse;
        }).catch(() => caches.match(req))
      );
      return;
    }
  } catch (e) {
    // ignore URL parsing errors and fall back to cache-first
  }

  // default: cache-first for other assets
  event.respondWith(
    caches.match(req).then(response => response || fetch(req))
  );
});