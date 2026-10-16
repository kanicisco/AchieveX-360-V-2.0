const CACHE_NAME = 'achievex360-v1';
const urlsToCache = [
  './',
  './index.html',
  './assets/css/style.css',
  './AchieveX 360 Analytics Logo.png',
  './AchieveX 360 Analytics Logo BG.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => {
    return Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    );
  }));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
