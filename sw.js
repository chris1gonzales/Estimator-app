/*
  ABAS Estimator — service worker
  Precaches the app shell so the tool works fully offline once it has been
  opened one time. All estimate data itself lives in localStorage, not here.

  Bump CACHE_VERSION whenever index.html (or any precached file) changes, so
  returning users pick up the new version instead of a stale cached copy.
*/
var CACHE_VERSION = 'abas-estimator-v2';
var PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest'
];
var OPTIONAL_URLS = [
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(PRECACHE_URLS).then(function(){
        return Promise.all(OPTIONAL_URLS.map(function(u){
          return cache.add(u).catch(function(){});
        }));
      });
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_VERSION; })
            .map(function(key){ return caches.delete(key); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  // App shell: cache-first, so the tool loads instantly and works offline.
  if (url.origin === self.location.origin){
    event.respondWith(
      caches.match(req).then(function(cached){
        var network = fetch(req).then(function(res){
          if (res && res.ok){
            var copy = res.clone();
            caches.open(CACHE_VERSION).then(function(cache){ cache.put(req, copy); });
          }
          return res;
        }).catch(function(){ return cached; });
        return cached || network;
      })
    );
    return;
  }

  // Cross-origin (Google Fonts, etc.): stale-while-revalidate so the app
  // still renders offline after the first successful load.
  event.respondWith(
    caches.match(req).then(function(cached){
      var network = fetch(req).then(function(res){
        if (res && res.ok){
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function(cache){ cache.put(req, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
