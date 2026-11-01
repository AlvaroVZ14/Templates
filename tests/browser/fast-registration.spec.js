import {test,expect} from '@playwright/test';
import {initialState} from '../../src/domain.js';
import {saveExerciseFeedback} from '../../src/doubleProgression.js';
import {go,openExercise} from './navigation-helpers.js';

const date='2026-11-03',now='2026-11-03T18:00:00Z';
const card=(page,name)=>page.getByRole('article',{name,exact:true});
async function stateOf(page){return page.evaluate(async()=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal');req.onsuccess=()=>resolve(req.result);});try{return await new Promise(resolve=>{const req=db.transaction('app').objectStore('app').get('state');req.onsuccess=()=>resolve(req.result);});}finally{db.close();}});}
async function seed(page,{history=true,qualified=false}={}){
 await page.clock.install({time:new Date(now)});page.on('dialog',dialog=>dialog.accept());
 let state=initialState();state.weightSetup={reviewedAt:now};state.navigationSettings={drawerSide:'right',lastSession:date};state.appearanceSettings={...state.appearanceSettings,effects:'off'};
 for(const ex of state.routine.flat())state.profiles[ex.profileId].workWeight=40;
 if(history)for(const ex of state.routine[1])for(let index=0;index<ex.sets;index++)state.logs.push({id:`last-${ex.id}-${index}`,exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,exerciseName:ex.name,muscle:ex.muscle,date:'2026-10-27',kind:'effective',weight:ex.setPlan[index].role==='backoff'?36:40,reps:8+index,setRole:ex.setPlan[index].role,createdAt:`2026-10-27T18:${String(state.logs.length).padStart(2,'0')}:00Z`,rpe:9,failure:false});
 if(qualified){const ex=state.routine[1][0];state.logs=state.logs.map(row=>row.exerciseId===ex.id?{...row,reps:10,weight:row.setRole==='backoff'?72.5:80}:row);state=saveExerciseFeedback(state,ex,'2026-10-27','strong',true);}
 await page.route('**/Templates/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Fictitious fixture</title>'}));await page.goto('./');
 await page.evaluate(async state=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal',1);req.onupgradeneeded=()=>req.result.createObjectStore('app');req.onsuccess=()=>resolve(req.result);});await new Promise(resolve=>{const tx=db.transaction('app','readwrite');tx.objectStore('app').put(state,'state');tx.oncomplete=resolve;});db.close();},state);
 await page.unroute('**/Templates/');await page.reload();await page.getByRole('button',{name:'EMPEZAR ENTRENAMIENTO',exact:true}).click();await expect(page.locator('.fast-exercise')).toHaveCount(7);
}
test('progresión visible, sensación al terminar, decisión persistida y consultable sin popups',async({page})=>{
 await seed(page,{qualified:true});const name='Press inclinado mancuernas',c=card(page,name);
 await expect(c.locator('.fast-progression').first()).toContainText('82,5 kg × 6–10');
 await expect(c.getByRole('group',{name:`Sensación de ${name}`})).toHaveCount(0);
 for(let index=1;index<=4;index++){await c.getByRole('button',{name:`Confirmar ${name}, serie ${index}`,exact:true}).click();await expect(c.locator('.confirmed')).toHaveCount(index);}
 await c.getByRole('checkbox',{name:'Todas las efectivas con técnica limpia y 0–2 RIR',exact:true}).check();
 await c.getByRole('button',{name:'😫 flojo',exact:true}).click();await expect(c.getByRole('button',{name:'😫 flojo',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(c.locator('.fast-feedback')).toContainText('Sensación flojo: mantener');
 let state=await stateOf(page);expect(state.exerciseFeedback.at(-1).cleanRir).toBe(true);expect(state.progressionDecisions.at(-1).action).toBe('maintain');expect(state.logs.filter(row=>row.date===date&&row.kind==='effective')[0].weight).toBe(82.5);
 await page.reload();await expect(card(page,name).getByRole('button',{name:'😫 flojo',exact:true})).toHaveAttribute('aria-pressed','true');
 await go(page,'Historial');const decisions=page.locator('.history-page details').filter({has:page.locator('summary').filter({hasText:'Decisiones de progresión'})}).first();await decisions.locator('summary').click();await expect(decisions).toContainText('Sugerencia usada');await expect(decisions).toContainText('Registrado: 82,5 kg × 6');await expect(decisions).toContainText('Sensación flojo: mantener');
});

test('17 filas de44px, sin formularios ni previas, con tarjetas compactas en móvil y escritorio',async({page})=>{
 await seed(page);await expect(page.locator('.fast-set-line')).toHaveCount(17);await expect(page.locator('main input:visible')).toHaveCount(0);await expect(page.getByRole('tab',{name:/Previas/})).toHaveCount(0);
 await expect(card(page,'Press inclinado mancuernas').getByText('Calentamiento: 1–2 progresivas + 1 de ajuste (no se registra)',{exact:true})).toBeVisible();
 await expect(card(page,'Curl polea')).toHaveCount(0);
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:844});expect(await page.locator('.fast-set-line').first().evaluate(el=>el.getBoundingClientRect().height)).toBe(44);expect(await page.locator('.fast-session-heading h1').evaluate(el=>el.getBoundingClientRect().height)).toBeLessThan(45);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});expect(await page.locator('.session-list').evaluate(el=>el.getBoundingClientRect().height)).toBeLessThan(1600);await page.screenshot({path:'test-results/fast-mobile.png',fullPage:true});
});
test('✓ confirma valores anteriores por serie, sin duplicados; recarga offline y descanso automático',async({page,context})=>{
 await seed(page);const ex='Press inclinado mancuernas',c=card(page,ex);await expect(c.locator('.fast-target')).toContainText('40×8');
 await c.getByRole('button',{name:`Confirmar ${ex}, serie 1`,exact:true}).dblclick();await expect(c.locator('.confirmed')).toHaveCount(1);
 await page.clock.fastForward(178000);await c.getByRole('button',{name:`Confirmar ${ex}, serie 2`,exact:true}).click();await expect(c.locator('.confirmed')).toHaveCount(2);
 let state=await stateOf(page),rows=state.logs.filter(log=>log.date===date);expect(rows).toHaveLength(2);expect(rows[0].weight).toBe(40);expect(rows[1].weight).toBe(36);expect(rows[1].reps).toBe(10);expect(rows[0].restRealSeconds).toBeGreaterThanOrEqual(178);expect(rows[0].restRealSeconds).toBeLessThan(185);expect(rows[0].rpe).toBeNull();
 await expect(page.getByLabel('Temporizador de descanso',{exact:true})).toBeVisible();expect(await page.getByLabel('Temporizador de descanso',{exact:true}).evaluate(el=>el.getBoundingClientRect().height)).toBeLessThan(65);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.reload();await expect(card(page,ex).locator('.confirmed')).toHaveCount(2);
});
test('stepper sin teclado, edición explícita y borrador recuperado',async({page})=>{
 await seed(page);const ex='Press inclinado mancuernas',label=`Peso de ${ex}, serie 1`,c=card(page,ex);
 await c.getByRole('button',{name:`${label}: 40`,exact:true}).click();await expect(c.locator('input:visible')).toHaveCount(0);await c.getByRole('button',{name:`Sumar 2.5 a ${label}`,exact:true}).click();await c.getByRole('button',{name:'Listo',exact:true}).click();await expect(c.getByRole('button',{name:`${label}: 42,5`,exact:true})).toBeVisible();
 await page.reload();await expect(card(page,ex).getByRole('button',{name:`${label}: 42,5`,exact:true})).toBeVisible();await card(page,ex).getByRole('button',{name:`${label}: 42,5`,exact:true}).click();await card(page,ex).getByRole('button',{name:'Teclado',exact:true}).click();await card(page,ex).getByLabel(`Escribir ${label}`,{exact:true}).fill('55');await card(page,ex).getByRole('button',{name:'Listo',exact:true}).click();await card(page,ex).getByRole('button',{name:`Confirmar ${ex}, serie 1`,exact:true}).click();expect((await stateOf(page)).logs.filter(log=>log.date===date)[0].weight).toBe(55);
});
test('Drop y RP están en la última fila, se guardan juntos y no añaden efectivas',async({page})=>{
 await seed(page);const name='Aperturas en polea';await openExercise(page,name);const c=card(page,name);
 for(let index=1;index<3;index++){await c.getByRole('button',{name:`Confirmar ${name}, serie ${index}`,exact:true}).click();await expect(c.locator('.confirmed')).toHaveCount(index);}
 await c.getByRole('button',{name:`Drop en ${name}, serie 3`,exact:true}).click();await expect(c.locator('.fast-set-line')).toHaveCount(3);await expect(c.getByRole('button',{name:`Peso caída 1 de ${name}, serie 3: 30`,exact:true})).toBeVisible();
 const reps=`Reps caída 1 de ${name}, serie 3`;await c.getByRole('button',{name:`${reps}: —`,exact:true}).click();await c.getByRole('button',{name:`Sumar 1 a ${reps}`,exact:true}).click();await c.getByRole('button',{name:'Listo',exact:true}).click();await c.getByRole('button',{name:`Confirmar ${name}, serie 3`,exact:true}).click();await expect(c.locator('.confirmed')).toHaveCount(3);
 const lateral='Elevaciones laterales mancuerna';await openExercise(page,lateral);const l=card(page,lateral);await l.getByRole('button',{name:`Confirmar ${lateral}, serie 1`,exact:true}).click();await expect(l.locator('.confirmed')).toHaveCount(1);await l.getByRole('button',{name:`RP en ${lateral}, serie 2`,exact:true}).click();await l.getByRole('button',{name:`Confirmar ${lateral}, serie 2`,exact:true}).click();await expect(l.locator('.confirmed')).toHaveCount(2);
 const state=await stateOf(page),rows=state.logs.filter(log=>log.date===date);expect(rows.filter(log=>log.kind==='effective')).toHaveLength(5);expect(rows.filter(log=>log.kind==='drop')).toHaveLength(1);expect(rows.filter(log=>log.kind==='rp')).toHaveLength(2);expect(rows.filter(log=>log.kind==='drop')[0].weight).toBe(30);expect(state.timer.duration).toBe(105);
 await go(page,'Progreso');await page.locator('.weekly-volume-details summary').click();await expect(page.locator('.volume-row').filter({hasText:'Pecho'}).locator('b')).toHaveText('3');
});
test('17 toques confirman la sesión; un solo botón termina y conserva histórico',async({page})=>{
 await seed(page);await expect(page.getByRole('button',{name:'Terminar sesión',exact:true})).toHaveCount(0);
 for(const c of await page.locator('.fast-exercise').all()){await openExercise(page,await c.getAttribute('aria-label'));while(await c.getByRole('button',{name:/^Confirmar /}).count()){const button=c.getByRole('button',{name:/^Confirmar /}).first(),label=await button.getAttribute('aria-label');await button.click();await expect(c.getByRole('button',{name:label,exact:true})).toHaveCount(0);}
 }
 await expect(page.locator('.fast-set.confirmed')).toHaveCount(17);await expect(page.getByRole('button',{name:'Terminar sesión',exact:true})).toHaveCount(1);await page.getByRole('button',{name:'Terminar sesión',exact:true}).click();await expect(page.getByText('✓ Sesión terminada · todo guardado.',{exact:true})).toBeVisible();
 const state=await stateOf(page);expect(state.logs.filter(log=>log.date===date&&log.kind==='effective')).toHaveLength(17);expect(state.logs.filter(log=>log.date==='2026-10-27')).toHaveLength(17);expect(state.sessionMeta[date].endedAt).toBeTruthy();expect(state.gymSession).toBeNull();
});
test('fallo transaccional no confirma en falso, conserva valores y permite reintentar',async({page})=>{
 await seed(page);await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('blood-guts-series-queue-v1')??'null')?.pending.length??0)).toBe(0);
 const worker=page.workers().find(item=>item.url().includes('series-persistence.worker'));
 await worker.evaluate(()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='sessions'){IDBObjectStore.prototype.put=original;throw new DOMException('Fictitious quota','QuotaExceededError');}return original.apply(this,args);};});
 const ex='Press inclinado mancuernas',c=card(page,ex);await c.getByRole('button',{name:`Confirmar ${ex}, serie 1`,exact:true}).click();await expect(c.locator('.fast-error')).toContainText('No se pudo guardar');await expect(c.locator('.confirmed')).toHaveCount(0);expect((await stateOf(page)).logs.filter(log=>log.date===date)).toHaveLength(0);await c.getByRole('button',{name:`Confirmar ${ex}, serie 1`,exact:true}).click();await expect(c.locator('.confirmed')).toHaveCount(1);
});
test('Empezar activa gimnasio y Wake Lock, salir lo libera y volver recupera sin formularios',async({page})=>{
 await page.addInitScript(()=>{window.wakeRequests=0;window.wakeReleases=0;Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{request:async()=>{window.wakeRequests++;return {released:false,addEventListener(){},removeEventListener(){},async release(){this.released=true;window.wakeReleases++;}};}}});});
 await seed(page);expect(await page.evaluate(()=>window.wakeRequests)).toBe(1);await card(page,'Press inclinado mancuernas').getByRole('button',{name:'Confirmar Press inclinado mancuernas, serie 1',exact:true}).click();await expect(page.locator('.app-shell')).toHaveClass(/gym-active/);await expect.poll(()=>page.evaluate(()=>window.wakeRequests)).toBe(1);await go(page,'Ajustes');await expect.poll(()=>page.evaluate(()=>window.wakeReleases)).toBe(1);await go(page,'Hoy');await page.getByRole('button',{name:'EMPEZAR ENTRENAMIENTO',exact:true}).click();await expect(card(page,'Press inclinado mancuernas').locator('.confirmed')).toHaveCount(1);await expect.poll(()=>page.evaluate(()=>window.wakeRequests)).toBe(2);
});

test('confirmación optimista offline, haptics y recarga antes del commit sin duplicados',async({page,context})=>{
 await page.addInitScript(()=>{window.vibrations=[];navigator.vibrate=value=>{window.vibrations.push(value);return true;};});
 await seed(page);await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('blood-guts-series-queue-v1')??'null')?.pending.length??0)).toBe(0);
 const worker=page.workers().find(item=>item.url().includes('series-persistence.worker'));
 await worker.evaluate(()=>{const original=self.onmessage;self.onmessage=event=>setTimeout(()=>original(event),5000);});
 await context.setOffline(true);const ex='Press inclinado mancuernas',c=card(page,ex);
 await c.getByRole('button',{name:`Confirmar ${ex}, serie 1`,exact:true}).click();await expect(c.locator('.confirmed')).toHaveCount(1);
 expect((await stateOf(page)).logs.filter(log=>log.date===date)).toHaveLength(0);
 await c.getByRole('button',{name:`Confirmar ${ex}, serie 2`,exact:true}).click();await expect(c.locator('.confirmed')).toHaveCount(2);
 expect(await page.evaluate(()=>window.vibrations.filter(value=>value===20).length)).toBe(2);
 await page.reload();await expect(card(page,ex).locator('.confirmed')).toHaveCount(2);
 await expect.poll(async()=>(await stateOf(page)).logs.filter(log=>log.date===date&&log.kind==='effective').length).toBe(2);
 await page.reload();await expect(card(page,ex).locator('.confirmed')).toHaveCount(2);expect((await stateOf(page)).logs.filter(log=>log.date===date&&log.kind==='effective')).toHaveLength(2);
});

test('solo se repintan la fila confirmada y la siguiente habilitada, sin toda la lista',async({page})=>{
 await page.addInitScript(()=>{window.rowRenders=[];window.panelRenders=[];window.__BG_PERF__={rowRender:value=>window.rowRenders.push(value),panelRender:value=>window.panelRenders.push(value)};});
 await seed(page);await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('blood-guts-series-queue-v1')??'null')?.pending.length??0)).toBe(0);
 await page.evaluate(()=>{window.rowRenders=[];window.panelRenders=[];});
 const ex='Press inclinado mancuernas';await card(page,ex).getByRole('button',{name:`Confirmar ${ex}, serie 1`,exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('blood-guts-series-queue-v1')??'null')?.pending.length??0)).toBe(0);
 const rows=await page.evaluate(()=>[...new Set(window.rowRenders)]);expect(rows.sort()).toEqual([`${ex}, serie 1`,`${ex}, serie 2`]);
 expect(await page.evaluate(()=>new Set(window.panelRenders).size)).toBe(1);
});

test('sin Worker también confirma y persiste localmente sin bloquear el registro',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'Worker',{configurable:true,value:undefined}));
 await seed(page);const ex='Press inclinado mancuernas';await card(page,ex).getByRole('button',{name:`Confirmar ${ex}, serie 1`,exact:true}).click();
 await expect(card(page,ex).locator('.confirmed')).toHaveCount(1);
 await expect.poll(async()=>(await stateOf(page)).logs.filter(log=>log.date===date&&log.kind==='effective').length).toBe(1);
 await page.reload();await expect(card(page,ex).locator('.confirmed')).toHaveCount(1);
 await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
 expect(await page.locator('.nav-drawer').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
