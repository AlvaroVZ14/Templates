import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Precache the complete emitted bundle, including hashed JS/CSS, on first visit.
function offlineWorker() {
  return {
    name: 'heavy-duty-offline',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = ['index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', ...Object.keys(bundle)];
      const hash = createHash('sha256').update(Object.values(bundle).map(x => x.code ?? String(x.source)).join(''));
      for (const asset of ['manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png']) hash.update(readFileSync(new URL(`./public/${asset}`, import.meta.url)));
      const version = hash.digest('hex').slice(0, 12);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const PREFIX = 'heavy-duty-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = PREFIX + '${version}';
const FILES = ${JSON.stringify([...new Set(files)])};
const local = path => new URL(path, self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(local))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    // Static public assets have no user-specific variants. Vite preview adds
    // Vary: Origin; module requests carry Origin whereas precache requests don't.
    const cached = await cache.match(event.request, { ignoreVary: true });
    if (cached) return cached;
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

export default defineConfig({ base: './', plugins: [react(), offlineWorker()] });
