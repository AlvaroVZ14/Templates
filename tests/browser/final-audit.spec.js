import {test,expect,chromium} from '@playwright/test';
import {initialState} from '../../src/domain.js';
import {go,chooseDate,openExercise} from './navigation-helpers.js';
import {resolve} from 'node:path';
const targets={Pecho:14,Espalda:13,'Bíceps':10,'Tríceps':4,'Deltoides laterales':6,'Deltoides posteriores':4,'Cuádriceps':10,Femorales:6,'Glúteos':4,Aductores:2,Abductores:4,Gemelos:4,Abdomen:4};
async function boot(page){
 await page.setViewportSize({width:360,height:800});await page.clock.install({time:new Date('2026-11-03T18:00:00Z')});page.on('dialog',dialog=>dialog.accept());
 const state=initialState();state.appearanceSettings={...state.appearanceSettings,effects:'off'};for(const profile of Object.values(state.profiles))profile.workWeight=40;
 await page.route('**/Olympia-amigos/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html>'}));await page.goto('./');
 await page.evaluate(async state=>{const db=await new Promise(resolve=>{const r=indexedDB.open('olympia-friends',1);r.onupgradeneeded=()=>r.result.createObjectStore('app');r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const tx=db.transaction('app','readwrite');tx.objectStore('app').put(state,'state');tx.oncomplete=resolve;});db.close();},state);
 await page.unroute('**/Olympia-amigos/');await page.reload();await expect(page.locator('.simple-home')).toBeVisible();
}
test('auditoría: los cinco días muestran7 ejercicios/17 filas, y13 músculos suman85',async({page})=>{
 await boot(page);
 for(const [date,name] of [['2026-11-03','PUSH'],['2026-11-04','PULL'],['2026-11-05','LEG A'],['2026-11-07','TORSO'],['2026-11-08','LEG B']]){
  await chooseDate(page,date);await expect(page.locator('.fast-session-heading h1')).toHaveText(name);await expect(page.locator('.workout-exercise')).toHaveCount(7);await expect(page.locator('.fast-set-line')).toHaveCount(17);await expect(page.getByRole('progressbar',{name:'Series completadas'})).toHaveAttribute('aria-valuenow','0');await expect(page.getByRole('progressbar',{name:'Series completadas'})).toHaveAttribute('aria-valuemax','17');
 }
 await go(page,'Progreso');await page.locator('.weekly-volume-details>summary').click();
 const actual=await page.locator('.volume-row-top').evaluateAll(rows=>Object.fromEntries(rows.map(row=>[row.querySelector('strong').textContent,Number(row.querySelectorAll('span')[1].textContent)]).filter(([,value])=>value>0)));
 expect(actual).toEqual(targets);expect(Object.values(actual).reduce((a,b)=>a+b,0)).toBe(85);
});
test('auditoría360px: secciones, registro, manifest instalable y recarga offline',async({page,context})=>{
 test.setTimeout(60000);await boot(page);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const section of ['Historial','Progreso','Check mensual','Medidas','Diario','Comida','Método','Ajustes','Configurar pesos','Rutina','Hoy']){
  await go(page,section);
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&getComputedStyle(el).position!=='fixed'&&r.right>innerWidth+1;}).slice(0,8).map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right})));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${section}: ${JSON.stringify(overflow)}`).toBe(true);
 }
 await openExercise(page,'Press inclinado mancuernas');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 const cdp=await context.newCDPSession(page),manifest=await cdp.send('Page.getAppManifest'),install=await cdp.send('Page.getInstallabilityErrors');
 expect(manifest.errors).toEqual([]);expect(install.installabilityErrors.filter(error=>error.errorId!=='in-incognito')).toEqual([]);await context.setOffline(true);await page.reload();await expect(page.locator('.fast-set-line')).toHaveCount(17);expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/audit-360-workout.png',fullPage:true});
});
test('criterios PWA en perfil normal, sin la restricción de instalación del modo incógnito',async({baseURL},testInfo)=>{
 const context=await chromium.launchPersistentContext(resolve(testInfo.project.outputDir,'pwa-profile'),{channel:'chromium',headless:true,viewport:{width:360,height:800}});
 try{const page=context.pages()[0];await page.goto(baseURL);await expect(page.locator('.profile-wizard')).toBeVisible();await page.evaluate(()=>navigator.serviceWorker.ready);const cdp=await context.newCDPSession(page),manifest=await cdp.send('Page.getAppManifest'),install=await cdp.send('Page.getInstallabilityErrors');expect(manifest.errors).toEqual([]);expect(install.installabilityErrors).toEqual([]);}finally{await context.close();}
});
test('encabezados legibles sin fuente condensada: no desbordan320/360px',async({page})=>{
 test.setTimeout(60000);await boot(page);await page.addStyleTag({content:'h1,h2,.progress-value{font-family:Arial,sans-serif!important}'});
 for(const width of [320,360]){
  await page.setViewportSize({width,height:800});
  for(const section of ['Historial','Método','Ajustes','Comida','Medidas']){
   await go(page,section);
   const dimensions=await page.evaluate(()=>({root:document.documentElement.scrollWidth,window:innerWidth,overflow:[...document.querySelectorAll('main *')].filter(el=>el.scrollWidth>el.clientWidth+1).slice(0,10).map(el=>({tag:el.tagName,class:el.className,width:el.clientWidth,scroll:el.scrollWidth}))}));
   expect(dimensions.root<=dimensions.window,`${section} a ${width}px: ${JSON.stringify(dimensions)}`).toBe(true);
  }
 }
});
