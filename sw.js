/*
  ABAS Estimator — service worker
  Network-first for the app's own files, so a redeploy shows up on the next
  reload; falls back to the cached copy when offline. Estimate data itself
  lives in localStorage, not here.

  Bump CACHE_VERSION when you change precached files so old caches are cleared.
*/
var CACHE_VERSION = 'abas-estimator-v4';
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

function store(req, res){
  if (res && res.ok){
    var copy = res.clone();
    caches.open(CACHE_VERSION).then(function(cache){ cache.put(req, copy); });
  }
  return res;
}

self.addEventListener('fetch', function(event){
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // Own files: network first, cache when offline.
  if (url.origin === self.location.origin){
    event.respondWith(
      fetch(req).then(function(res){ return store(req, res); }).catch(function(){
        return caches.match(req).then(function(cached){
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        });
      })
    );
    return;
  }

  // Cross-origin (Google Fonts): stale-while-revalidate.
  event.respondWith(
    caches.match(req).then(function(cached){
      var network = fetch(req).then(function(res){ return store(req, res); }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
