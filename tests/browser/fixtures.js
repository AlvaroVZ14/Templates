import {test as cleanBase,expect} from '@playwright/test';
import {initialState} from '../fixtures/legacy-state.js';
export async function seedLegacyOrigin(page,url){
  // Existing scenarios exercise a configured historical routine. Seed only this
  // isolated browser profile; tests for the new installation use cleanBase.
  const state=initialState();state.phases[0].startDate='2026-10-01';state.phases[0].anchorDate='2026-10-01';state.trainingStarted='2026-10-01';
  await page.route(url,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Historical test fixture</title>'}));
  await page.goto(url);
  await page.evaluate(async state=>{const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('heavy-duty-personal',1);req.onupgradeneeded=()=>req.result.createObjectStore('app');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('app','readwrite');tx.objectStore('app').put(state,'state');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();},state);
  await page.unroute(url);
}
export const base=cleanBase.extend({page:async({page,baseURL},use)=>{
  await seedLegacyOrigin(page,baseURL);await use(page);
}});
// Existing feature scenarios deliberately leave partially completed workouts.
// The navigation suite uses the base fixture and checks both confirmation paths.
// Older feature scenarios explicitly postpone the new first-run setup through
// its real UI. Prompt 19 scenarios use the base fixture to test onboarding itself.
export const onboardingTest=base.extend({page:async({page},use)=>{
  await page.addLocatorHandler(page.getByRole('heading',{name:'Configurar pesos',exact:true}),async()=>{
    await page.getByRole('button',{name:'Posponer configuración',exact:true}).click();
  });
  await use(page);
}});
export const test=onboardingTest.extend({page:async({page},use)=>{
  page.on('dialog',dialog=>dialog.accept());
  await use(page);
}});
export {expect};

import {go as navigate,chooseDate as selectDate} from './navigation-helpers.js';
// Existing cardio/recovery scenarios now follow the secondary menu destination.
export async function go(page,name){await navigate(page,name==='Hoy'?'Cardio y recuperaci\u00f3n':name);}
export async function chooseDate(page,date){await selectDate(page,date);await navigate(page,'Cardio y recuperaci\u00f3n');}
