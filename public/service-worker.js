
const CACHE_NAME = "static-cache-budget";
const DATA_CACHE_NAME = "data-cache-budget";

const iconSizes = ["192", "512"];
const iconFiles = iconSizes.map(
  (size) => `/icons/icon-${size}x${size}.png`
);

const staticFilesToPreCache = [
  "/",
  "/index.js",
  "/manifest.webmanifest",
].concat(iconFiles);


// install
self.addEventListener("install", event => {
    event.waitUntil(
      caches
        .open(STATIC_CACHE)
        .then(cache => cache.addAll(FILES_TO_CACHE))
        .then(() => self.skipWaiting())
    );
  });


// fetch
self.addEventListener("fetch", function(evt) {
  const {url} = evt.request;
  if (url.includes("/api")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
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
