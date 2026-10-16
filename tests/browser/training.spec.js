import {test,expect} from './fixtures.js';

async function boot(page,date='2026-11-02'){
 await page.clock.install({time:new Date(`${date}T18:00:00Z`)});await page.goto('./');await page.getByLabel('Fecha de entrenamiento',{exact:true}).fill('2026-11-02');await expect(page.getByLabel('Peso de trabajo de Press banca',{exact:true})).toBeVisible();
}
async function seed(page,scenario){await page.evaluate(async scenario=>{
 const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal');req.onsuccess=()=>resolve(req.result);});
 await new Promise(resolve=>{const tx=db.transaction('app','readwrite'),store=tx.objectStore('app'),req=store.get('state');req.onsuccess=()=>{const state=req.result,ex=state.routine[0][0];state.trainingStarted='2026-10-01';for(const p of Object.values(state.profiles))p.workWeight=100;
 const make=(exercise,date,reps=10,extra={})=>({id:crypto.randomUUID(),date,kind:'effective',exerciseId:exercise.id,profileId:exercise.profileId,equipment:exercise.equipment,muscle:exercise.muscle,exerciseName:exercise.name,weight:100,reps,rpe:10,failure:true,createdAt:`${date}T18:00:00Z`,...extra});
 if(scenario==='drop')ex.technique='drop';
 if(scenario==='stalled')state.logs=['2026-10-01','2026-10-08','2026-10-15','2026-10-22'].map(date=>make(ex,date));
 if(scenario==='recovery')state.logs=[make(ex,'2026-11-01',10,{performedAt:'2026-11-01T18:00:00Z'})];
 if(scenario==='advanced'){for(const [index,kind]of [[0,'forced'],[1,'negative'],[2,'forced']]){const item=state.routine[0][index];item[kind]=true;if(index<2){const parent=make(item,'2026-11-02');state.logs.push(parent,make(item,'2026-11-02',3,{kind,parentId:parent.id}));}}}
 state.storageFormat=1; store.put(state,'state');};tx.oncomplete=resolve;});db.close();},scenario);await page.reload();}
async function state(page){return page.evaluate(async()=>{const db=await new Promise(resolve=>{const req=indexedDB.open('heavy-duty-personal');req.onsuccess=()=>resolve(req.result);});return new Promise(resolve=>{const tx=db.transaction('app','readonly'),req=tx.objectStore('app').get('state');tx.oncomplete=()=>{db.close();resolve(req.result);};});});}

test('confirmar progresión cambia la referencia, preparaciones y futuras extensiones offline',async({page,context})=>{
 await boot(page);await seed(page,'drop');await page.getByLabel('Repeticiones de Press banca',{exact:true}).fill('12');await page.getByRole('button',{name:/^Guardar serie/}).click();
 await expect(page.getByRole('button',{name:'Aplicar referencia de 102.5 kg',exact:true})).toBeVisible();await expect(page.getByLabel('Peso de trabajo de Press banca',{exact:true})).toHaveValue('100');
 await page.getByRole('button',{name:'Aplicar referencia de 102.5 kg',exact:true}).click();await expect(page.getByLabel('Peso de trabajo de Press banca',{exact:true})).toHaveValue('102.5');await expect(page.getByLabel('Peso de Aproximación 1',{exact:true})).toHaveValue('52.5');
 await page.getByLabel('Fecha de entrenamiento',{exact:true}).fill('2026-11-09');await expect(page.getByLabel('Peso de Caída 1',{exact:true})).toHaveValue('82.5');await page.getByRole('combobox',{name:'Tipo de serie',exact:true}).selectOption('rp');await expect(page.getByLabel('Carga de Press banca',{exact:true})).toHaveValue('102.5');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.reload();await expect(page.getByLabel('Peso de trabajo de Press banca',{exact:true})).toHaveValue('102.5');expect((await state(page)).progressionEvents).toHaveLength(1);
});
test('descarga reduce series, oculta extensiones, conserva preparaciones y persiste sin red',async({page,context})=>{
 await boot(page);await seed(page,'drop');await page.getByRole('button',{name:'Confirmar descarga de 7 días',exact:true}).click();await expect(page.getByText(/Descarga activa: 2026-11-02/)).toBeVisible();await expect(page.locator('.exercise-card').first().locator('.exercise-count')).toHaveText('0/1');
 await expect(page.getByLabel('Peso de Aproximación 1',{exact:true})).toHaveValue('50');await expect(page.getByLabel('Peso de Caída 1',{exact:true})).toHaveCount(0);await expect(page.getByRole('combobox',{name:'Tipo de serie',exact:true}).locator('option[value="rp"]')).toHaveCount(0);await expect(page.getByLabel('RPE de Press banca',{exact:true})).toHaveValue('6');
 await page.getByRole('button',{name:/^Guardar serie/}).click();await expect(page.locator('.log-row')).toContainText('Sin fallo');await page.getByRole('button',{name:/^Guardar serie/}).click();await expect(page.getByRole('alert')).toContainText('50% de series');
 let data=await state(page);expect(data.logs).toHaveLength(1);expect(data.logs[0].deload).toBe(true);expect(data.profiles[data.routine[0][0].profileId].workWeight).toBe(100);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.reload();await expect(page.getByText(/Descarga activa: 2026-11-02/)).toBeVisible();
 await page.getByLabel('Fecha de entrenamiento',{exact:true}).fill('2026-11-09');await expect(page.getByLabel('Peso de Caída 1',{exact:true})).toHaveValue('80');await expect(page.locator('.exercise-card').first().locator('.exercise-count')).toHaveText('0/2');
});
test('tres semanas ofrecen solo una técnica y recuperación avisa antes de 48h en móvil',async({page})=>{
 await boot(page,'2026-10-22');await page.getByLabel('Fecha de entrenamiento',{exact:true}).fill('2026-10-19');await seed(page,'stalled');await page.getByLabel('Fecha de entrenamiento',{exact:true}).fill('2026-10-26');
 await expect(page.getByRole('button',{name:'Probar rest-pause hoy',exact:true})).toBeVisible();await page.getByRole('button',{name:'Probar rest-pause hoy',exact:true}).click();await expect(page.getByLabel('Peso de Mini-serie 1',{exact:true})).toHaveValue('100');expect((await state(page)).techniqueTrials).toHaveLength(1);
 await page.getByLabel('Fecha de entrenamiento',{exact:true}).fill('2026-10-27');await page.getByLabel('Fecha de entrenamiento',{exact:true}).fill('2026-10-26');await expect(page.getByLabel('Peso de Mini-serie 1',{exact:true})).toHaveValue('100');
 await seed(page,'recovery');await page.getByLabel('Fecha de entrenamiento',{exact:true}).fill('2026-11-02');await expect(page.locator('.recovery-warning').filter({hasText:'Menos de 48 h'})).toBeVisible();
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.locator('.training-recovery').screenshot({path:'test-results/training-mobile.png'});
});
test('límite de dos ejercicios con forzadas o negativas se aplica al guardar',async({page})=>{
 await boot(page);await seed(page,'advanced');await page.locator('.session-list .exercise-summary').filter({hasText:'Press inclinado mancuernas'}).click();await page.getByRole('combobox',{name:'Tipo de serie',exact:true}).selectOption('effective');await page.getByRole('button',{name:/^Guardar serie/}).click();await expect(page.locator('.exercise-card.expanded .log-row')).toHaveCount(1);
 await page.getByRole('combobox',{name:'Tipo de serie',exact:true}).selectOption('forced');await page.getByRole('button',{name:/^Guardar serie/}).click();await expect(page.getByRole('alert')).toContainText('máximo 2 ejercicios');expect((await state(page)).logs.filter(log=>['forced','negative'].includes(log.kind))).toHaveLength(2);
});
