import {quickTab} from './quick-helpers.js';
import {go,chooseDate} from './fixtures.js';
import {test,expect} from './fixtures.js';
async function monday(page){await page.clock.install({time:new Date('2026-10-12T15:00:00Z')});await page.goto('./');await expect(page.locator('.session-list .exercise-card')).toHaveCount(8);}
async function open(page,name){await page.locator('.session-list .exercise-summary').filter({hasText:name}).click();}
const reference=(page,name)=>page.getByLabel(`Peso de trabajo de ${name}`,{exact:true});
async function editCount(page,name,value){
 await page.getByRole('button',{name:`Configurar previas de ${name}`,exact:true}).click();
 await page.getByRole('button',{name:value===null?`Previas automáticas de ${name}`:`Previas ${value} de ${name}`,exact:true}).click();
 await page.getByRole('button',{name:'Guardar previas',exact:true}).click();
 await expect(page.getByRole('dialog',{name:`Previas · ${name}`,exact:true})).not.toBeVisible();
}

test('previas visibles según orden, carga calculada y nuevo músculo independiente',async({page})=>{
 await monday(page);await expect(page.locator('.session-list .preparation-line strong')).toHaveText([2,2,2,1,0,2,2,0].map(n=>`PREVIAS · ${n}`));
 await reference(page,'Press banca').fill('100');await expect(page.getByLabel('Peso de Aproximación 2',{exact:true})).toHaveValue('75');await expect(page.getByLabel('Reps de Aproximación 2',{exact:true})).toHaveValue('8');
 await quickTab(page,'Efectiva');await page.locator('.set-form').getByRole('button',{name:'Guardar serie'}).click();await open(page,'Press declinado');await reference(page,'Press declinado').fill('100');await expect(page.getByLabel('Peso de Aproximación 1',{exact:true})).toHaveValue('60');await expect(page.getByLabel('Reps de Aproximación 1',{exact:true})).toHaveValue('6');
 await open(page,'Aperturas mancuernas');await reference(page,'Aperturas mancuernas').fill('100');await expect(page.getByLabel('Peso de Aproximación 1',{exact:true})).toHaveValue('45');await expect(page.getByLabel('Reps de Aproximación 1',{exact:true})).toHaveValue('10');
 await open(page,'Aperturas máquina');await reference(page,'Aperturas máquina').fill('100');await quickTab(page,'Previas');await expect(page.locator('.suggested-set')).toHaveCount(0);await expect(page.locator('.exercise-card.expanded .preparation-line strong')).toHaveText('PREVIAS · 0');await expect(page.locator('.exercise-card.expanded .preparation-none')).toBeVisible();
 await open(page,'Elevaciones laterales');await reference(page,'Elevaciones laterales').fill('20');await expect(page.getByLabel('Peso de Aproximación 1',{exact:true})).toHaveValue('10');
 await page.getByRole('button',{name:'Configurar previas de Elevaciones laterales',exact:true}).click();await expect(page.getByRole('dialog',{name:'Previas · Elevaciones laterales',exact:true}).locator('.preparation-auto-reason')).toContainText('Primer ejercicio de Hombro');await page.getByRole('button',{name:'Cerrar previas de Elevaciones laterales',exact:true}).click();
});
test('un toque guarda 0–3, mínimo global y registro previo sobreviven offline',async({page,context})=>{
 await monday(page);await reference(page,'Press banca').fill('100');await quickTab(page,'Previas');await page.getByRole('button',{name:'Guardar Aproximación 1',exact:true}).click();await expect(page.locator('.log-row')).toHaveCount(1);
 await editCount(page,'Press banca',0);await expect(page.locator('.exercise-card.expanded .preparation-line strong')).toHaveText('PREVIAS · 0');await expect(page.locator('.suggested-set')).toHaveCount(0);await expect(page.locator('.log-row')).toHaveCount(1);
 await page.locator('summary').filter({hasText:'Preparación: ajustes globales'}).click();await page.getByRole('combobox',{name:'Mínimo de previas',exact:true}).selectOption('1');await expect(page.locator('.exercise-card.expanded .preparation-line strong')).toHaveText('PREVIAS · 0');
 await editCount(page,'Press banca',3);await expect(page.locator('.suggested-set')).toHaveCount(3);await expect(page.getByLabel('Reps de Aproximación 2',{exact:true})).toHaveValue('6');
 await go(page,'Rutina');await page.locator('.editor-card').first().getByRole('button').first().click();await expect(page.getByLabel('Series de preparación',{exact:true})).toHaveValue('3');await page.getByLabel('Nombre del ejercicio',{exact:true}).fill('Press banca propio');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await expect(page.getByText('Rutina guardada en este dispositivo.',{exact:true}).last()).toBeVisible();
 await go(page,'Hoy');await expect(page.getByRole('button',{name:'Configurar previas de Press banca propio',exact:true})).toContainText('Manual');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.reload();await expect(reference(page,'Press banca propio')).toHaveValue('100');await expect(page.locator('.exercise-card.expanded .preparation-line strong')).toHaveText('PREVIAS · 3');await expect(page.locator('.log-row')).toHaveCount(1);
 await editCount(page,'Press banca propio',null);await expect(page.locator('.exercise-card.expanded .preparation-line strong')).toHaveText('PREVIAS · 2');
});
test('reordenar la rutina recalcula Auto y el registro rechaza más de 80%',async({page})=>{
 await monday(page);await reference(page,'Press banca').fill('100');await quickTab(page,'Previas');await page.getByLabel('Peso de Aproximación 1',{exact:true}).fill('81');await quickTab(page,'Previas');await page.getByRole('button',{name:'Guardar Aproximación 1',exact:true}).click();await expect(page.getByRole('alert')).toContainText('80%');await expect(page.locator('.log-row')).toHaveCount(0);
 await go(page,'Rutina');await page.locator('.editor-card').filter({hasText:'Aperturas mancuernas'}).getByRole('button').first().click();for(let i=0;i<3;i++)await page.getByRole('button',{name:'Subir Aperturas mancuernas',exact:true}).click();await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await expect(page.getByText('Rutina guardada en este dispositivo.',{exact:true}).last()).toBeVisible();await go(page,'Hoy');
 await expect(page.locator('.session-list .exercise-card').first()).toContainText('Aperturas mancuernas');await expect(page.locator('.session-list .exercise-card').first().locator('.preparation-line strong')).toHaveText('PREVIAS · 2');await expect(page.locator('.session-list .exercise-card').nth(1).locator('.preparation-line strong')).toHaveText('PREVIAS · 2');
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.locator('.exercise-card.expanded').screenshot({path:'test-results/context-preparation-mobile.png'});
});
test('opcionales apagados al inicio, casillas por fecha y rotadores solo en días de press',async({page,context})=>{
 await monday(page);await expect(page.getByLabel('Calentamiento general realizado',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Rotadores serie 1 realizada',{exact:true})).toHaveCount(0);
 await page.locator('summary').filter({hasText:'Preparación: ajustes globales'}).click();await page.getByLabel('Activar calentamiento general',{exact:true}).click();await expect(page.getByLabel('Activar calentamiento general',{exact:true})).toBeChecked();await page.getByRole('combobox',{name:'Duración del calentamiento general',exact:true}).selectOption('8');await page.getByLabel('Activar rotadores antes de press',{exact:true}).click();await expect(page.getByLabel('Activar rotadores antes de press',{exact:true})).toBeChecked();
 await page.getByLabel('Calentamiento general realizado',{exact:true}).click();await expect(page.getByLabel('Calentamiento general realizado',{exact:true})).toBeChecked();await page.getByLabel('Rotadores serie 1 realizada',{exact:true}).click();await expect(page.getByLabel('Rotadores serie 1 realizada',{exact:true})).toBeChecked();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.reload();await expect(page.getByLabel('Calentamiento general realizado',{exact:true})).toBeChecked();await expect(page.getByLabel('Rotadores serie 1 realizada',{exact:true})).toBeChecked();await expect(page.locator('.optional-preparation')).toContainText('8 min');
 await chooseDate(page,'2026-10-13');await expect(page.getByLabel('Rotadores serie 1 realizada',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Calentamiento general realizado',{exact:true})).not.toBeChecked();await expect(page.locator('.log-row')).toHaveCount(0);
});

test('fichas calculadas guardan una previa con tarjeta cerrada sin duplicarla',async({page})=>{
 await monday(page);const card=page.locator('.exercise-card').first();
 await reference(page,'Press banca').fill('100');await open(page,'Press banca');
 await expect(card).not.toHaveClass(/expanded/);await expect(card.locator('.preparation-chip')).toHaveCount(2);
 await expect(card.locator('.preparation-chip').first()).toContainText('50');
 await card.screenshot({path:'test-results/p15-preparation-chips.png'});
 await expect(card.locator('.preparation-chip').first()).toContainText('50%');
 const chip=card.getByRole('button',{name:'Guardar previa 1 de Press banca',exact:true});
 await chip.click({clickCount:2});await expect(card.getByRole('button',{name:'Previa guardada 1 de Press banca',exact:true})).toBeDisabled();
 await expect(card.getByRole('status')).toContainText('Previa 1 guardada');
 await open(page,'Press banca');await expect(card.locator('.log-row[data-kind=approach]')).toHaveCount(1);
 await expect(card.locator('.log-row[data-kind=effective]')).toHaveCount(0);
 await expect(card.getByLabel('Peso de Aproximación 1',{exact:true})).toHaveValue('50');
 await quickTab(page,'Previas');await expect(card.getByRole('button',{name:'Guardar Aproximación 1',exact:true})).toBeDisabled();
 await expect(page.getByLabel('Temporizador de descanso')).toBeVisible();
});

test('hoja de previas pide referencia, previsualiza sin guardar y recupera el Auto real',async({page})=>{
 await monday(page);const card=page.locator('.exercise-card').nth(1);
 await expect(card.locator('.preparation-choices')).toHaveCount(0);
 await card.getByRole('button',{name:'Ingresa tu peso de trabajo'}).click();
 const sheet=page.getByRole('dialog',{name:'Previas · Press declinado',exact:true});
 await expect(sheet).toBeVisible();await expect(sheet.locator('.preparation-auto-reason')).toContainText('Compuesto pesado: mínimo 2');
 await sheet.getByLabel('Peso de trabajo para previas de Press declinado',{exact:true}).fill('100');
 await sheet.getByRole('button',{name:'Previas 3 de Press declinado',exact:true}).click();
 await expect(sheet.locator('.preparation-live-preview li strong')).toHaveText(['40 kg × 10','60 kg × 6','80 kg × 3']);
 await expect(card.locator('.preparation-line strong')).toHaveText('PREVIAS · 2');
 for(const width of [320,390]){await page.setViewportSize({width,height:844});expect(await sheet.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);}
 await sheet.locator('.preparation-live-preview').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/p15-preparation-sheet.png',fullPage:false});
 await sheet.getByRole('button',{name:'Guardar previas',exact:true}).click();await expect(sheet).not.toBeVisible();
 await expect(card.locator('.preparation-line')).toContainText('Manual');await expect(card.locator('.preparation-chip')).toHaveCount(3);
 await expect(card.getByRole('button',{name:'Volver a Auto de Press declinado',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:'Configurar previas de Press declinado',exact:true})).toContainText('Manual');
 await page.getByRole('button',{name:'Configurar previas de Press declinado',exact:true}).click();
 const reopened=page.getByRole('dialog',{name:'Previas · Press declinado',exact:true});
 await expect(reopened.locator('.preparation-auto-reason')).toContainText('propone 2');
 await expect(reopened.locator('.preparation-auto-reason')).not.toContainText('Tu ajuste guardado');
 await reopened.getByRole('button',{name:'Volver a Auto',exact:true}).click();await reopened.getByRole('button',{name:'Guardar previas',exact:true}).click();
 await expect(page.getByRole('button',{name:'Configurar previas de Press declinado',exact:true})).toContainText('Auto');
 await expect(page.locator('.exercise-card').nth(1).locator('.preparation-line strong')).toHaveText('PREVIAS · 2');
 await page.getByRole('button',{name:'Configurar previas de Press declinado',exact:true}).click();await page.keyboard.press('Escape');await expect(reopened).not.toBeVisible();
});

test('volver a Auto desde la línea compacta no exige peso ni abre la hoja',async({page})=>{
 await monday(page);await editCount(page,'Press declinado',0);
 const card=page.locator('.exercise-card').nth(1);
 await expect(card.locator('.preparation-mode')).toHaveText('(Manual)');
 await card.getByRole('button',{name:'Volver a Auto de Press declinado',exact:true}).click();
 await expect(card.locator('.preparation-mode')).toHaveText('(Auto)');
 await expect(card.locator('.preparation-line strong')).toHaveText('PREVIAS · 2');
 await expect(card.getByRole('button',{name:'Ingresa tu peso de trabajo'})).toBeVisible();
 await expect(page.getByRole('dialog',{name:'Previas · Press declinado',exact:true})).not.toBeVisible();
});
