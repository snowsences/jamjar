const CACHE = "jamjar-shell-v26";
const BASE = new URL("./", self.registration.scope).pathname;
const ASSETS = [
  BASE,
  `${BASE}index.html`,
  `${BASE}styles.css`,
  `${BASE}app.js`,
  `${BASE}motion.js`,
  `${BASE}manifest.webmanifest`,
  `${BASE}icon-96.png`,
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
// Code has to come from one deploy, so it's fetched network-first; the cache
// only answers when the network is down or too slow.
const CODE = /\.(?:js|css|webmanifest)$/;
const NETWORK_TIMEOUT = 3000;
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" }))),
      )
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
const store = (request, response) => {
  if (!response.ok) return response;
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy));
  return response;
};
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin))
    return;
  const path = new URL(request.url).pathname;
  if (request.mode === "navigate") {
    // Only the app shell itself is cached, never another page or an error.
    const shell = path === BASE || path === `${BASE}index.html`;
    event.respondWith(
      fetch(request)
        .then((response) => (shell ? store(BASE, response) : response))
        .catch(() => caches.match(BASE)),
    );
    return;
  }
  if (CODE.test(path)) {
    const network = fetch(request, { cache: "no-cache" }).then((response) =>
      store(request, response),
    );
    event.waitUntil(network.catch(() => {}));
    event.respondWith(
      Promise.race([
        network,
        new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT)).then(
          () => caches.match(request).then((cached) => cached || network),
        ),
      ]).catch(() =>
        caches.match(request).then((cached) => cached || Response.error()),
      ),
    );
    return;
  }
  // Icons and fonts: answer from cache, refresh in the background.
  const refresh = fetch(request).then((response) => store(request, response));
  event.waitUntil(refresh.catch(() => {}));
  event.respondWith(
    caches.match(request).then((cached) => cached || refresh),
  );
});
