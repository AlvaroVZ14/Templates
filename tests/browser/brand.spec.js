import {test,expect} from '@playwright/test';
import {initialState} from '../../src/domain.js';
import {BRAND_ASSETS} from '../../src/brand.js';
import {go,menu} from './navigation-helpers.js';
async function seed(page){
 await page.clock.install({time:new Date('2026-11-03T18:00:00Z')});
 const state=initialState();state.appearanceSettings={name:'BLOOD & GUTS',effects:'off'};state.journal={'2026-11-02':{weight:71,sleepHours:8}};
 await page.route('**/Templates/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html>'}));await page.goto('./');
 await page.evaluate(async state=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal',1);req.onupgradeneeded=()=>req.result.createObjectStore('app');req.onsuccess=()=>resolve(req.result);});await new Promise(resolve=>{const tx=db.transaction('app','readwrite');tx.objectStore('app').put(state,'state');tx.oncomplete=resolve;});db.close();},state);
 await page.unroute('**/Templates/');await page.reload();await expect(page.locator('.simple-home')).toBeVisible();
}
test('Olympia reemplaza nombre anterior sin tocar diario; logo en inicio/cajón, móvil y offline',async({page,context})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await seed(page);await expect(page).toHaveTitle('Olympia');
 await expect(page.locator('.simple-home .olympia-brand')).toHaveAttribute('aria-label','Olympia');
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:844});await expect(page.getByRole('button',{name:'EMPEZAR ENTRENAMIENTO',exact:true})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.locator('.simple-home img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));await page.screenshot({path:'test-results/olympia-home-mobile.png',fullPage:true});
 await menu(page);await expect(page.locator('.drawer-heading .olympia-brand')).toHaveAttribute('aria-label','Olympia');await page.locator('.drawer-heading img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));await page.screenshot({path:'test-results/olympia-drawer-mobile.png',animations:'disabled'});await page.getByRole('button',{name:'Cerrar menú',exact:true}).click();
 await go(page,'Diario');await page.getByLabel('Fecha del diario',{exact:true}).fill('2026-11-02');await expect(page.getByLabel('Peso corporal (kg)',{exact:true})).toHaveValue('71');
 await go(page,'Hoy');await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 await context.setOffline(true);await page.reload();await expect(page.locator('.simple-home .olympia-brand')).toBeVisible();
 const assets=await page.evaluate(names=>Promise.all(names.map(async name=>{const response=await fetch(name,{cache:'reload'});return {name,ok:response.ok};})),BRAND_ASSETS);expect(assets.every(asset=>asset.ok)).toBe(true);expect(errors).toEqual([]);
});
test('identidad sigue editable y no fuerza el nombre Olympia sobre una elección personal',async({page})=>{
 await seed(page);await go(page,'Ajustes');await page.getByLabel('Nombre de la app',{exact:true}).fill('Mi gimnasio');await page.getByRole('button',{name:'Guardar apariencia',exact:true}).click();await expect(page.getByText('Apariencia guardada.',{exact:true})).toBeVisible();
 await go(page,'Hoy');await expect(page.locator('.simple-home .olympia-brand')).toHaveAttribute('aria-label','Mi gimnasio');await expect(page).toHaveTitle('Mi gimnasio');await page.reload();await expect(page.locator('.simple-home .olympia-brand')).toHaveAttribute('aria-label','Mi gimnasio');
});
test('splash usa logo vectorial y brillo breve sin obligar a esperar, y respeta movimiento reducido',async({page})=>{
 let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/assets/index-*.js',async route=>{await gate;await route.continue();});
 await page.goto('./',{waitUntil:'commit'});await expect(page.locator('.boot-splash')).toBeVisible();await expect(page.locator('.boot-splash img')).toHaveAttribute('alt','Olympia');
 await page.locator('.boot-splash img').evaluate(image=>image.decode());await page.screenshot({path:'test-results/olympia-splash-mobile.png'});
 await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('.splash-brand').evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('none');
 release();await expect(page.locator('.profile-wizard')).toBeVisible();await expect(page.locator('.profile-question')).toHaveAttribute('data-step','0');await expect(page.locator('.boot-splash')).toHaveCount(0);
});
