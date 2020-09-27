const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const FILES_TO_CACHE = [
  "/",
  "./index.js",
  "./index.html",
  "./db.js",
  "./style.css",
  "./service-worker.js"
];


// install
self.addEventListener("install", event => {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(cache => cache.addAll(FILES_TO_CACHE))
        .then(() => self.skipWaiting())
    );
  });

// activate
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener("fetch", function(evt) {
  if (evt.request.url.includes("/api")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        console.log('[Service Worker] Fetch (data)', evt.request.url);
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );
  } else {
    // respond from static cache, request is not for /api/*
    evt.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(evt.request).then(response => {
          return response || fetch(evt.request);
        });
      })
    );
  }
});
