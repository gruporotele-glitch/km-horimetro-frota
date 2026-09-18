const CACHE_NAME = 'km-hora-frota-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Não intercepta chamadas ao Apps Script (precisam ir sempre à rede)
  if (event.request.url.includes('script.google.com')) return;

  // Para o HTML principal, tenta a rede primeiro (garante que atualizações
  // apareçam sempre); só usa o cache se estiver sem internet.
  if (event.request.mode === 'navigate' || event.request.destination === 'document'){
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Demais arquivos (ícones, manifest): cache primeiro, é ok pois mudam pouco.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
