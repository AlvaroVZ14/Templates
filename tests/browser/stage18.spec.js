import {test,expect,go,chooseDate} from './fixtures.js';
async function stored(page){return page.evaluate(async()=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal');req.onsuccess=()=>resolve(req.result);});return new Promise(resolve=>{const tx=db.transaction('app','readonly'),req=tx.objectStore('app').get('state');tx.oncomplete=()=>{db.close();resolve(req.result);};});});}
async function orientation(page,beta,gamma){await page.evaluate(({beta,gamma})=>{const event=new Event('deviceorientation');Object.assign(event,{beta,gamma});dispatchEvent(event);},{beta,gamma});}

test('fuego solo en márgenes, ráfagas acotadas y menor presupuesto al registrar',async({page})=>{
  await page.clock.install({time:new Date('2026-10-12T15:00:00Z')});await page.setViewportSize({width:1920,height:1080});await page.goto('./');await expect(page.getByRole('heading',{name:'Hoy',exact:true})).toBeVisible();const fire=page.getByTestId('ember-field');await expect(fire).toHaveAttribute('data-particles','200');
  const before=await stored(page);for(let i=0;i<5;i++)await page.mouse.click(120,700);
  await expect.poll(()=>fire.evaluate(el=>Number(el.dataset.bursts))).toBeGreaterThan(0);expect(await fire.evaluate(el=>Number(el.dataset.particles))).toBeLessThanOrEqual(240);expect(await stored(page)).toEqual(before);
  const pixels=await fire.evaluate(el=>{const ctx=el.getContext('2d'),ratio=el.width/innerWidth;return {center:ctx.getImageData(Math.floor(el.width/2),Math.floor(el.height*.9),1,1).data[3],edge:ctx.getImageData(Math.floor(150*ratio),Math.floor((innerHeight-30)*ratio),1,1).data[3]};});expect(pixels.center).toBe(0);expect(pixels.edge).toBeGreaterThan(0);
  await page.screenshot({path:'test-results/p18-fire-desktop.png'});
  await page.getByLabel('Peso de trabajo de Press banca',{exact:true}).fill('100');await expect(fire).toHaveAttribute('data-target-fps','30');await expect(fire).toHaveAttribute('data-bursts','0');expect(await fire.evaluate(el=>Number(el.dataset.particles))).toBeLessThanOrEqual(160);
  await page.mouse.click(100,650);await expect(fire).toHaveAttribute('data-bursts','0');
  await page.setViewportSize({width:390,height:844});await expect.poll(()=>fire.evaluate(el=>Number(el.dataset.particles))).toBeLessThanOrEqual(25);expect(await fire.evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('descanso: hoy, miércoles, domingo, editor y calendario sin días fijos',async({page})=>{
  test.setTimeout(60000);await page.clock.install({time:new Date('2026-10-14T15:00:00Z')});await page.goto('./');const card=page.getByTestId('rest-card');await expect(card).toContainText('Hoy toca descansar.');await expect(card).toContainText('mañana (jueves): Hombro + Brazo');
  await chooseDate(page,'2026-10-18');await expect(card).toContainText('Este día es de descanso.');await expect(card).toContainText('mañana (lunes): Pecho + Hombro + Bíceps');
  await chooseDate(page,'2026-10-14');await go(page,'Rutina');await page.getByRole('button',{name:'Jue',exact:true}).click();
  for(let i=0;i<7;i++){await page.locator('.editor-card .exercise-summary').first().click();await page.getByRole('button',{name:'Quitar',exact:true}).click();await page.getByRole('button',{name:'Confirmar',exact:true}).click();}
  await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await expect(page.getByText('Rutina guardada en este dispositivo.',{exact:true}).last()).toBeVisible();await go(page,'Hoy');await expect(card).toContainText('el viernes: Pierna');
  await chooseDate(page,'2026-10-16');await page.locator('summary').filter({hasText:'Tipo de día y hora de entrenamiento'}).click();await page.getByLabel('Tipo de día',{exact:true}).selectOption('rest');await page.getByRole('button',{name:'Guardar calendario',exact:true}).click();await chooseDate(page,'2026-10-14');await expect(card).toContainText('el sábado: Torso');
  await page.clock.setSystemTime(new Date('2026-10-15T15:00:00Z'));await chooseDate(page,'2026-10-16');await expect(card).toContainText('Mañana toca descansar.');
  await page.clock.setSystemTime(new Date('2026-10-16T15:00:00Z'));await chooseDate(page,'2026-10-14');await expect(card).toContainText('Este día es de descanso.');
  await page.setViewportSize({width:390,height:844});await card.screenshot({path:'test-results/p18-rest-mobile.png'});
});

test('computador sin sensor: no ofrece inclinación aunque exista la API',async({page})=>{
  await page.addInitScript(()=>{window.sensorRequests=0;window.DeviceOrientationEvent=class extends Event{static async requestPermission(){window.sensorRequests++;return 'granted';}};});await page.goto('./');await expect(page.getByRole('button',{name:'Activar inclinación'})).toHaveCount(0);expect(await page.evaluate(()=>window.sensorRequests)).toBe(0);
});

test.describe('sensor sin permiso obligatorio',()=>{
test.use({isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Mobile Safari/537.36'});
test.beforeEach(async({page})=>{await page.addInitScript(()=>{window.DeviceOrientationEvent=class extends Event{};});});
test('lecturas reales habilitan opción, apagada hasta tocar y con pausa',async({page})=>{
  await page.goto('./');const hero=page.locator('.shadow-interactive'),button=page.getByRole('button',{name:'Activar inclinación'});await expect(hero).toHaveAttribute('data-effects','full');await expect(button).toHaveCount(0);await orientation(page,0,0);await expect(button).toBeVisible();await expect(button).toHaveAttribute('aria-pressed','false');await expect(page.getByText(/Desactivada por defecto: al inclinar/)).toBeVisible();
  await orientation(page,15,20);expect(await hero.evaluate(el=>Number(el.style.getPropertyValue('--shadow-x')))).toBe(0);
  await button.click();await expect(page.getByRole('button',{name:'Desactivar inclinación'})).toBeVisible();await page.waitForTimeout(850);await orientation(page,0,0);await orientation(page,12,15);await expect.poll(()=>hero.evaluate(el=>Number(el.style.getPropertyValue('--shadow-x')))).toBeGreaterThan(.2);
  await page.getByRole('button',{name:'Desactivar inclinación'}).click();await expect(button).toHaveAttribute('aria-pressed','false');
  for(const width of [320,390,768]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('evento sin valores: sensor ausente, sin opción ni error',async({page})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');await expect(page.locator('.shadow-interactive')).toBeVisible();await orientation(page,null,null);await expect(page.getByRole('button',{name:'Activar inclinación'})).toHaveCount(0);expect(errors).toEqual([]);});
});
