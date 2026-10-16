import {test,expect} from './fixtures.js';
import {go,chooseDate} from './navigation-helpers.js';
import {readFile} from 'node:fs/promises';

test('identidad editable, fuentes locales offline y pantallas sin desbordamientos',async({page,context})=>{
  const external=[];page.on('request',request=>{if(!request.url().startsWith('http://localhost:4175/'))external.push(request.url());});
  await page.goto('./');await expect(page.getByRole('heading',{name:'A entrenar.'})).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(10, 10, 10)');
  expect(await page.locator('h1:visible').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Anton');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  const cached=await page.evaluate(async()=>{const names=await caches.keys();return(await Promise.all(names.map(async name=>(await(await caches.open(name)).keys()).map(request=>request.url)))).flat();});
  expect(cached.filter(url=>url.endsWith('.ttf'))).toHaveLength(3);
  expect(cached.some(url=>url.endsWith('/Templates/appearance.json'))).toBe(true);
  await chooseDate(page,'2026-10-12');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'test-results/blood-guts-today-mobile.png',fullPage:false});
  await go(page,'Ajustes');await page.getByLabel('Nombre de la app',{exact:true}).fill('MI DIARIO');await page.getByLabel('Lema del inicio').fill('CONSTANCIA Y CONTROL.');await page.getByRole('button',{name:'Guardar apariencia'}).click();await expect(page.getByText('Apariencia guardada.')).toBeVisible();
  await context.setOffline(true);await page.reload();await expect(page.locator('.brand')).toContainText('MI DIARIO');await expect(page.locator('.page-heading:visible')).toContainText('CONSTANCIA Y CONTROL.');
  expect(await page.evaluate(()=>document.fonts.check('24px Anton'))).toBe(true);
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    for(const section of ['Hoy','Historial','Progreso','Método','Medidas','Diario','Comida','Ajustes']){
      await go(page,section);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${section} a ${width}px`).toBe(true);
    }
  }
  await page.setViewportSize({width:1440,height:1000});await go(page,'Progreso');await page.screenshot({path:'test-results/blood-guts-progress-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await go(page,'Método');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'test-results/blood-guts-method-mobile.png',fullPage:false});
  expect(external).toEqual([]);
});

test('destello solo al guardar efectiva, fallo y anillo decreciente; movimiento reducido',async({page})=>{
  await page.clock.install();await page.goto('./');await chooseDate(page,'2026-10-12');
  await page.getByLabel('Peso de trabajo de Press banca',{exact:true}).fill('100');await page.getByRole('button',{name:'Guardar Aproximación 1',exact:true}).click();
  await expect(page.locator('.log-row[data-kind=approach]')).toHaveCount(1);await expect(page.locator('.effective-save-flash')).toHaveCount(0);
  const failure=page.locator('.set-form').getByLabel('Llegué al fallo');await failure.uncheck();await failure.check();await expect(page.locator('.set-form .failure-shake')).toHaveCount(1);
  await page.locator('.set-form').getByRole('button',{name:'Guardar serie'}).click();await expect(page.locator('.log-row[data-kind=effective]')).toHaveCount(1);await expect(page.locator('.effective-save-flash')).toHaveCount(1);
  const ring=page.locator('.rest-countdown');const before=Number(await ring.getAttribute('stroke-dashoffset'));await page.clock.fastForward(30000);await expect.poll(async()=>Number(await ring.getAttribute('stroke-dashoffset'))).toBeGreaterThan(before);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.getByTestId('shadow-scene')).toHaveClass(/is-paused/);
  expect(await page.locator('.shadow-glow').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await expect(page.locator('.effective-save-flash')).not.toBeVisible();
  expect(await page.locator('.failure-shake').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

test.describe('medios personalizados',()=>{
test.use({serviceWorkers:'block'}); // Route synthetic media without SW interception.
test('fondo propio opcional y animación pausada al ocultar la pestaña',async({page})=>{
  await page.addInitScript(()=>{window.testHidden=false;Object.defineProperty(document,'hidden',{get:()=>window.testHidden,configurable:true});});
  await page.route('**/appearance.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({media:{type:'image',src:'icon-512.png'},poster:null})}));
  await page.goto('./');await expect(page.locator('img.shadow-media')).toBeVisible();
  await expect(page.getByTestId('shadow-scene')).not.toHaveClass(/is-paused/);
  await page.evaluate(()=>{window.testHidden=true;document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.getByTestId('shadow-scene')).toHaveClass(/is-paused/);
  await expect(page.locator('img.shadow-media')).toHaveCount(0);await expect(page.locator('canvas.shadow-media')).toBeVisible();
  expect(await page.locator('.shadow-glow').evaluate(el=>getComputedStyle(el).animationPlayState)).toBe('paused');
  await page.evaluate(()=>{window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await expect(page.getByTestId('shadow-scene')).not.toHaveClass(/is-paused/);
});

test('video propio silenciado en bucle se pausa con movimiento reducido',async({page})=>{
  const bytes=await readFile(new URL('../fixtures/theme-loop.webm',import.meta.url));
  await page.route('**/appearance.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({media:{type:'video',src:'mi-video.webm'},poster:null})}));
  await page.route('**/mi-video.webm',route=>route.fulfill({contentType:'video/webm',body:Buffer.from(bytes)}));
  await page.goto('./');const video=page.locator('video.shadow-media');
  await expect.poll(()=>page.evaluate(()=>{const el=document.querySelector('video');return el?{paused:el.paused,muted:el.muted,loop:el.loop,inline:el.playsInline,error:el.error?.code??null}:{};})).toEqual({paused:false,muted:true,loop:true,inline:true,error:null});
  await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(()=>video.evaluate(el=>el.paused)).toBe(true);
});
});
