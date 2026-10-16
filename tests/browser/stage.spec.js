import {test,expect} from './fixtures.js';
import {go} from './navigation-helpers.js';

test('banco editable conserva frase del día y hero optimizado sin conexión',async({page,context})=>{
  await page.clock.install({time:new Date('2026-10-12T18:00:00Z')});await page.goto('./');
  const heading=page.getByRole('heading',{name:'Hoy',exact:true});await expect(heading).toBeVisible();
  const original=await heading.textContent();await page.reload();await expect(heading).toHaveText(original);
  await go(page,'Ajustes');await page.locator('.motivation-settings summary').click();
  await expect(page.locator('.motivation-editor-row')).toHaveCount(30);
  await page.getByLabel('Nueva frase',{exact:true}).fill('MI PLAN. MI ESFUERZO. MI REGISTRO.');await page.getByRole('button',{name:'Añadir al banco',exact:true}).click();
  while(await page.locator('.motivation-editor-row').count()>1)await page.getByRole('button',{name:/^Eliminar frase \d+$/}).first().click();
  await page.getByRole('button',{name:'Guardar frases',exact:true}).click();await expect(page.getByRole('status')).toContainText('Banco de frases guardado');
  await go(page,'Hoy');await expect(heading).toHaveText('MI PLAN. MI ESFUERZO. MI REGISTRO.');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  const hero=await page.evaluate(async()=>{for(const name of await caches.keys()){const response=await(await caches.open(name)).match(new URL('hero.jpg',location.href));if(response)return {size:(await response.blob()).size,type:response.headers.get('Content-Type')};}return null;});
  expect(hero.size).toBeLessThan(200000);expect(hero.type).toContain('image/jpeg');
  await context.setOffline(true);await page.reload();await expect(heading).toHaveText('MI PLAN. MI ESFUERZO. MI REGISTRO.');
  await expect(page.getByTestId('shadow-scene').locator('img.shadow-media')).toBeVisible();
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

test('marcador completo destella y respeta movimiento reducido',async({page})=>{
  await page.clock.install({time:new Date('2026-10-12T18:00:00Z')});await page.goto('./');await expect(page.getByRole('heading',{name:'Hoy',exact:true})).toBeVisible();
  await page.evaluate(async()=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal');req.onsuccess=()=>resolve(req.result);});await new Promise((resolve,reject)=>{const tx=db.transaction('app','readwrite'),store=tx.objectStore('app'),req=store.get('state');req.onsuccess=()=>{const state=req.result;state.routine[0]=[{...state.routine[0][0],sets:1}];state.profiles[state.routine[0][0].profileId].workWeight=100;store.put(state,'state');};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();});
  await page.reload();await page.locator('.set-form').getByRole('button',{name:'Guardar serie'}).click();
  await expect(page.locator('.session-hero')).toHaveClass(/session-complete/);await expect(page.locator('.progress-ring')).toHaveClass(/completion-pop/);await expect(page.locator('.progress-ring strong')).toHaveText('1/1');
  await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('.progress-ring').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await expect(page.getByTestId('shadow-scene')).toHaveClass(/is-paused/);
  await expect(page.getByTestId('shadow-scene').locator('canvas.shadow-media')).toBeVisible();
});

test.describe('fallback local',()=>{
  test.use({serviceWorkers:'block'});
  test('si falta hero.jpg conserva la silueta propia',async({page})=>{
    await page.route('**/hero.jpg',route=>route.fulfill({status:404,body:''}));await page.goto('./');
    const scene=page.getByTestId('shadow-scene');await expect(scene.locator('.shadow-athlete')).toBeVisible();await expect(scene.locator('img.shadow-media')).toHaveCount(0);
    await page.screenshot({path:'test-results/p15-svg-fallback.png',fullPage:false});
  });
});
