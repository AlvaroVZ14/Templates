import {test as base,expect} from '@playwright/test';
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
async function extras(page){for(const item of await page.locator('main .today-extra').all()){if(await item.getAttribute('open')===null)await item.locator(':scope > summary').click();}}
export async function go(page,name){await navigate(page,name);if(name==='Hoy')await extras(page);}
export async function chooseDate(page,date){await selectDate(page,date);await extras(page);}
