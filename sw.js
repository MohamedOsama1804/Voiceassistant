const CACHE_NAME = 'courier-directory-v4';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './xlsx.full.min.js'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate: answer instantly from the cache when we have one
  // (so the app opens immediately even on slow warehouse wifi), while a
  // background fetch quietly refreshes that cache entry for next time.
  // (The previous version was network-first, which made every single open
  // wait on a full round-trip even when nothing had changed — that's what
  // was making the app feel slow. This keeps the app fresh within one
  // reload instead, which is enough to avoid the old "stuck for days"
  // staleness problem without paying the latency cost every time.)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
