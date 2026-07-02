const CACHE_NAME = 'registro-lavoro-v7';
const urlsToCache = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

// Installa il service worker e mette i file in cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Cache addAll error:', err);
        // Continua anche se qualche risorsa non carica
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Attiva il service worker e pulisce i cache vecchi
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Strategia: Cache first, then network
// (prova dalla cache, se non c'è vai online)
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Se trovato in cache, lo restituisci
      if (response) {
        return response;
      }

      // Altrimenti prova a fetcharla da rete
      return fetch(event.request).then(response => {
        // Se è una risorsa valida, la metti in cache per la prossima volta
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Se non c'è connessione e non è in cache, torna offline
        // Puoi restituire una pagina offline qui se vuoi
        return caches.match(event.request);
      });
    })
  );
});
