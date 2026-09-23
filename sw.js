const CACHE = "jamjar-shell-v24";
const BASE = new URL("./", self.registration.scope).pathname;
const ASSETS = [
  BASE,
  `${BASE}index.html`,
  `${BASE}styles.css`,
  `${BASE}app.js`,
  `${BASE}manifest.webmanifest`,
  `${BASE}icon-192.png`,
  `${BASE}icon-512.png`,
  `${BASE}icon-maskable-512.png`,
  `${BASE}fonts/figtree-400.woff2`,
  `${BASE}fonts/figtree-500.woff2`,
  `${BASE}fonts/figtree-600.woff2`,
  `${BASE}firebase-client.js`,
  `${BASE}vendor/firebase-app.js`,
  `${BASE}vendor/firebase-auth.js`,
  `${BASE}vendor/firebase-firestore.js`,
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin)
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(BASE, copy));
          return response;
        })
        .catch(() => caches.match(BASE)),
    );
    return;
  }
  // Stale-while-revalidate: answer from cache, refresh it in the background
  // so the next launch picks up new code without bumping CACHE.
  const refresh = fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  });
  event.waitUntil(refresh.catch(() => {}));
  event.respondWith(
    caches.match(event.request).then((cached) => cached || refresh),
  );
});
