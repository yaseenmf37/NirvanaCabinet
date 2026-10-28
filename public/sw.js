const CACHE_NAME = "new-nirvana-shell-v1";
const SHELL_ASSETS = ["/", "/plans", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/projects") || url.pathname.startsWith("/tasks") || url.pathname.startsWith("/settings") || url.pathname.startsWith("/employees") || url.pathname.startsWith("/planning") || url.pathname.startsWith("/analysis") || url.pathname.startsWith("/cutting") || url.pathname.startsWith("/assembly") || url.pathname.startsWith("/installation") || url.pathname.startsWith("/logistics") || url.pathname.startsWith("/reports")) return;
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  }).catch(() => caches.match(request).then((cached) => cached ?? caches.match("/"))));
});
