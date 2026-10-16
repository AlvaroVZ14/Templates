import {go,chooseDate} from './fixtures.js';
import {test,expect} from './fixtures.js';

async function start(page){
  await page.clock.install({time:new Date('2026-10-15T15:00:00Z')});await page.goto('./');
  await go(page,'Comida');
  await expect(page.getByLabel('Consumo promedio actual',{exact:true})).toHaveValue('');
  await go(page,'Diario');
  await page.getByLabel('Peso corporal (kg)',{exact:true}).fill('70');
  await page.getByRole('button',{name:'Guardar diario',exact:true}).click();await expect(page.getByText('Diario guardado.',{exact:true})).toBeVisible();
  await go(page,'Comida');
  await page.getByLabel('Consumo promedio actual',{exact:true}).fill('2200');
  await page.getByLabel('Reducción en descanso',{exact:true}).fill('10');
  await page.getByRole('button',{name:'Calcular propuesta',exact:true}).click();
  await expect(page.getByLabel('Calorías objetivo',{exact:true})).toHaveValue('2450');
  await page.getByRole('button',{name:'Confirmar metas nutricionales',exact:true}).click();
  await expect(page.getByText(/Metas confirmadas desde 2026-10-15/)).toBeVisible();
}
async function stored(page){return page.evaluate(async()=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal');req.onsuccess=()=>resolve(req.result);});return new Promise(resolve=>{const tx=db.transaction('app','readonly'),req=tx.objectStore('app').get('state');tx.oncomplete=()=>{db.close();resolve(req.result);};});});}

test('cuatro comidas, consumo único, edición histórica de alimentos y recarga offline',async({page,context})=>{
  await start(page);
  await go(page,'Hoy');
  await page.getByRole('button',{name:'Generar 4 comidas',exact:true}).click();
  await expect(page.locator('.planned-meal')).toHaveCount(4);
  await page.getByLabel('Comida 1 realizada',{exact:true}).click();
  await expect(page.getByLabel('Comida 1 realizada',{exact:true})).toBeChecked();
  await page.getByLabel('Comida 1 realizada',{exact:true}).check();
  let state=await stored(page);expect(state.foodLogs).toHaveLength(1);const old=state.foodLogs[0].macros.kcal,oldPlan=state.mealPlans['2026-10-15'].total.kcal;
  await go(page,'Comida');
  await page.locator('summary').filter({hasText:'Base de alimentos editable (7)'}).click();
  await page.locator('summary').filter({hasText:/^Pan$/}).click();
  await page.getByLabel('bread kcal',{exact:true}).fill('200');
  await page.getByRole('button',{name:'Guardar Pan',exact:true}).click();
  await expect(page.getByText('Alimento guardado. Los planes y consumos anteriores conservan sus valores.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Pan',exact:true}).click();
  await page.getByRole('button',{name:'Registrar alimento consumido',exact:true}).click();
  await expect(page.getByText('Consumo guardado. El plan previsto no cambia.',{exact:true})).toBeVisible();
  state=await stored(page);expect(state.foodLogs).toHaveLength(2);expect(state.foodLogs[0].macros.kcal).toBe(old);expect(state.foodLogs[1].macros.kcal).toBe(200);expect(state.mealPlans['2026-10-15'].total.kcal).toBe(oldPlan);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.reload();await go(page,'Hoy');
  await expect(page.getByLabel('Comida 1 realizada',{exact:true})).toBeChecked();
  await page.getByLabel('Comida 1 realizada',{exact:true}).click();
  await expect(page.getByLabel('Comida 1 realizada',{exact:true})).not.toBeChecked();
  state=await stored(page);expect(state.foodLogs).toHaveLength(1);expect(state.foodLogs[0].source).toBe('quick');
});

test('calendario corrige descanso, recuperación opcional y cardio omitido persisten',async({page})=>{
  await start(page);await go(page,'Hoy');
  await chooseDate(page,'2026-10-18');
  await expect(page.getByRole('heading',{name:'Recuperación de hoy',exact:true})).toBeVisible();
  await page.getByLabel('Descanso cumplido',{exact:true}).click();
  await expect(page.getByLabel('Descanso cumplido',{exact:true})).toBeChecked();
  await page.getByRole('button',{name:'Omitir cardio hoy',exact:true}).click();
  await expect(page.getByText('Cardio omitido. No se compensará otro día.',{exact:true})).toBeVisible();
  await page.reload();await chooseDate(page,'2026-10-18');
  await expect(page.getByLabel('Descanso cumplido',{exact:true})).toBeChecked();
  await expect(page.getByRole('button',{name:'Omitir cardio hoy',exact:true})).toBeDisabled();
  await page.locator('summary').filter({hasText:'Tipo de día y hora de entrenamiento'}).click();
  await page.getByRole('combobox',{name:'Tipo de día',exact:true}).selectOption('legs');
  await page.getByRole('combobox',{name:'Rutina de este día',exact:true}).selectOption('4');
  await page.getByLabel('Hora de entrenamiento',{exact:true}).fill('17:00');
  await page.getByRole('button',{name:'Guardar calendario',exact:true}).click();
  await expect(page.getByText('Calendario guardado. Regenera el plan previsto para aplicar la distribución.',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Recuperación de hoy',exact:true})).toHaveCount(0);
  await expect(page.locator('.cardio-section')).toContainText('Solo caminata suave opcional');
  await page.getByRole('button',{name:'Generar 4 comidas',exact:true}).click();
  const state=await stored(page);expect(state.mealPlans['2026-10-18'].context.type).toBe('legs');expect(state.mealPlans['2026-10-18'].context.trainingTime).toBe('17:00');
});

test('cambio de fase conserva historial y calorías hasta nueva confirmación',async({page})=>{
  await start(page);
  await page.locator('summary').filter({hasText:'Editar o cambiar fase'}).click();
  await page.getByRole('combobox',{name:'Fase',exact:true}).selectOption('maintain');
  await page.getByRole('button',{name:'Confirmar fase',exact:true}).click();
  await expect(page.getByText('Fase confirmada. La anterior se conserva en el historial.',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Fase actual · Mantención',exact:true})).toBeVisible();
  const state=await stored(page);expect(state.phaseHistory).toHaveLength(1);expect(state.phaseHistory[0].calorieChanges[0].kcal).toBe(2450);expect(state.goalRevisions).toHaveLength(1);
  await page.locator('summary').filter({hasText:/Historial de fases/}).click();
  await expect(page.locator('.program-history')).toContainText('2450 kcal confirmadas');
});

test('alerta de proteína solo al cerrar tres días completos y no se repite tras descartarla',async({page})=>{
  await start(page);
  for(const date of ['2026-10-15','2026-10-16','2026-10-17']){
    await page.getByLabel('Fecha de comida',{exact:true}).fill(date);
    await page.getByRole('button',{name:'Huevo',exact:true}).click();
    await page.getByRole('button',{name:'Registrar alimento consumido',exact:true}).click();
    await expect(page.getByText('Consumo guardado. El plan previsto no cambia.',{exact:true})).toBeVisible();
    await page.getByRole('checkbox',{name:/Registros del día completos/}).click();
    await expect(page.getByRole('checkbox',{name:/Registros del día completos/})).toBeChecked();
  }
  await expect(page.getByText('Tres días completos seguidos bajo la meta de proteína.',{exact:true})).toBeVisible();
  await page.locator('.program-notice').filter({hasText:'Tres días completos'}).getByRole('button',{name:'Entendido',exact:true}).click();
  await page.getByLabel('Fecha de comida',{exact:true}).fill('2026-10-18');
  await page.getByRole('button',{name:'Huevo',exact:true}).click();await page.getByRole('button',{name:'Registrar alimento consumido',exact:true}).click();
  await page.getByRole('checkbox',{name:/Registros del día completos/}).click();
  await expect(page.getByRole('checkbox',{name:/Registros del día completos/})).toBeChecked();
  await expect(page.getByText('Tres días completos seguidos bajo la meta de proteína.',{exact:true})).toHaveCount(0);
});

test('fatiga reduce recomendación y pantalla Comida funciona en celular',async({page})=>{
  await start(page);await go(page,'Diario');
  await page.getByLabel('Fatiga (1–10)',{exact:true}).fill('9');await page.getByRole('button',{name:'Guardar diario',exact:true}).click();
  await expect(page.getByText('Diario guardado.',{exact:true})).toBeVisible();await go(page,'Hoy');
  await expect(page.getByText('Reduce o salta el cardio hoy.',{exact:true})).toBeVisible();
  await go(page,'Comida');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/food-mobile.png',fullPage:true});
});
