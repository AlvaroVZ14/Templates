import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {initialState as legacyState} from '../fixtures/legacy-state.js';
import {go,chooseDate} from './navigation-helpers.js';
const card=page=>page.locator('.session-list .exercise-card.expanded');
const tab=(page,name)=>card(page).getByRole('tab',{name:new RegExp(`^${name}`)});
async function reference(page,name,value){const panel=card(page).locator('.quick-reference');if(!await panel.evaluate(el=>el.open))await panel.locator('summary').click();await page.getByLabel(`Peso de trabajo de ${name}`,{exact:true}).fill(value);await panel.getByRole('button',{name:'Guardar peso de trabajo',exact:true}).click();}
async function data(page){return page.evaluate(async()=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal');req.onsuccess=()=>resolve(req.result);});try{return await new Promise(resolve=>{const req=db.transaction('app').objectStore('app').get('state');req.onsuccess=()=>resolve(req.result);});}finally{db.close();}});}
async function start(page){await page.clock.install({time:new Date('2026-11-03T18:00:00Z')});await page.goto('./');await page.getByRole('button',{name:'Posponer configuración',exact:true}).click();page.on('dialog',dialog=>dialog.accept());}

test('instalación nueva PPL: siete ejercicios, Top + Back-off desde Top real y referencia offline',async({page,context})=>{
 await start(page);await expect(page.getByRole('heading',{name:'PUSH',exact:true})).toBeVisible();await expect(page.locator('.session-list .exercise-card')).toHaveCount(7);
 const name='Press inclinado mancuernas';await reference(page,name,'30');await expect(card(page).locator('.next-effective-plan')).toContainText('Top set');await expect(card(page).locator('.next-effective-plan')).toContainText('6–10');
 await page.getByLabel(`Carga de ${name}`,{exact:true}).fill('40');await card(page).getByRole('button',{name:/^Guardar serie/}).click();await expect(card(page).locator('.next-effective-plan')).toContainText('Back-off');await expect(page.getByLabel(`Carga de ${name}`,{exact:true})).toHaveValue('36');
 await card(page).getByRole('button',{name:/^Guardar serie/}).click();
 let state=await data(page),ex=state.routine[1][0];expect(state.logs.map(row=>row.setRole)).toEqual(['top','backoff']);expect(state.profiles[ex.profileId].workWeight).toBe(40);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.reload();await expect(page.getByLabel(`Carga de ${name}`,{exact:true})).toHaveValue('36');expect((await data(page)).logs).toHaveLength(2);
});

test('PPL: Drop y RP esperan última efectiva; caídas y mini-series quedan separadas sin volumen extra',async({page})=>{
 await start(page);let name='Aperturas en polea';await page.locator('.session-list .exercise-summary').filter({hasText:name}).click();await reference(page,name,'100');await tab(page,'Drop set').click();await expect(card(page)).toContainText('Solo tras la última efectiva');await expect(page.getByLabel('Peso de Caída 1',{exact:true})).toHaveCount(0);
 for(let n=0;n<3;n++){await tab(page,'Efectiva').click();await card(page).getByRole('button',{name:/^Guardar serie/}).click();}
 await tab(page,'Drop set').click();await expect(page.getByLabel('Peso de Caída 1',{exact:true})).toHaveValue('80');await page.getByLabel('Reps de Caída 1',{exact:true}).fill('5');await page.getByRole('button',{name:'Guardar Caída 1',exact:true}).click();
 name='Elevaciones laterales mancuerna';await page.locator('.session-list .exercise-summary').filter({hasText:name}).click();await reference(page,name,'20');await tab(page,'Rest-pause').click();await expect(page.getByLabel('Peso de Mini-serie 1',{exact:true})).toHaveCount(0);
 for(let n=0;n<2;n++){await tab(page,'Efectiva').click();await card(page).getByRole('button',{name:/^Guardar serie/}).click();}
 await tab(page,'Rest-pause').click();for(const n of [1,2]){await expect(page.getByLabel(`Peso de Mini-serie ${n}`,{exact:true})).toHaveValue('20');await page.getByRole('button',{name:`Guardar Mini-serie ${n}`,exact:true}).click();}
 const state=await data(page),drops=state.logs.filter(row=>row.kind==='drop'),rp=state.logs.filter(row=>row.kind==='rp'),effective=state.logs.filter(row=>row.kind==='effective');expect(effective).toHaveLength(5);expect(drops).toHaveLength(1);expect(rp).toHaveLength(2);expect(drops[0].parentId).toBe(effective[2].id);expect(rp.every(row=>row.parentId===effective[4].id)).toBe(true);
 await go(page,'Progreso');await page.locator('.weekly-volume-details summary').click();await expect(page.locator('.volume-row').filter({hasText:'Pecho'}).locator('b')).toHaveText('3');
});

test('migración real instala rutina nueva sin reescribir series históricas ni repetir snapshot',async({page})=>{
 await page.clock.install({time:new Date('2026-11-03T18:00:00Z')});const source=legacyState();delete source.routineVersion;const ex=source.routine[0][0];source.profiles[ex.profileId].workWeight=85;source.logs=[{id:'historical-fictitious',exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,muscle:ex.muscle,date:'2026-10-12',kind:'effective',weight:85,reps:8,rpe:10,failure:true,createdAt:'2026-10-12T18:00:00Z'}];
 await page.route('**/Templates/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Historical migration fixture</title>'}));await page.goto('./');await page.evaluate(async state=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal',1);req.onupgradeneeded=()=>req.result.createObjectStore('app');req.onsuccess=()=>resolve(req.result);});await new Promise(resolve=>{const tx=db.transaction('app','readwrite');tx.objectStore('app').put(state,'state');tx.oncomplete=resolve;});db.close();},source);await page.unroute('**/Templates/');await page.reload();await page.getByRole('button',{name:'Posponer configuración',exact:true}).click();page.on('dialog',dialog=>dialog.accept());
 let state=await data(page);expect(state.routine.map(day=>day.length)).toEqual([0,7,7,7,0,7,7]);expect(state.logs).toEqual(source.logs);expect(state.profiles[state.routine[1][1].profileId].workWeight).toBe(85);expect(state.routineMigrationBackups.at(-1).state.logs).toEqual(source.logs);
 await go(page,'Historial');await page.getByRole('button',{name:/2026-10-12/}).click();await expect(page.locator('.history-detail')).toContainText('Press banca');await expect(page.locator('.history-detail')).toContainText('85');
 const exporting=page.waitForEvent('download');await page.locator('.history-page .backup-panel').getByRole('button',{name:'Exportar respaldo',exact:true}).click();const file=await exporting,payload=JSON.parse(await readFile(await file.path(),'utf8')),backupState=payload.records.app.find(row=>row.key==='state').value;expect(backupState.logs).toEqual(source.logs);expect(backupState.routineMigrationBackups.at(-1).state.logs).toEqual(source.logs);
 const snapshots=state.routineMigrationBackups.length;await page.reload();state=await data(page);expect(state.routineMigrationBackups).toHaveLength(snapshots);expect(state.logs).toEqual(source.logs);
 await chooseDate(page,'2026-11-09');await expect(page.getByTestId('rest-card')).toContainText('PUSH');await expect(page.getByTestId('rest-card')).toContainText('martes');
});

test('editor sincroniza cantidad, técnica final y reducción de Back-off sin restaurar defaults al recargar',async({page})=>{
 await start(page);await go(page,'Rutina');await page.getByRole('button',{name:'Mar',exact:true}).click();
 await page.locator('.editor-card').filter({hasText:'Press inclinado mancuernas'}).locator('.exercise-summary').click();
 await page.getByLabel('Series efectivas',{exact:true}).fill('3');await page.getByLabel('Reducción Back-off de Press inclinado mancuernas',{exact:true}).fill('20');
 await page.locator('.editor-card').filter({hasText:'Aperturas en polea'}).locator('.exercise-summary').click();await page.getByRole('combobox',{name:/^Extensión planeada/}).selectOption('');
 await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await expect(page.getByRole('status')).toContainText('Rutina guardada');
 await page.reload();const state=await data(page);expect(state.routine[1][0].sets).toBe(3);expect(state.routine[1][0].setPlan.map(row=>row.role)).toEqual(['top','backoff','backoff']);expect(state.routine[1][0].backoffPercent).toBe(20);expect(state.routine[1][2].technique).toBe('');expect(state.routine[1][2].setPlan.every(row=>row.technique==='')).toBe(true);
 await expect(page.getByRole('heading',{name:'PUSH',exact:true})).toBeVisible();
});

test('curl TORSO requiere carga ligera propia y cambiar pestañas no vuelve a proponer la pesada',async({page})=>{
 await start(page);await chooseDate(page,'2026-11-07');const name='Curl mancuerna';await page.locator('.session-list .exercise-summary').filter({hasText:name}).click();await reference(page,name,'24');
 for(let n=0;n<3;n++)await card(page).getByRole('button',{name:/^Guardar serie/}).click();
 await expect(card(page).locator('.next-effective-plan')).toContainText('Ligera');await expect(card(page).locator('.next-effective-plan')).toContainText('12–15');await expect(page.getByLabel(`Carga de ${name}`,{exact:true})).toHaveValue('');
 await tab(page,'Otras').click();await tab(page,'Efectiva').click();await expect(page.getByLabel(`Carga de ${name}`,{exact:true})).toHaveValue('');
 await page.getByLabel(`Carga de ${name}`,{exact:true}).fill('14');await page.getByLabel(`Repeticiones de ${name}`,{exact:true}).fill('13');await card(page).getByRole('button',{name:/^Guardar serie/}).click();
 const state=await data(page),ex=state.routine[5][3];expect(state.logs.map(row=>row.setRole)).toEqual(['heavy','heavy','heavy','light']);expect(state.profiles[ex.profileId].workWeight).toBe(24);
});
