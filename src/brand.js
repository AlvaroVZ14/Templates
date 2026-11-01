export const APP_NAME='Olympia';
export const BRAND_ASSETS=['logo.svg','logo-emblem.svg','logo-wordmark.svg','logo-monochrome.svg','logo-emblem-monochrome.svg','favicon.svg','favicon.ico','apple-touch-icon.png','icon-maskable.svg','icon-maskable-192.png','icon-maskable-512.png'];
export function appName(value){
  const name=typeof value==='string'?value.trim().slice(0,32):'';
  return !name||/^blood\s*&\s*guts$/i.test(name)?APP_NAME:name;
}
