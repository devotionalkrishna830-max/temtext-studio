// TemText Studio — Service Worker v2.0
// ROLE: Cache + Offline + Fast Load + PWA Install ONLY
// ⚠️ No upload/video/telegram/firebase logic here

const CACHE = 'temtext-v2';
const CORE  = ['./index.html'];

// ── INSTALL: cache index.html
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .catch(() => {})
  );
  self.skipWaiting();
});

// ── ACTIVATE: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: network first → cache fallback
// External requests (Cloudinary, Firebase, Telegram) pass through untouched
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  // Let external APIs pass through directly — no cache interference
  if (
    url.includes('cloudinary.com') ||
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('workers.dev') ||
    url.includes('telegram')
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
