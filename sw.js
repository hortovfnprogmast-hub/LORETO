/**
 * sw.js — Service Worker de la PWA Loreto Ingeniería
 *
 * Estrategia:
 *   - Navegación (HTML): NETWORK-FIRST. Siempre busca la versión más reciente
 *     en la red; solo usa cache como fallback cuando no hay conexión.
 *     Esto evita que los móviles queden pegados a una versión vieja de la app.
 *   - Assets estáticos (CDN de Firebase, Lucide, fuentes, imágenes ibb.co):
 *     STALE-WHILE-REVALIDATE. Sirve del cache y actualiza en paralelo.
 *
 * Versión: bumped cada vez que se actualiza la app para forzar el refresco
 * del service worker en los dispositivos que ya lo tenían registrado.
 */
var SW_VERSION = 'loreto-v1.1.0-20261105';
var CACHE_PREFIX = 'loreto-cache-';
var CACHE_NAME = CACHE_PREFIX + SW_VERSION;

// CDN hosts cuyos assets sí podemos cachear con seguridad
var CDN_HOSTS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'unpkg.com',
    'cdnjs.cloudflare.com',
    'www.gstatic.com'
];

self.addEventListener('install', function (event) {
    self.skipWaiting();
    event.waitUntil(
        caches.keys().then(function (keys) {
            // Limpiar caches viejos al instalar
            return Promise.all(
                keys.filter(function (k) { return k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME; })
                    .map(function (k) { return caches.delete(k); })
            );
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(function (keys) {
                return Promise.all(
                    keys.filter(function (k) { return k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME; })
                        .map(function (k) { return caches.delete(k); })
                );
            })
        ])
    );
});

self.addEventListener('fetch', function (event) {
    var req = event.request;

    // Solo manejar GET
    if (req.method !== 'GET') return;

    var url = new URL(req.url);

    // 1) NAVEGACIÓN (HTML del propio sitio) => NETWORK-FIRST
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then(function (resp) {
                    // Guardar copia fresca del HTML
                    var copy = resp.clone();
                    caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
                    return resp;
                })
                .catch(function () {
                    // Sin red: servir del cache, o fallback a index.html
                    return caches.match(req).then(function (cached) {
                        return cached || caches.match('index.html');
                    });
                })
        );
        return;
    }

    // 2) ASSETS DE CDN => STALE-WHILE-REVALIDATE
    var isCdn = CDN_HOSTS.some(function (h) { return url.hostname === h || url.hostname.endsWith('.' + h); });
    if (isCdn || url.origin === self.location.origin) {
        event.respondWith(
            caches.match(req).then(function (cached) {
                var fetchPromise = fetch(req).then(function (resp) {
                    // Solo cachear respuestas válidas (status 200, tipo básico/cors)
                    if (resp && resp.status === 200 && (resp.type === 'basic' || resp.type === 'cors')) {
                        var copy = resp.clone();
                        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
                    }
                    return resp;
                }).catch(function () {
                    // Sin red y sin cache => dejar que el navegador maneje el error
                    return cached || Response.error();
                });
                return cached || fetchPromise;
            })
        );
        return;
    }

    // 3) Todo lo demás => dejar pasar al navegador
    // (no interceptamos POST, Firestore, Google Apps Script, etc.)
});
