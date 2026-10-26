const CACHE = 'rpg-dice-v4';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Abre na hora com o que está guardado e, em segundo plano, baixa a versão mais nova
// (a atualização aparece na abertura seguinte).
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
    e.respondWith(
        caches.open(CACHE).then(async (cache) => {
            const cached = await cache.match(e.request);
            const update = fetch(e.request)
                .then((res) => {
                    if (res && res.ok) cache.put(e.request, res.clone());
                    return res;
                })
                .catch(() => null);
            if (cached) {
                e.waitUntil(update);
                return cached;
            }
            const res = await update;
            return res || (await cache.match('./index.html')) || Response.error();
        })
    );
});
