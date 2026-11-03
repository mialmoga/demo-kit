// Demo Kit · service worker
// Para que la app instalada abra sin conexión. Solo la versión en línea (index.html) lo registra.
// Sube VERSION cuando cambies index.html o los iconos, para que los usuarios reciban la versión nueva.
const VERSION = 'dk-v4';
const SHELL = ['./', './index.html', './favicon.ico', './site.webmanifest',
  './assets/android-chrome-192x192.png', './assets/android-chrome-512x512.png', './assets/logo.png', './assets/icon.png', './assets/apple-touch-icon.png'];

self.addEventListener('install', e => {
  // cada archivo por separado: si falta alguno (un icono, por ejemplo) no se cancela la instalación
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('dk-') && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;     // la API de GitHub y todo lo externo van directo a la red
  if (req.headers.has('range')) return;
  const isPage = req.mode === 'navigate';
  const isList = /\/manifest\.json$/.test(url.pathname);                  // las listas de demos/plugins/proyectos: que se vea lo nuevo
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    if (isPage || isList) {                                               // primero la red; sin conexión, lo guardado
      try { const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }
      catch (_) { return (await c.match(req, { ignoreSearch: true })) || (isPage && await c.match('./index.html')) || (isPage && await c.match('./')) || Response.error(); }
    }
    // el resto (demos, plugins, proyectos, imágenes, librería): lo guardado al instante y se refresca en segundo plano
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
