// ガーデンノート オフライン用。一度開けば通信なしで起動する。
// 起動はいつも端末の控えから。裏で新しい版があれば取り込み、次に開いたときから新しい版になる。
const CACHE = 'garden-note-v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate';
  const key = isPage ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key, {ignoreSearch: true});
    const net = fetch(isPage ? new Request('./index.html', {cache: 'no-cache'}) : req).then(r => {
      if (r && r.ok) c.put(key, r.clone());
      return r;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('オフラインです。一度、通信できる場所で開いてください。', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
  }));
});
