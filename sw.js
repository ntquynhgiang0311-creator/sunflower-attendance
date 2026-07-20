const CACHE_NAME = "sunflower-attendance-v1";

const STATIC_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./images/logo.png",
  "./images/icon-192.png",
  "./images/icon-512.png",
  "./images/icon-maskable-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(STATIC_FILES);
      })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function (cacheName) {
              return cacheName !== CACHE_NAME;
            })
            .map(function (cacheName) {
              return caches.delete(cacheName);
            })
        );
      })
  );

  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  // Không cache API Google Apps Script
  if (
    requestUrl.hostname ===
    "script.google.com"
  ) {
    return;
  }

  // Trang HTML ưu tiên lấy bản mới
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          const responseClone =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(function (cache) {
              cache.put(
                "./index.html",
                responseClone
              );
            });

          return response;
        })
        .catch(function () {
          return caches.match(
            "./index.html"
          );
        })
    );

    return;
  }

  // File tĩnh: ưu tiên cache
  event.respondWith(
    caches
      .match(request)
      .then(function (cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(
          function (response) {
            if (
              !response ||
              response.status !== 200
            ) {
              return response;
            }

            const responseClone =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(function (cache) {
                cache.put(
                  request,
                  responseClone
                );
              });

            return response;
          }
        );
      })
  );
});