import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Media is opt-in and stays in the same origin/cache as the rest of the PWA.
// Reject mistakes at build time instead of silently publishing a broken offline loop.
export function appearanceAssets(directory = fileURLToPath(new URL('./public/', import.meta.url))) {
  const publicRoot = realpathSync(directory);
  const configuration = JSON.parse(readFileSync(resolve(publicRoot, 'appearance.json'), 'utf8'));
  if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) throw new Error('appearance.json debe contener un objeto.');
  const paths = [];
  function localAsset(path, allowed) {
    if (typeof path !== 'string' || !path || /[\\:%?#\u0000-\u001f]/.test(path) || path.startsWith('/') || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('El fondo debe usar una ruta relativa dentro de public, sin URL ni segmentos ..');
    if (!allowed.includes(extname(path).toLowerCase())) throw new Error(`Formato de fondo no admitido: ${path}`);
    const absolute = realpathSync(resolve(publicRoot, path));
    const inside = relative(publicRoot, absolute);
    if (isAbsolute(inside) || inside === '..' || inside.startsWith(`..${sep}`) || resolve(absolute) === publicRoot || !statSync(absolute).isFile()) throw new Error('El fondo debe ser un archivo dentro de public.');
    paths.push(path);
  }
  const images = ['.webp', '.avif', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
  // A missing cover is intentional: the app keeps its original SVG fallback.
  if (existsSync(resolve(publicRoot, 'hero.jpg'))) localAsset('hero.jpg', ['.jpg']);
  if (configuration.media != null) {
    const media = configuration.media;
    if (typeof media !== 'object' || !['image', 'video'].includes(media.type)) throw new Error('media debe ser null o un objeto con type image/video y src.');
    localAsset(media.src, media.type === 'image' ? images : ['.mp4', '.webm']);
  }
  if (configuration.poster != null) localAsset(configuration.poster, images);
  const unique = [...new Set(paths)];
  if (unique.reduce((size, path) => size + statSync(resolve(publicRoot, path)).size, 0) > 8 * 1024 * 1024) throw new Error('Comprime la portada, el fondo y su póster: el total máximo combinado es 8 MiB para mantener la PWA ligera.');
  return unique;
}

// Precache the complete emitted bundle, including hashed JS/CSS, on first visit.
export function offlineWorker(directory = fileURLToPath(new URL('./public/', import.meta.url))) {
  return {
    name: 'heavy-duty-offline',
    apply: 'build',
    generateBundle(_, bundle) {
      const publicRoot = realpathSync(directory);
      const publicAssets = ['manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'appearance.json', ...appearanceAssets(publicRoot)];
      if (publicAssets.includes('hero.jpg') && statSync(resolve(publicRoot, 'hero.jpg')).size > 2 * 1024 * 1024) this.warn?.('hero.jpg supera los 2 MiB recomendados. Comprime la portada para acelerar el primer inicio y su copia offline.');
      const files = ['index.html', ...publicAssets, ...Object.keys(bundle)];
      const hash = createHash('sha256').update(Object.values(bundle).map(x => x.code ?? String(x.source)).join(''));
      for (const asset of publicAssets) hash.update(asset).update(readFileSync(resolve(publicRoot, asset)));
      const version = hash.digest('hex').slice(0, 12);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const PREFIX = 'heavy-duty-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = PREFIX + '${version}';
const FILES = ${JSON.stringify([...new Set(files)])};
const local = path => new URL(path, self.registration.scope).href;
// Safari requests video in byte ranges even when the complete file is cached.
// Serve slices locally so custom loops continue playing without a connection.
async function cachedResponse(request, cached) {
  const range = request.headers.get('range');
  if (range === null || cached.status !== 200) return cached;
  const body = await cached.arrayBuffer();
  const size = body.byteLength;
  const headers = new Headers(cached.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.delete('Content-Encoding');
  const match = /^bytes=(\\d*)-(\\d*)$/i.exec(range.trim());
  let start = 0, end = size - 1;
  let valid = Boolean(match && (match[1] || match[2]) && size > 0);
  if (valid && match[1]) {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    valid = Number.isSafeInteger(start) && Number.isSafeInteger(end) && start < size && end >= start;
    end = Math.min(end, size - 1);
  } else if (valid) {
    const suffix = Number(match[2]);
    valid = Number.isSafeInteger(suffix) && suffix > 0;
    start = Math.max(0, size - suffix);
  }
  if (!valid) {
    headers.set('Content-Range', 'bytes */' + size);
    headers.set('Content-Length', '0');
    return new Response(null, { status: 416, statusText: 'Range Not Satisfiable', headers });
  }
  headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(body.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers });
}
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(local))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    // Static public assets have no user-specific variants. Vite preview adds
    // Vary: Origin; module requests carry Origin whereas precache requests don't.
    const cached = await cache.match(event.request, { ignoreVary: true });
    if (cached) return cachedResponse(event.request, cached);
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') return cache.match(local('index.html'));
      throw error;
    }
  }));
});` });
    },
  };
}

export default defineConfig({ base: '/Templates/', plugins: [react(), offlineWorker()] });
