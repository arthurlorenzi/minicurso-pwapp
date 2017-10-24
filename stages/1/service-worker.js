let CACHE_NAME = 'WPADocs-cv1';
let DATA_CACHE_NAME = 'WPADocsData-cv1';
let urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css',
  '/assets/logo192.png',
  '/assets/logo128.png',
  '/assets/logo48.png',
  '/assets/logo16.png',
  '/vendor/material.min.css',
  '/vendor/material.min.js',
  '/vendor/MaterialIcons-Regular.woff2',
];
let dataUrlsToCache = [
  '/get',
  '/list'
]

self.addEventListener('install', event => {
  console.log('[Service Worker] install');

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] activate');

  event.waitUntil(
    caches.keys().then(allKeys => {
      return Promise.all(allKeys.map(key => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('[Service Worker] delete cache: ' + key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  //console.log('[Service Worker] fetch: ', event.request.url);

  let shouldCacheThenNet = false;

  for (let i = 0; i < dataUrlsToCache.length; ++i) {
    if (event.request.url.indexOf(dataUrlsToCache[i]) > -1) {
      shouldCacheThenNet = true;
      break;
    }
  }

  if (shouldCacheThenNet) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(event.request).then(response => {
          cache.put(event.request.url, response.clone());
          return response;
        }) 
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
})