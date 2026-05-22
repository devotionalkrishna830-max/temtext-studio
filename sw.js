// TemText Studio — Service Worker v2.1
// Cache-first for assets, network-first for templates

const CACHE_NAME = 'temtext-v2.1';
const STATIC_ASSETS = [
  './',
  './index.html',
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for same-origin, network for external
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET, non-http(s), chrome-extension, etc.
  if (e.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // External CDN/Cloudinary/Google Fonts — network only
  const external = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'upload-widget.cloudinary.com',
    'res.cloudinary.com',
    'crimson-bush-e635',
  ];
  if (external.some(d => url.hostname.includes(d))) return;

  // Cache-first for same-origin
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
