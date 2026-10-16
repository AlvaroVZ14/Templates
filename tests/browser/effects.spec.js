import {test,expect} from '@playwright/test';
import {go,chooseDate} from './navigation-helpers.js';

test.beforeEach(async({page})=>{page.on('dialog',dialog=>dialog.accept());});

const stage=page=>page.getByRole('region',{name:'The Shadow: escenario de la sesión'});
async function heroPoint(page){await stage(page).scrollIntoViewIfNeeded();const box=await stage(page).boundingBox();return {x:box.x+box.width*.72,y:box.y+box.height*.36};}
async function mode(page,value){await go(page,'Ajustes');await page.getByLabel('Efectos visuales',{exact:true}).selectOption(value);await page.getByRole('button',{name:'Guardar apariencia'}).click();await expect(page.getByText('Apariencia guardada.')).toBeVisible();}
async function instrument(page){
  await page.addInitScript(()=>{
    window.effectDraws=0;window.effectWaves=0;window.testHidden=false;
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.testHidden});
    const clear=CanvasRenderingContext2D.prototype.clearRect,arc=CanvasRenderingContext2D.prototype.arc;
    CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.classList.contains('ember-field'))window.effectDraws++;return clear.apply(this,args);};
    CanvasRenderingContext2D.prototype.arc=function(...args){if(this.canvas.classList.contains('ember-field'))window.effectWaves++;return arc.apply(this,args);};
  });
}

test('brasas retina, ondas, pausa oculta y modos persistentes sin interferir con formularios',async({page})=>{
  await instrument(page);await page.setViewportSize({width:1440,height:900});await page.goto('./');await chooseDate(page,'2026-10-12');
  const canvas=page.getByTestId('ember-field');await expect(canvas).toHaveAttribute('data-particles','80');await expect(canvas).toHaveAttribute('data-running','true');
  expect(await canvas.evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');expect(await canvas.evaluate(el=>el.width*el.height)).toBeLessThanOrEqual(2500000);
  const point=await heroPoint(page);await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.up();
  await expect.poll(()=>page.evaluate(()=>window.effectWaves)).toBeGreaterThan(0);
  await page.evaluate(()=>{window.testHidden=true;document.dispatchEvent(new Event('visibilitychange'));});await expect(canvas).toHaveAttribute('data-running','false');
  const paused=await page.evaluate(()=>window.effectDraws);await page.waitForTimeout(120);expect(await page.evaluate(()=>window.effectDraws)).toBe(paused);
  await page.evaluate(()=>{window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await expect(canvas).toHaveAttribute('data-running','true');await expect.poll(()=>page.evaluate(()=>window.effectDraws)).toBeGreaterThan(paused);
  const weight=page.getByLabel('Peso de trabajo de Press banca',{exact:true});await weight.fill('100');await expect(canvas).toHaveClass(/is-registering/);
  await weight.blur();await expect(canvas).not.toHaveClass(/is-registering/);
  await page.getByRole('button',{name:'Guardar Aproximación 1',exact:true}).click();await expect(page.locator('.log-row[data-kind=approach]')).toHaveCount(1);
  await mode(page,'reduced');await expect(canvas).toHaveAttribute('data-running','false');const still=await page.evaluate(()=>window.effectDraws);await page.waitForTimeout(100);expect(await page.evaluate(()=>window.effectDraws)).toBe(still);
  await page.reload();await expect(stage(page)).toHaveAttribute('data-effects','reduced');await expect(stage(page)).not.toHaveClass(/shadow-enabled/);
  await mode(page,'off');await expect(canvas).toHaveCount(0);await go(page,'Hoy');await expect(stage(page)).not.toHaveClass(/shadow-enabled/);
  await mode(page,'full');await go(page,'Hoy');await expect(stage(page)).toHaveClass(/shadow-enabled/);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(canvas).toHaveCount(0);await expect(stage(page)).not.toHaveClass(/shadow-enabled/);await expect(page.getByTestId('shadow-scene')).toHaveClass(/is-paused/);
  const staticTransform=await stage(page).locator('.shadow-subject').evaluate(el=>getComputedStyle(el).transform);
  expect(['none','matrix(1, 0, 0, 1, 0, 0)']).toContain(staticTransform);
  await page.mouse.move(600,600);await expect(stage(page)).toHaveCSS('--shadow-x','0');
});

test('tres capas, foco, tensión, pulso y frases sin cambiar entrenamientos; también offline',async({page,context})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');await chooseDate(page,'2026-10-12');await expect(page.getByTestId('ember-field')).toHaveAttribute('data-particles','40');
  const hero=stage(page),point=await heroPoint(page);
  await page.mouse.move(point.x,point.y);await expect.poll(()=>hero.evaluate(el=>Number(el.style.getPropertyValue('--shadow-x')))).toBeGreaterThan(.1);
  expect(await hero.locator('.shadow-subject').evaluate(el=>getComputedStyle(el).transform)).not.toBe('none');expect(await hero.locator('.shadow-spotlight').evaluate(el=>getComputedStyle(el).display)).toBe('block');
  await page.mouse.down();await expect(hero).toHaveClass(/is-tensing/);expect(await hero.locator('.progress-ring').evaluate(el=>getComputedStyle(el).animationName)).toBe('shadow-heart');
  await page.screenshot({path:'test-results/p16-shadow-mobile.png'});
  await page.mouse.up();await expect(hero).toHaveClass(/is-releasing/);await expect(hero).not.toHaveClass(/is-tensing/);await expect(hero).not.toHaveClass(/is-releasing/);
  await expect(hero.locator('.shadow-quote')).toHaveCount(0);await page.mouse.click(point.x,point.y);await expect(hero.locator('.shadow-quote')).toBeVisible();await expect(hero.locator('.shadow-quote')).toHaveCount(0,{timeout:4500});
  await expect(page.locator('.log-row')).toHaveCount(0);
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});await heroPoint(page);
    const layout=await hero.evaluate(el=>{const stats=el.querySelector('.hero-stats').getBoundingClientRect(),hint=el.querySelector('.shadow-instructions').getBoundingClientRect();return {gap:hint.top-stats.bottom,overflow:document.documentElement.scrollWidth>innerWidth};});
    expect(layout.overflow).toBe(false);expect(layout.gap,`instrucciones separadas a ${width}px`).toBeGreaterThanOrEqual(4);
  }
  await page.evaluate(()=>navigator.serviceWorker.ready);await context.setOffline(true);await page.reload();await expect(hero).toBeVisible();await expect(hero.locator('img.shadow-media')).toBeVisible();
  await page.setViewportSize({width:1440,height:900});await heroPoint(page);await page.screenshot({path:'test-results/p16-shadow-desktop.png'});expect(errors).toEqual([]);
});

test('tacto y scroll conservados en móvil retina',async({browser})=>{
  const context=await browser.newContext({isMobile:true,hasTouch:true,deviceScaleFactor:3,viewport:{width:390,height:844},baseURL:'http://localhost:4175/Templates/'}),page=await context.newPage();
  await page.addInitScript(()=>{window.DeviceOrientationEvent=undefined;});
  await page.goto('./');const hero=stage(page),point=await heroPoint(page),canvas=page.getByTestId('ember-field');
  await expect(canvas).toHaveAttribute('data-particles','40');expect(await canvas.evaluate(el=>el.width)).toBe(585);
  await page.touchscreen.tap(point.x,point.y);await expect(hero.locator('.shadow-quote')).toBeVisible();await expect(hero.locator('.shadow-quote')).toHaveCount(0,{timeout:4500});
  const session=await context.newCDPSession(page),before=await page.evaluate(()=>scrollY);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});await expect(hero).toHaveClass(/is-tensing/);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(hero).toHaveClass(/is-releasing/);await expect(hero).not.toHaveClass(/is-releasing/);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});
  for(let step=1;step<=6;step++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y-step*22}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before+50);
  await expect(hero).not.toHaveClass(/is-tensing/);await expect(hero.locator('.shadow-quote')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});

for(const permission of ['granted','denied'])test(`inclinación ${permission}: permiso solo al tocar y alternativa con dedo`,async({page})=>{
  await page.addInitScript(result=>{window.sensorRequests=0;window.DeviceOrientationEvent=class extends Event{static async requestPermission(){window.sensorRequests++;return result;}};},permission);
  await page.goto('./');const hero=stage(page),button=page.getByRole('button',{name:'Activar inclinación',exact:true});await button.scrollIntoViewIfNeeded();expect(await page.evaluate(()=>window.sensorRequests)).toBe(0);
  await button.click();expect(await page.evaluate(()=>window.sensorRequests)).toBe(1);
  await expect(page.locator('.shadow-sensor-message')).toContainText(permission==='granted'?'activada':'Usa el dedo');
  if(permission==='granted'){
    await page.waitForTimeout(850);await page.evaluate(()=>{const send=(beta,gamma)=>{const event=new Event('deviceorientation');Object.assign(event,{beta,gamma});dispatchEvent(event);};send(0,0);send(12,15);});
    await expect.poll(()=>hero.evaluate(el=>Number(el.style.getPropertyValue('--shadow-x')))).toBeGreaterThan(.2);await expect(button).toHaveCount(0);
  }else{const point=await heroPoint(page);await page.mouse.click(point.x,point.y);await expect(hero.locator('.shadow-quote')).toBeVisible();}
  await page.emulateMedia({reducedMotion:'reduce'});await expect(button).toHaveCount(0);await expect(hero).not.toHaveClass(/shadow-enabled/);
});
