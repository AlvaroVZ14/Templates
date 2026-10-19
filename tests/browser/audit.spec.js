import {quickTab} from './quick-helpers.js';
import {test,expect,go,chooseDate} from './fixtures.js';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';

test('actualización real de PWA espera el toque y recupera pesos y borradores, incluso offline',async({page,context})=>{
  let version=1;
  const root=resolve('dist');
  const server=createServer(async(req,res)=>{
    try{
      const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/Templates\//,'');
      const file=resolve(root,path||'index.html');
      if(!file.startsWith(root)){res.writeHead(404);res.end();return;}
      let body=await readFile(file);
      if(path==='sw.js')body=Buffer.from(body.toString().replace(/const CACHE = PREFIX \+ '[^']+';/,`const CACHE = PREFIX + 'audit-${version}';`));
      const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.ttf':'font/ttf','.jpg':'image/jpeg','.png':'image/png'};
      res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(body);
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    await page.clock.install({time:new Date('2026-10-12T18:00:00Z')});
    await page.goto(`http://127.0.0.1:${server.address().port}/Templates/`);
    await expect(page.getByRole('heading',{name:'Pecho, hombro y bíceps',exact:true})).toBeVisible();
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
    const weight=page.getByLabel('Peso de trabajo de Press banca',{exact:true});await weight.fill('100');
    await page.getByLabel('Repeticiones de Press banca',{exact:true}).fill('9');
    await go(page,'Rutina');await page.getByRole('button',{name:'Lun',exact:true}).click();await page.locator('.editor-card').first().getByRole('button').first().click();
    await page.getByLabel('Nombre del ejercicio',{exact:true}).fill('Press de prueba ficticio');
    const peer=await context.newPage();await peer.goto(page.url());await peer.evaluate(()=>{window.auditMarker='formulario abierto';});
    version=2;await page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;await reg.update();});
    const update=page.getByRole('button',{name:'Hay una versión nueva, tocar para actualizar',exact:true});await expect(update).toBeVisible();
    expect(await page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(true);
    await expect(page.getByLabel('Nombre del ejercicio',{exact:true})).toHaveValue('Press de prueba ficticio');
    await page.screenshot({path:'test-results/audit-update-mobile.png',fullPage:false});
    await context.setOffline(true);
    await Promise.all([page.waitForEvent('load'),update.click()]);
    await expect(page.getByLabel('Peso de trabajo de Press banca',{exact:true})).toHaveValue('100');
    await expect(page.getByLabel('Repeticiones de Press banca',{exact:true})).toHaveValue('9');
    await go(page,'Rutina');await page.getByRole('button',{name:'Lun',exact:true}).click();await page.locator('.editor-card').first().getByRole('button').first().click();
    await expect(page.getByLabel('Nombre del ejercicio',{exact:true})).toHaveValue('Press de prueba ficticio');
    await expect(page.getByRole('button',{name:'Hay una versión nueva, tocar para actualizar',exact:true})).toHaveCount(0);
    expect(await peer.evaluate(()=>window.auditMarker)).toBe('formulario abierto');
    await expect(peer.getByRole('button',{name:'Hay una versión nueva, tocar para actualizar',exact:true})).toBeVisible();
    expect(await peer.evaluate(async()=>(await caches.keys()).filter(key=>key.startsWith('heavy-duty-')).length)).toBe(2);
    await peer.close();
  }finally{await context.setOffline(false);server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('medianoche chilena actualiza hoy sin mover ni perder la sesión abierta',async({page})=>{
  await page.clock.install({time:new Date('2026-10-16T02:59:30Z')});await page.goto('./');
  await expect(page.getByRole('heading',{name:'Hombro y brazo',exact:true})).toBeVisible();
  await page.getByLabel('Peso de trabajo de Press militar mancuernas',{exact:true}).fill('20');
  await page.clock.fastForward(65000);
  await expect(page.getByText('Estás viendo la sesión del 2026-10-15. Hoy en Chile: 2026-10-16.',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Peso de trabajo de Press militar mancuernas',{exact:true})).toHaveValue('20');
  await page.getByRole('button',{name:'Ir a hoy',exact:true}).click();await expect(page.getByRole('heading',{name:'Pierna',exact:true})).toBeVisible();
});

test('sin historial, pesos, alimentos ni rutina: todas las secciones abren sin errores y conservan vacíos',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('./');await expect(page.getByRole('button',{name:'Abrir menú',exact:true})).toBeVisible();
  // Start from a real initialized database, then clear only this isolated test profile.
  await chooseDate(page,'2026-10-12');
  await page.evaluate(async()=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal');req.onsuccess=()=>resolve(req.result);});await new Promise(resolve=>{const tx=db.transaction([...db.objectStoreNames],'readwrite'),app=tx.objectStore('app'),req=app.get('state');req.onsuccess=()=>{const state=req.result;state.routine=Array.from({length:7},()=>[]);state.profiles={};state.logs=[];state.foods=[];state.phases=[];state.journal={};state.measurements=[];state.cardio=[];state.trainingDrafts={};app.put(state,'state');for(const name of ['sessions','cardio','journal','measurements','phases'])tx.objectStore(name).clear();};tx.oncomplete=()=>{db.close();resolve();};});});
  await page.reload();await expect(page.getByRole('heading',{name:'Día de descanso',exact:true})).toBeVisible();
  for(const section of ['Historial','Medidas','Diario','Comida','Progreso','Método','Ajustes','Configurar pesos','Rutina','Hoy'])await go(page,section);
  await go(page,'Comida');await expect(page.getByText('No hay alimentos en la base.',{exact:false})).toBeVisible();
  expect(errors).toEqual([]);await page.screenshot({path:'test-results/audit-empty-mobile.png',fullPage:true});
});

test('todas las pantallas caben a 320 y 390 px; fases nuevas no recuperan fechas vencidas',async({page})=>{
  test.setTimeout(60000);await page.clock.install({time:new Date('2031-06-02T18:00:00Z')});await page.goto('./');
  for(const width of [320,390]){
    await page.setViewportSize({width,height:844});
    for(const section of ['Historial','Medidas','Diario','Comida','Progreso','Método','Ajustes','Rutina','Hoy']){
      await go(page,section);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${section} a ${width}px`).toBe(true);
    }
  }
  await go(page,'Comida');await page.locator('summary').filter({hasText:'Editar o cambiar fase'}).click();
  await page.getByRole('combobox',{name:'Fase',exact:true}).selectOption('maintain');
  await page.getByRole('combobox',{name:'Fase',exact:true}).selectOption('bulk');
  expect(await page.getByLabel('Inicio de fase',{exact:true}).inputValue()).toBe('2031-06-02');
  expect(Date.parse(await page.getByLabel('Fecha objetivo',{exact:true}).inputValue())).toBeGreaterThan(Date.parse('2031-06-02'));
});

test('respaldo descargado hace ida y vuelta por la importación real y recupera datos originales',async({page})=>{
  await page.clock.install({time:new Date('2026-10-12T18:00:00Z')});await page.goto('./');
  await page.getByLabel('Peso de trabajo de Press banca',{exact:true}).fill('100');
  await quickTab(page,'Otras');await page.getByLabel('Tipo de serie').selectOption('effective');
  await page.getByLabel('Carga de Press banca',{exact:true}).fill('100');
  await page.getByLabel('Repeticiones de Press banca',{exact:true}).fill('8');
  await page.getByRole('button',{name:/^Guardar serie/}).click();
  await expect(page.locator('.log-row')).toHaveCount(1);
  await go(page,'Diario');await page.getByLabel('Peso corporal (kg)',{exact:true}).fill('70');await page.getByRole('button',{name:'Guardar diario',exact:true}).click();await expect(page.getByText('Diario guardado.',{exact:true})).toBeVisible();
  await go(page,'Ajustes');const pending=page.waitForEvent('download');await page.locator('.backup-panel').getByRole('button',{name:'Exportar respaldo',exact:true}).click();
  const file=await pending,payload=JSON.parse(await readFile(await file.path(),'utf8'));
  await go(page,'Diario');await page.getByLabel('Peso corporal (kg)',{exact:true}).fill('71');await page.getByRole('button',{name:'Guardar diario',exact:true}).click();await expect(page.getByText('Diario guardado.',{exact:true})).toBeVisible();
  await go(page,'Ajustes');await page.locator('.backup-panel summary').click();await page.getByLabel('Archivo de respaldo',{exact:true}).setInputFiles({name:'ida-vuelta-ficticio.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
  await expect(page.locator('.backup-panel')).toContainText('Archivo validado');await page.getByLabel('Modo de importación',{exact:true}).selectOption('replace');
  await page.getByRole('button',{name:'Reemplazar con este respaldo',exact:true}).click();await expect(page.getByLabel('Peso de trabajo de Press banca',{exact:true})).toHaveValue('100');
  const actual=await page.evaluate(async()=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal');req.onsuccess=()=>resolve(req.result);});return new Promise(resolve=>{const tx=db.transaction([...db.objectStoreNames]),records={};for(const name of db.objectStoreNames){const keys=tx.objectStore(name).getAllKeys(),values=tx.objectStore(name).getAll();values.onsuccess=()=>{records[name]=values.result.map((value,i)=>({key:keys.result[i],value}));};}tx.oncomplete=()=>{db.close();resolve(records);};});});
  for(const name of ['sessions','cardio','journal','measurements','phases','sessionRevisions'])expect(actual[name],name).toEqual(payload.records[name]);
  const source=payload.records.app.find(row=>row.key==='state').value,restored=actual.app.find(row=>row.key==='state').value;
  delete source.backupSettings;delete restored.backupSettings;expect(restored).toEqual(source);
  expect(actual.migrationBackups.length).toBe(payload.records.migrationBackups.length+2);
});
