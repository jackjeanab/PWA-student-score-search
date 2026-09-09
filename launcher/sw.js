const CACHE_NAME = 'student-score-launcher-v8';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['./', './index.html', './manifest.webmanifest', './icon.png', './icon.svg'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // Always revalidate HTML/manifest/SW files so an installed PWA does not
  // keep running an old launcher after a GitHub Pages deployment.
  const requestUrl = new URL(event.request.url);
  const isShellFile = requestUrl.pathname.endsWith('/index.html')
    || requestUrl.pathname.endsWith('/manifest.webmanifest')
    || requestUrl.pathname.endsWith('/sw.js');

  if (isShellFile) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
