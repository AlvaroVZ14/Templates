import {test as base,expect} from '@playwright/test';
// Existing feature scenarios deliberately leave partially completed workouts.
// The navigation suite uses the base fixture and checks both confirmation paths.
export const test=base.extend({page:async({page},use)=>{
  page.on('dialog',dialog=>dialog.accept());
  await use(page);
}});
export {expect};

import {go as navigate,chooseDate as selectDate} from './navigation-helpers.js';
async function extras(page){for(const item of await page.locator('main .today-extra').all()){if(await item.getAttribute('open')===null)await item.locator(':scope > summary').click();}}
export async function go(page,name){await navigate(page,name);if(name==='Hoy')await extras(page);}
export async function chooseDate(page,date){await selectDate(page,date);await extras(page);}
