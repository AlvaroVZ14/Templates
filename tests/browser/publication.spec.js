import packageInfo from '../../package.json' with {type:'json'};
import {test,expect} from '@playwright/test';
import {go} from './navigation-helpers.js';
import {initialState} from '../../src/domain.js';
test('Ayuda, versión, QR y recursos de instalación están disponibles también offline',async({page,context})=>{
 const state=initialState();state.onboarding={status:'done'};
 await page.route('**/Olympia-amigos/',r=>r.fulfill({contentType:'text/html',body:'<!doctype html>'}));await page.goto('./');
 await page.evaluate(async state=>{const db=await new Promise(resolve=>{const r=indexedDB.open('olympia-friends',1);r.onupgradeneeded=()=>r.result.createObjectStore('app');r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const t=db.transaction('app','readwrite');t.objectStore('app').put(state,'state');t.oncomplete=resolve;});db.close();},state);await page.unroute('**/Olympia-amigos/');await page.goto('./');
 await go(page,'Acerca de');await expect(page.locator('main')).toContainText(`Versión ${packageInfo.version}`);await go(page,'Ayuda / Instalar');await expect(page.locator('main')).toContainText('Safari');await expect(page.locator('main')).toContainText('Chrome');await expect(page.locator('main a')).toHaveAttribute('href','https://alvarovz14.github.io/Olympia-amigos/');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 await context.setOffline(true);await page.reload();await go(page,'Ayuda / Instalar');await expect(page.getByAltText('QR para abrir Olympia Amigos')).toBeVisible();expect(await page.getByAltText('QR para abrir Olympia Amigos').evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
 const assets=await page.evaluate(async()=>{const names=['icon-192.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png','apple-touch-icon.png','splash/iphone-390-844.png'];return Promise.all(names.map(async name=>({name,ok:(await fetch(name)).ok})));});expect(assets.every(a=>a.ok)).toBe(true);
 for(const width of [360,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
