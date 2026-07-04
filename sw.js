const CACHE_VERSION = 'v' + '20260704-2'; // incrémentez à chaque mise à jour
const CACHE_NAME = `bingo-biboo-${CACHE_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './assets/img/icon.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  // Ajoutez ici d'autres fichiers locaux si nécessaire
];

// Installation
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: mise en cache des ressources');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: suppression de l’ancien cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Stratégie stale-while-revalidate
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});