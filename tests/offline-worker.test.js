import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import config, { appearanceAssets, offlineWorker } from '../vite.config.js';

const scope = 'https://example.test/Templates/';
function generatedWorker(publicRoot, warnings = []) {
  let asset;
  const plugin = publicRoot ? offlineWorker(publicRoot) : config.plugins.flat().find(plugin => plugin.name === 'heavy-duty-offline');
  plugin.generateBundle.call({ emitFile(result) { asset = result; }, warn(message) { warnings.push(message); } }, {}, {
    'assets/app.js': { code: '/* fixture bundle */' },
    'assets/Anton.ttf': { source: new Uint8Array([0, 1, 0, 0]) },
  });
  assert.equal(asset.fileName, 'sw.js');
  return asset.source;
}

function offlineRuntime() {
  const listeners = new Map(), requests = [];
  const bytes = Uint8Array.from({ length: 10 }, (_, index) => index);
  const stored = new Map([
    [`${scope}loop.mp4`, new Response(bytes, { headers: { 'Content-Type': 'video/mp4', 'Content-Length': '10', 'Content-Encoding': 'identity' } })],
    [`${scope}empty.mp4`, new Response(new Uint8Array())],
    [`${scope}index.html`, new Response('<main>offline</main>')],
  ]);
  runInNewContext(generatedWorker(), {
    URL, Headers, Response,
    self: { registration: { scope }, addEventListener(type, listener) { listeners.set(type, listener); } },
    caches: { async open() { return { async match(request) { return stored.get(typeof request === 'string' ? request : request.url)?.clone(); } }; } },
    async fetch(request) { requests.push(request); throw new Error('Sin conexión'); },
  });
  return {
    requests,
    async get(path = 'loop.mp4', range) {
      let result;
      const request = new Request(new URL(path, scope), { headers: range === undefined ? {} : { Range: range } });
      listeners.get('fetch')({ request, respondWith(response) { result = response; } });
      return result;
    },
    async navigate() {
      let result;
      listeners.get('fetch')({ request: { method: 'GET', url: `${scope}session`, mode: 'navigate', headers: new Headers() }, respondWith(response) { result = response; } });
      return result;
    },
  };
}

test('el SW precachea fuentes y configuración bajo el scope de la PWA', () => {
  const source = generatedWorker();
  assert.match(source, /appearance\.json/);
  assert.match(source, /assets\/Anton\.ttf/);
  assert.match(source, /new URL\(path, self\.registration\.scope\)/);
});

test('el vídeo completo permanece disponible sin Range ni conexión', async () => {
  const worker = offlineRuntime();
  const response = await worker.get();
  assert.equal(response.status, 200);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(worker.requests.length, 0);
});

test('el vídeo offline responde 206 con bytes exactos y cabeceras de rango', async () => {
  const worker = offlineRuntime();
  const response = await worker.get('loop.mp4', 'bytes=2-5');
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), 'bytes 2-5/10');
  assert.equal(response.headers.get('Content-Length'), '4');
  assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(response.headers.get('Content-Type'), 'video/mp4');
  assert.equal(response.headers.get('Content-Encoding'), null);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [2, 3, 4, 5]);
  assert.equal(worker.requests.length, 0);
});

test('rangos abiertos, sufijos y finales mayores al archivo funcionan offline', async () => {
  const worker = offlineRuntime();
  for (const [range, expectedRange, expected] of [
    ['bytes=7-', 'bytes 7-9/10', [7, 8, 9]],
    ['bytes=-3', 'bytes 7-9/10', [7, 8, 9]],
    ['bytes=-50', 'bytes 0-9/10', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
    ['bytes=8-30', 'bytes 8-9/10', [8, 9]],
    ['bytes=0-0', 'bytes 0-0/10', [0]],
  ]) {
    const response = await worker.get('loop.mp4', range);
    assert.equal(response.status, 206, range);
    assert.equal(response.headers.get('Content-Range'), expectedRange, range);
    assert.equal(Number(response.headers.get('Content-Length')), expected.length, range);
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], expected, range);
  }
  assert.equal(worker.requests.length, 0);
});

test('rangos inválidos o múltiples devuelven 416 sin intentar descargar', async () => {
  const worker = offlineRuntime();
  for (const range of ['', 'bytes=10-', 'bytes=8-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,4-5', 'items=0-1', 'bytes=9999999999999999999-', 'bytes=--1']) {
    const response = await worker.get('loop.mp4', range);
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('Content-Range'), 'bytes */10', range);
    assert.equal(response.headers.get('Content-Length'), '0', range);
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes', range);
    assert.equal((await response.arrayBuffer()).byteLength, 0, range);
  }
  const empty = await worker.get('empty.mp4', 'bytes=0-');
  assert.equal(empty.status, 416);
  assert.equal(empty.headers.get('Content-Range'), 'bytes */0');
  assert.equal(worker.requests.length, 0);
});

test('el fallback de navegación offline continúa entregando la app', async () => {
  const worker = offlineRuntime();
  const response = await worker.navigate();
  assert.equal(await response.text(), '<main>offline</main>');
  assert.equal(worker.requests.length, 1);
});

function appearanceFixture(t) {
  const temporaryRoot = resolve(tmpdir());
  const root = mkdtempSync(join(temporaryRoot, 'blood-guts-appearance-'));
  t.after(() => {
    // Only remove the specific temporary directory created by this fixture.
    const target = resolve(root);
    assert.equal(dirname(target), temporaryRoot);
    assert.ok(basename(target).startsWith('blood-guts-appearance-'));
    rmSync(target, { recursive: true, force: true });
  });
  const write = (name, value) => writeFileSync(join(root, name), value);
  const validate = configuration => { write('appearance.json', JSON.stringify(configuration)); return appearanceAssets(root); };
  mkdirSync(join(root, 'backgrounds'));
  write('backgrounds/own.webp', new Uint8Array([1, 2, 3]));
  write('backgrounds/own.mp4', new Uint8Array([4, 5, 6]));
  write('appearance.json', JSON.stringify({ media: null, poster: null }));
  for (const asset of ['manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png']) write(asset, 'fixture');
  return { root, write, validate };
}

test('appearance valida imagen, vídeo y póster locales y elimina duplicados', t => {
  const { validate } = appearanceFixture(t);
  assert.deepEqual(validate({ media: null, poster: null }), []);
  assert.deepEqual(validate({ media: { type: 'image', src: 'backgrounds/own.webp' }, poster: 'backgrounds/own.webp' }), ['backgrounds/own.webp']);
  assert.deepEqual(validate({ media: { type: 'video', src: 'backgrounds/own.mp4' }, poster: 'backgrounds/own.webp' }), ['backgrounds/own.mp4', 'backgrounds/own.webp']);
});

test('appearance rechaza rutas externas, formatos incorrectos y archivos ausentes', t => {
  const { validate } = appearanceFixture(t);
  for (const configuration of [
    null, [],
    { media: { type: 'image', src: '../outside.svg' } },
    { media: { type: 'image', src: '/outside.svg' } },
    { media: { type: 'image', src: 'https://example.com/own.webp' } },
    { media: { type: 'image', src: 'backgrounds/%2e%2e/outside.webp' } },
    { media: { type: 'video', src: 'backgrounds/own.webp' } },
    { media: { type: 'audio', src: 'backgrounds/own.mp4' } },
    { media: { type: 'image', src: 'absent.webp' } },
    { media: null, poster: '..\\outside.svg' },
  ]) assert.throws(() => validate(configuration));
});

test('appearance impide publicar más de 8 MiB de fondo y póster', t => {
  const { write, validate } = appearanceFixture(t);
  write('large.mp4', Buffer.alloc(8 * 1024 * 1024));
  assert.deepEqual(validate({ media: { type: 'video', src: 'large.mp4' } }), ['large.mp4']);
  assert.throws(() => validate({ media: { type: 'video', src: 'large.mp4' }, poster: 'backgrounds/own.webp' }), /8 MiB/);
});

test('hero.jpg es opcional: su ausencia no invalida ni entra en el precaché', t => {
  const { root, validate } = appearanceFixture(t);
  assert.deepEqual(validate({ media: null, poster: null }), []);
  const source = generatedWorker(root);
  assert.doesNotMatch(source, /"hero\.jpg"/);
  assert.match(source, /appearance\.json/);
});

test('hero.jpg presente se precachea bajo /Templates/ y cambia de versión al editarse', async t => {
  const { root, write, validate } = appearanceFixture(t);
  const absent = generatedWorker(root);
  write('hero.jpg', new Uint8Array([0xff, 0xd8, 0xff, 1]));
  assert.deepEqual(validate({ media: null, poster: null }), ['hero.jpg']);
  const first = generatedWorker(root);
  assert.match(first, /"hero\.jpg"/);
  const listeners = new Map(), cachedURLs = [];
  runInNewContext(first, {
    URL, Headers, Response,
    self: {
      registration: { scope },
      addEventListener(type, listener) { listeners.set(type, listener); },
      async skipWaiting() {},
    },
    caches: { async open() { return { async addAll(urls) { cachedURLs.push(...urls); } }; } },
  });
  let installed;
  listeners.get('install')({ waitUntil(promise) { installed = promise; } });
  await installed;
  assert.ok(cachedURLs.includes(`${scope}hero.jpg`));
  write('hero.jpg', new Uint8Array([0xff, 0xd8, 0xff, 2]));
  const updated = generatedWorker(root);
  const version = source => source.match(/const CACHE = PREFIX \+ '([a-f0-9]+)'/)[1];
  assert.notEqual(version(absent), version(first));
  assert.notEqual(version(first), version(updated));
});

test('hero.jpg recomienda 2 MiB y comparte el máximo combinado de 8 MiB', t => {
  const { root, write, validate } = appearanceFixture(t);
  write('hero.jpg', Buffer.alloc(2 * 1024 * 1024 + 1));
  const warnings = [];
  generatedWorker(root, warnings);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /2 MiB/);
  write('backgrounds/own.mp4', Buffer.alloc(6 * 1024 * 1024));
  assert.throws(() => validate({ media: { type: 'video', src: 'backgrounds/own.mp4' } }), /8 MiB/);
});
