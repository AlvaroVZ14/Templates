import {chromium} from '@playwright/test';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname,basename,join} from 'node:path';
const url=process.argv[2]??'https://alvarovz14.github.io/Olympia-amigos/',root=resolve(tmpdir()),profile=await mkdtemp(join(root,'olympia-pwa-audit-'));
const context=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:390,height:844}});
try{
 const page=context.pages()[0],errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(url);if(!response.ok())throw new Error(`HTTP ${response.status()}`);
 await page.locator('.profile-wizard').waitFor();
 const cdp=await context.newCDPSession(page);await cdp.send('Page.enable');
 await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Offline no preparado en30s')),30000))]);if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 const installability=await cdp.send('Page.getInstallabilityErrors'),manifest=await page.evaluate(async()=>{const href=document.querySelector('link[rel=manifest]').href;return {url:href,value:await(await fetch(href)).json()};});
 const icons=await page.evaluate(async icons=>Promise.all(icons.map(async icon=>{const image=new Image();image.src=icon.src;await image.decode();return {...icon,width:image.naturalWidth,height:image.naturalHeight};})),manifest.value.icons);
 if(installability.installabilityErrors.length)throw new Error(JSON.stringify(installability));
 for(const icon of icons)if(`${icon.width}x${icon.height}`!==icon.sizes)throw new Error('Dimensiones incorrectas de icono');
 const scope=await page.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).scope);if(scope!==url)throw new Error(`Scope inesperado: ${scope}`);
 await context.setOffline(true);await page.reload();await page.locator('.profile-wizard').waitFor();await page.getByRole('button',{name:'Empezar',exact:true}).click();await page.getByLabel('Tu nombre',{exact:true}).waitFor();
 if(errors.length)throw new Error(errors.join('\n'));
 const report={url,https:url.startsWith('https:'),checkedAt:new Date().toISOString(),scope,installability,manifest,icons,offlineReload:true,offlineInteraction:true,errors,realPhoneTest:false};
 await mkdir('docs/publicacion',{recursive:true});await writeFile('docs/publicacion/pwa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await context.close();if(dirname(resolve(profile))!==root||!basename(profile).startsWith('olympia-pwa-audit-'))throw new Error('Ruta temporal inesperada');await rm(profile,{recursive:true,force:true});}
