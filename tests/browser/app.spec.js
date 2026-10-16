import {go,chooseDate} from './fixtures.js';
import { test, expect } from './fixtures.js';

async function monday(page) {
  await page.goto('./');
  await chooseDate(page,'2026-10-12');
  await expect(page.getByRole('heading', { name: 'Pecho, hombro y bíceps' })).toBeVisible();
}
async function log(page, kind = 'Efectiva', weight = '60', reps = '8') {
  const card = page.locator('.exercise-card.expanded');
  await card.getByLabel('Tipo de serie').selectOption({ label: kind });
  await card.getByLabel('Carga de Press banca', { exact: true }).fill(weight);
  await card.getByLabel('Repeticiones de Press banca').fill(reps);
  await card.getByRole('button', { name: 'Guardar serie' }).click();
  await expect(card.getByRole('status')).toContainText('guardada');
}

test('registro, persistencia IndexedDB, volumen, preparación y extensiones', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await monday(page);
  await expect(page.getByLabel('Tipo de serie').locator('option')).toHaveCount(5);
  await page.getByLabel('Peso de trabajo de Press banca', { exact: true }).fill('100');
  await expect(page.getByLabel('Peso de Aproximación 1', { exact: true })).toHaveValue('50');
  await expect(page.getByLabel('Reps de Aproximación 1', { exact: true })).toHaveValue('10');
  await page.getByRole('button', { name: 'Guardar Aproximación 1', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Aproximación guardada');
  await log(page);
  await log(page, 'Drop set', '40', '6');
  await go(page,'Volumen');
  const chest = page.locator('.volume-row').filter({ hasText: 'Pecho' });
  await expect(chest.locator('.volume-row-top')).toHaveText('Pecho891');
  await page.reload();
  await chooseDate(page,'2026-10-12');
  await expect(page.locator('.log-row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Eliminar Efectiva de Press banca', exact: true }).click();
  await page.locator('.delete-confirm').getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.locator('.log-row')).toHaveCount(1);
  await expect(page.locator('.log-row')).toContainText('Aproximación');
  expect(errors).toEqual([]);
});

test('editor guarda técnicas, descansos, series, nombre y preserva borradores entre pantallas', async ({ page }) => {
  await monday(page);
  await go(page,'Rutina');
  await page.getByRole('button', { name: 'Lun', exact: true }).click();
  await page.locator('.editor-card').first().getByRole('button').first().click();
  await page.getByLabel('Nombre del ejercicio').fill('Press banca controlado');
  await page.getByLabel('Series efectivas', { exact: true }).fill('3');
  await page.getByLabel('Antes de la efectiva').fill('240');
  await page.getByLabel('Permitir forzadas').check();
  await go(page,'Hoy');
  await go(page,'Rutina');
  await expect(page.getByLabel('Nombre del ejercicio')).toHaveValue('Press banca controlado');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Rutina guardada en este dispositivo.', { exact: true }).last()).toBeVisible();
  await page.reload();
  await chooseDate(page,'2026-10-12');
  await expect(page.locator('.exercise-card').first()).toContainText('Press banca controlado');
  await expect(page.getByLabel('Tipo de serie').locator('option')).toHaveCount(6);
  await page.getByLabel('Tipo de serie').selectOption('forced');
  await page.getByLabel('Carga de Press banca controlado', { exact: true }).fill('60');
  await page.getByLabel('Repeticiones de Press banca controlado').fill('3');
  await page.getByRole('button', { name: 'Guardar serie' }).click();
  await expect(page.locator('.log-row')).toHaveCount(0);
});

test('PWA precachea los assets, permite recargar y guardar sin red', async ({ page, context }) => {
  await monday(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })); });
  await expect(page.getByText('Offline listo')).toBeVisible();
  const manifest = await page.evaluate(async () => (await fetch('./manifest.webmanifest')).json());
  expect(manifest.display).toBe('standalone'); expect(manifest.icons).toHaveLength(2);
  expect(new URL(manifest.start_url, page.url()).pathname).toBe('/Templates/');
  expect(new URL(manifest.scope, page.url()).pathname).toBe('/Templates/');
  expect(new URL(manifest.id, page.url()).pathname).toBe('/Templates/');
  const paths = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const cacheNames = (await caches.keys()).filter(name => name.startsWith('heavy-duty-'));
    const urls = (await Promise.all(cacheNames.map(async name => (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)))).flat();
    return { scope: new URL(registration.scope).pathname, worker: new URL(registration.active.scriptURL).pathname, urls };
  });
  expect(paths.scope).toBe('/Templates/');
  expect(paths.worker).toBe('/Templates/sw.js');
  expect(paths.urls.length).toBeGreaterThanOrEqual(7);
  expect(paths.urls.every(path => path.startsWith('/Templates/'))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await chooseDate(page,'2026-10-12');
  await expect(page.getByText('Sin conexión', { exact: true })).toBeVisible();
  await log(page, 'Efectiva', '62.5', '7');
  await page.reload();
  await chooseDate(page,'2026-10-12');
  await expect(page.locator('.log-row')).toHaveCount(1);
  await expect(page.locator('.log-row')).toContainText('62.5');
});

test('móvil, descanso y escritorio sin desbordamientos', async ({ page }) => {
  await monday(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of ['Hoy', 'Rutina', 'Volumen']) {
      await go(page,tab);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await go(page,'Hoy');
  await chooseDate(page,'2026-10-12');
  await page.screenshot({ path: 'test-results/mobile-today.png', fullPage: true });
  await chooseDate(page,'2026-10-14');
  await expect(page.getByRole('heading', { name: 'Este día es de descanso.' })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go(page,'Volumen');
  await page.screenshot({ path: 'test-results/desktop-volume.png', fullPage: true });
});

test('un fallo de almacenamiento no muestra un guardado falso ni pierde el formulario', async ({ page }) => {
  await monday(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      IDBObjectStore.prototype.put = original;
      throw new DOMException('Simulated quota', 'QuotaExceededError');
    };
  });
  await page.getByLabel('Carga de Press banca', { exact: true }).fill('60');
  await page.getByLabel('Repeticiones de Press banca').fill('8');
  await page.getByRole('button', { name: 'Guardar serie' }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo guardar');
  await expect(page.locator('.log-row')).toHaveCount(0);
  await expect(page.getByLabel('Repeticiones de Press banca')).toHaveValue('8');
  await page.getByRole('button', { name: 'Guardar serie' }).click();
  await expect(page.locator('.log-row')).toHaveCount(1);
});
