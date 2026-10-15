import { test, expect } from '@playwright/test';

async function monday(page) {
  await page.goto('./');
  await page.getByLabel('Fecha de entrenamiento').fill('2026-10-12');
}

test('RPE, notas, historial gráfico y cardio sobreviven a una recarga offline', async ({ page, context }) => {
  await monday(page);
  await page.getByLabel('Peso de trabajo de Press banca', { exact: true }).fill('100');
  await page.getByLabel('RPE de Press banca', { exact: true }).fill('9');
  await page.getByRole('button', { name: 'Guardar serie', exact: false }).click();
  await expect(page.getByLabel('Serie anterior')).toContainText('RPE 9');
  await page.getByLabel('Notas de Press banca').fill('Asiento 3. Bajada controlada.');
  await page.getByRole('button', { name: 'Guardar notas', exact: true }).click();
  await expect(page.getByText('Notas guardadas.', { exact: true })).toBeVisible();
  await page.locator('.history-panel summary').click();
  await expect(page.getByRole('img', { name: 'Evolución de carga de Press banca' })).toBeVisible();
  await page.getByLabel('Fecha de entrenamiento').fill('2026-10-19');
  await expect(page.getByLabel('Serie anterior')).toContainText('2026-10-12');
  await page.getByLabel('Carga de Press banca', { exact: true }).fill('102.5');
  await page.getByRole('button', { name: 'Guardar serie', exact: false }).click();
  await page.locator('.history-panel summary').click();
  await expect(page.locator('.history-chart circle')).toHaveCount(2);
  await page.getByLabel('Tipo de cardio').selectOption('Bici');
  await page.getByLabel('Minutos de cardio').fill('25');
  await page.getByRole('combobox', { name: 'Intensidad', exact: true }).selectOption('Moderada');
  await page.getByRole('button', { name: 'Guardar cardio', exact: true }).click();
  await expect(page.locator('.cardio-row')).toContainText('25 min');
  await page.getByLabel('Pasos diarios', { exact: true }).fill('8200');
  await page.getByRole('button', { name: 'Guardar pasos', exact: true }).click();
  await expect(page.getByText('Pasos diarios guardados.', { exact: true })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Fecha de entrenamiento').fill('2026-10-19');
  await expect(page.getByLabel('Notas de Press banca')).toHaveValue('Asiento 3. Bajada controlada.');
  await expect(page.getByLabel('Peso de trabajo de Press banca', { exact: true })).toHaveValue('102.5');
  await expect(page.getByLabel('Pasos diarios', { exact: true })).toHaveValue('8200');
  await expect(page.locator('.cardio-row')).toContainText('BiciModerada25 min');
  await page.getByRole('button', { name: 'Volumen', exact: true }).click();
  await expect(page.locator('.volume-row').filter({ hasText: 'Pecho' }).locator('b')).toHaveText('1');
});

test('editor permite 3 preparaciones, 3 caídas y redondeo personalizado', async ({ page }) => {
  await monday(page);
  await page.getByRole('button', { name: 'Rutina', exact: true }).click();
  await page.getByRole('button', { name: 'Lun', exact: true }).click();
  await page.locator('.editor-card').first().getByRole('button').first().click();
  await page.getByLabel('Series de preparación', { exact: true }).fill('3');
  await page.getByRole('combobox', { name: 'Extensión planeada', exact: true }).selectOption('drop');
  await page.getByLabel('Caídas de drop set', { exact: true }).fill('3');
  await page.getByLabel('Redondeo de sugerencias (kg)', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Rutina guardada en este dispositivo.', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Hoy', exact: true }).click();
  await page.getByLabel('Peso de trabajo de Press banca', { exact: true }).fill('100');
  for (const [i, weight] of [[1, '40'], [2, '60'], [3, '80']]) await expect(page.getByLabel(`Peso de Aproximación ${i}`, { exact: true })).toHaveValue(weight);
  for (const [i, weight] of [[1, '80'], [2, '65'], [3, '50']]) await expect(page.getByLabel(`Peso de Caída ${i}`, { exact: true })).toHaveValue(weight);
  await page.locator('.suggestions').screenshot({ path: 'test-results/mobile-suggestions.png' });
  await page.getByLabel('Reps de Aproximación 1', { exact: true }).fill('9');
  await page.getByLabel('RPE de Aproximación 1', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Guardar Aproximación 1', exact: true }).click();
  await expect(page.locator('.log-row')).toContainText('RPE 5');
  await expect(page.locator('.log-row')).toContainText('× 9');
});

test('migra datos de la versión anterior sin borrar series ni reiniciar descansos', async ({ page }) => {
  await monday(page);
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const request = indexedDB.open('heavy-duty-personal', 1); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('app', 'readwrite'), store = transaction.objectStore('app'), request = store.get('state');
      request.onsuccess = () => {
        const state = request.result, ex = state.routine[0][0];
        state.schemaVersion = 1; delete state.profiles; delete state.cardio; delete state.dailySteps;
        ex.equipment = 'free'; delete ex.profileId; ex.rests.effective = 240;
        state.logs = [{ id: 'legacy', exerciseId: ex.id, exerciseName: ex.name, muscle: ex.muscle, date: '2026-10-12', kind: 'effective', weight: 85, reps: 7, failure: true, createdAt: '2026-10-12T12:00:00Z' }];
        store.put(state, 'state');
      };
      transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  });
  await page.reload();
  await page.getByLabel('Fecha de entrenamiento').fill('2026-10-12');
  await expect(page.getByLabel('Peso de trabajo de Press banca', { exact: true })).toHaveValue('85');
  await expect(page.locator('.log-row')).toHaveCount(1);
  await expect(page.locator('.log-row')).toContainText('RPE sin dato');
  await expect(page.locator('.rest-shortcuts')).toContainText('4:00');
});

test('temporizador automático termina y solicita vibración', async ({ page }) => {
  await page.addInitScript(() => { window.vibrations = []; Object.defineProperty(navigator, 'vibrate', { value: pattern => { window.vibrations.push(pattern); return true; } }); });
  await page.clock.install();
  await monday(page);
  await page.getByLabel('Carga de Press banca', { exact: true }).fill('80');
  await page.getByRole('button', { name: 'Guardar serie', exact: false }).click();
  await expect(page.getByRole('timer')).toContainText('3:');
  await page.clock.fastForward(211000);
  await expect(page.getByText('Descanso terminado', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.vibrations)).toEqual([[150, 80, 150]]);
});
