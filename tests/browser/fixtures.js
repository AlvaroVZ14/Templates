import {test as base,expect} from '@playwright/test';
// Existing feature scenarios deliberately leave partially completed workouts.
// The navigation suite uses the base fixture and checks both confirmation paths.
export const test=base.extend({page:async({page},use)=>{
  page.on('dialog',dialog=>dialog.accept());
  await use(page);
}});
export {expect};
