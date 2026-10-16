import {go,chooseDate} from './fixtures.js';
import { test, expect } from './fixtures.js';

async function openMonday(page) {
  await page.goto('./');
  await chooseDate(page,'2026-10-12');
}

test('sin historial pide referencia y muestra preparaciones calculadas antes de guardar', async ({ page }) => {
  await openMonday(page);
  await expect(page.getByRole('heading', { name: 'Ingresa tu peso de trabajo' })).toBeVisible();
  await page.getByLabel('Peso de trabajo de Press banca', { exact: true }).fill('100');
  await expect(page.getByLabel('Peso de Aproximación 1', { exact: true })).toHaveValue('50');
  await expect(page.getByLabel('Peso de Aproximación 2', { exact: true })).toHaveValue('75');
  await expect(page.getByLabel('Reps de Aproximación 1', { exact: true })).toHaveValue('10');
  await expect(page.getByLabel('Reps de Aproximación 2', { exact: true })).toHaveValue('8');
  await page.getByRole('button', { name: 'Guardar peso de trabajo', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Peso de trabajo guardado');
  await page.getByRole('button', { name: 'Guardar Aproximación 1', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Aproximación guardada');
  await page.reload();
  await chooseDate(page,'2026-10-12');
  await expect(page.getByLabel('Peso de trabajo de Press banca', { exact: true })).toHaveValue('100');
  await expect(page.getByRole('button', { name: 'Guardar Aproximación 1', exact: true })).toBeDisabled();
  await go(page,'Volumen');
  await expect(page.locator('.volume-row').filter({ hasText: 'Pecho' }).locator('b')).toHaveText('0');
});

test('drop visible antes de efectiva, resta 20%, guarda caída separada y actualiza referencia', async ({ page }) => {
  await openMonday(page);
  await page.locator('.exercise-summary').filter({ hasText: 'Press declinado' }).click();
  await page.getByLabel('Peso de trabajo de Press declinado', { exact: true }).fill('100');
  await expect(page.getByLabel('Peso de Caída 1', { exact: true })).toHaveValue('80');
  await expect(page.getByRole('button', { name: 'Guardar Caída 1', exact: true })).toBeDisabled();
  await page.getByLabel('Carga de Press declinado', { exact: true }).fill('90');
  await page.locator('.set-form').getByRole('button', { name: 'Guardar serie' }).click();
  await expect(page.getByLabel('Peso de trabajo de Press declinado', { exact: true })).toHaveValue('90');
  await expect(page.getByLabel('Peso de Caída 1', { exact: true })).toHaveValue('72.5');
  await page.getByLabel('Reps de Caída 1', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Guardar Caída 1', exact: true }).click();
  await expect(page.locator('.log-row')).toHaveCount(2);
  await expect(page.getByLabel('Serie anterior')).toContainText('72.5 kg × 6');
});

test('rest-pause muestra mismo peso por mano y dos mini-series a fallo', async ({ page }) => {
  await openMonday(page);
  await page.locator('.exercise-summary').filter({ hasText: 'Curl mancuernas sentado' }).click();
  await page.getByLabel('Peso de trabajo de Curl mancuernas sentado', { exact: true }).fill('20');
  await expect(page.getByLabel('Peso de Mini-serie 1', { exact: true })).toHaveValue('20');
  await expect(page.getByLabel('Peso de Mini-serie 2', { exact: true })).toHaveValue('20');
  await expect(page.getByLabel('Reps de Mini-serie 1', { exact: true })).toHaveValue('4');
  await expect(page.locator('.work-reference')).toContainText('por mano');
  await page.locator('.set-form').getByRole('button', { name: 'Guardar serie' }).click();
  await page.getByRole('button', { name: 'Guardar Mini-serie 1', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Rest-pause guardada');
  await page.getByRole('button', { name: 'Guardar Mini-serie 2', exact: true }).click();
  await expect(page.locator('.log-row')).toHaveCount(3);
  await expect(page.locator('.log-row').last()).toContainText('Llegué al fallo');
});
