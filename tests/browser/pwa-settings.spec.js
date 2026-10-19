import {test,expect,go,chooseDate} from './fixtures.js';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';

test('navegador sin servicio de actualización conserva la app y explica la limitación',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:undefined}));
  await page.goto('./');await expect(page.getByRole('heading',{name:'Hoy',exact:true})).toBeVisible();
  await go(page,'Ajustes');const panel=page.getByRole('region',{name:'Actualizaciones de la app',exact:true});
  await panel.getByRole('button',{name:'Buscar actualizaciones',exact:true}).click();
  await expect(panel.getByRole('status')).toContainText('Este navegador no permite');
  await go(page,'Hoy');await expect(page.locator('.session-list')).toBeVisible();expect(errors).toEqual([]);
});

test('búsqueda visible, versión instalada, sin cambios, sin red y error recuperable',async({page,context})=>{
  await page.addInitScript(()=>{
    window.manualChecks=0;window.failCheck=false;
    const original=ServiceWorkerRegistration.prototype.update;
    ServiceWorkerRegistration.prototype.update=function(){window.manualChecks++;return window.failCheck?Promise.reject(new Error('Error de red ficticio')):original.call(this);};
  });
  await page.goto('./');await expect(page.getByRole('heading',{name:'Hoy',exact:true})).toBeVisible();
  await page.evaluate(()=>navigator.serviceWorker.ready);await go(page,'Ajustes');
  const panel=page.getByRole('region',{name:'Actualizaciones de la app',exact:true}),button=panel.getByRole('button',{name:'Buscar actualizaciones',exact:true});
  await expect(panel).toContainText(/Versión instalada: (local-|[0-9a-f]{7})/);
  for(let i=0;i<2;i++){
    const before=await page.evaluate(()=>window.manualChecks);await button.click();
    await expect(panel.getByRole('status')).toHaveText('Ya tienes la última versión publicada.');
    expect(await page.evaluate(()=>window.manualChecks)).toBeGreaterThan(before);
  }
  await context.setOffline(true);await button.click();await expect(panel.getByRole('status')).toContainText('Sin conexión.');
  await context.setOffline(false);await page.evaluate(()=>{window.failCheck=true;});
  await button.click();await expect(panel.getByRole('status')).toContainText('No se pudo comprobar');
  await expect(panel.getByRole('button',{name:'Actualizar ahora',exact:true})).toHaveCount(0);
  await page.evaluate(()=>{window.failCheck=false;});await button.click();await expect(panel.getByRole('status')).toContainText('última versión publicada');
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:844});await panel.screenshot({path:'test-results/pwa-manual-settings-mobile.png'});
});

test('botón descarga una versión real antes de ofrecerla y actualiza offline conservando series y borradores',async({page,context})=>{
  let version=1,hold=false,release;
  const root=resolve('dist');
  const server=createServer(async(req,res)=>{
    try{
      const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/Templates\//,''),file=resolve(root,path||'index.html');
      if(relative(root,file).startsWith('..')){res.writeHead(404);res.end();return;}
      let body=await readFile(file);
      if(path==='sw.js')body=Buffer.from(body.toString().replace(/const CACHE = PREFIX \+ '[^']+';/,`const CACHE = PREFIX + 'manual-${version}';`));
      if(hold&&path==='icon.svg')await new Promise(resolve=>{release=resolve;});
      const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.ttf':'font/ttf','.jpg':'image/jpeg','.png':'image/png'};
      res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(body);
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    await page.clock.install({time:new Date('2026-10-12T18:00:00Z')});
    await page.goto(`http://127.0.0.1:${server.address().port}/Templates/`);await chooseDate(page,'2026-10-12');
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
    await page.getByLabel('Peso de trabajo de Press banca',{exact:true}).fill('100');
    await page.getByRole('button',{name:/^Guardar serie/}).click();
    await page.getByLabel('Repeticiones de Press banca',{exact:true}).fill('9');
    await go(page,'Ajustes');const panel=page.getByRole('region',{name:'Actualizaciones de la app',exact:true});
    const marker=await page.evaluate(()=>{window.manualReloadMarker='sin recarga';return window.manualReloadMarker;});
    version=2;hold=true;
    await panel.getByRole('button',{name:'Buscar actualizaciones',exact:true}).click();
    await expect(panel.getByRole('button',{name:'Buscando actualizaciones…',exact:true})).toBeDisabled();
    await expect.poll(()=>typeof release).toBe('function');
    await expect(panel.getByRole('button',{name:'Actualizar ahora',exact:true})).toHaveCount(0);
    expect(await page.evaluate(()=>window.manualReloadMarker)).toBe(marker);
    hold=false;release();
    await expect(panel.getByRole('button',{name:'Actualizar ahora',exact:true})).toBeEnabled();
    expect(await page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(true);
    await panel.screenshot({path:'test-results/pwa-manual-ready-mobile.png'});
    await context.setOffline(true);
    await Promise.all([page.waitForEvent('load'),panel.getByRole('button',{name:'Actualizar ahora',exact:true}).click()]);
    await expect(page.getByLabel('Peso de trabajo de Press banca',{exact:true})).toHaveValue('100');
    await expect(page.getByLabel('Repeticiones de Press banca',{exact:true})).toHaveValue('9');
    await expect(page.locator('.session-list .log-row[data-kind=effective]')).toHaveCount(1);
    expect(await page.evaluate(async()=>(await caches.keys()).some(name=>name.endsWith('manual-2')))).toBe(true);
    await go(page,'Ajustes');await expect(panel.getByRole('button',{name:'Actualizar ahora',exact:true})).toHaveCount(0);
  }finally{hold=false;release?.();await context.setOffline(false);server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
