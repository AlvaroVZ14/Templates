import {test,expect,chooseDate,go} from './fixtures.js';

test.beforeEach(async({page})=>{
  await page.clock.install({time:new Date('2026-10-12T15:00:00Z')});
  await page.goto('./');
  await chooseDate(page,'2026-10-12');
});
const card=page=>page.locator('.session-list .exercise-card.expanded');
async function exercise(page,name){await page.locator('.session-list .exercise-summary').filter({hasText:name}).click();}
async function reference(page,name,kg){
  const panel=card(page).locator('.quick-reference');
  if(!await panel.evaluate(el=>el.open))await panel.locator('summary').click();
  await page.getByLabel(`Peso de trabajo de ${name}`,{exact:true}).fill(kg);
  await panel.getByRole('button',{name:'Guardar peso de trabajo',exact:true}).click();
}
const tab=(page,name)=>card(page).getByRole('tab',{name:new RegExp(`^${name}`)});
async function records(page){const details=card(page).locator('.quick-records');if(!await details.evaluate(el=>el.open))await details.locator('summary').click();return details;}
async function state(page){return page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('heavy-duty-personal');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  try{return await new Promise(resolve=>{const req=db.transaction('app').objectStore('app').get('state');req.onsuccess=()=>resolve(req.result);});}finally{db.close();}
});}

test('referencia vacía visible; efectiva compacta y previas editables sin duplicación ni volumen',async({page})=>{
  await expect(card(page).getByRole('heading',{name:'Ingresa tu peso de trabajo',exact:true})).toBeVisible();
  await reference(page,'Press banca','100');
  await expect(card(page).locator('.quick-reference')).not.toHaveAttribute('open');
  await expect(tab(page,'Previas')).toContainText('50 / 75 kg');
  await expect(card(page).locator('.preparation-chip')).toHaveCount(0);
  await expect(card(page).locator('.training-recommendation')).not.toBeVisible();
  await expect(card(page).getByLabel('Carga de Press banca',{exact:true})).toBeVisible();
  await tab(page,'Previas').click();
  await expect(page.getByLabel('Peso de Aproximación 1',{exact:true})).toHaveValue('50');
  await page.getByLabel('Reps de Aproximación 1',{exact:true}).fill('11');
  await page.getByRole('button',{name:'Guardar Aproximación 1',exact:true}).click();
  await expect(page.getByRole('button',{name:'Guardar Aproximación 1',exact:true})).toBeDisabled();
  await expect(page.getByLabel('Temporizador de descanso')).toBeVisible();
  const data=await state(page);expect(data.logs).toHaveLength(1);expect(data.logs[0]).toMatchObject({kind:'approach',weight:50,reps:11,rpe:6,failure:false});
  await tab(page,'Efectiva').click();
  await expect(card(page).getByLabel('Serie anterior')).toContainText('50 kg × 11');
  await go(page,'Volumen');await expect(page.locator('.volume-row').filter({hasText:'Pecho'}).locator('b')).toHaveText('0');
});

test('drop visible antes de la efectiva, luego registra carga real, descanso y caída por separado',async({page})=>{
  await exercise(page,'Press declinado');await reference(page,'Press declinado','100');
  await expect(tab(page,'Drop set')).toContainText('80 kg');await tab(page,'Drop set').click();
  await expect(page.getByRole('button',{name:'Guardar Caída 1',exact:true})).toBeDisabled();
  await expect(page.getByLabel('Peso de Caída 1',{exact:true})).toHaveValue('80');
  await tab(page,'Efectiva').click();
  await page.getByLabel('Carga de Press declinado',{exact:true}).fill('90');
  await card(page).locator('.quick-set-footer .quick-rest summary').click();
  await page.getByLabel('Descanso real de Press declinado',{exact:true}).fill('210');
  await card(page).getByRole('button',{name:/^Guardar serie/}).click();
  await expect(tab(page,'Drop set')).toContainText('72.5 kg');
  await card(page).getByRole('button',{name:'Registrar Drop set →',exact:true}).click();
  await page.getByLabel('Reps de Caída 1',{exact:true}).fill('6');
  await card(page).getByRole('form',{name:'Caída 1',exact:true}).locator('.quick-rest summary').click();
  await page.getByLabel('Descanso real de Caída 1',{exact:true}).fill('12');
  await page.getByRole('button',{name:'Guardar Caída 1',exact:true}).click();
  const data=await state(page);expect(data.logs).toHaveLength(2);
  expect(data.logs[0]).toMatchObject({kind:'effective',weight:90,restRealSeconds:210});
  expect(data.logs[1]).toMatchObject({kind:'drop',weight:72.5,reps:6,restRealSeconds:12,parentId:data.logs[0].id});
  await records(page);await expect(card(page).locator('.log-row')).toHaveCount(2);
  await card(page).getByRole('button',{name:'Eliminar Efectiva de Press declinado',exact:true}).click();
  await card(page).getByRole('button',{name:'Cancelar',exact:true}).click();expect((await state(page)).logs).toHaveLength(2);
});

test('rest-pause por mano conserva dos mini-series y valores editados al cambiar pestañas',async({page})=>{
  await exercise(page,'Curl mancuernas sentado');await reference(page,'Curl mancuernas sentado','20');
  await expect(tab(page,'Rest-pause')).toContainText('20 / 20 kg');
  await expect(card(page).getByText('Mancuernas: todos los kg son por mano.',{exact:true})).toBeVisible();
  await tab(page,'Rest-pause').click();await page.getByLabel('Reps de Mini-serie 1',{exact:true}).fill('5');
  await tab(page,'Previas').click();await tab(page,'Rest-pause').click();await expect(page.getByLabel('Reps de Mini-serie 1',{exact:true})).toHaveValue('5');
  await tab(page,'Efectiva').click();await card(page).getByRole('button',{name:/^Guardar serie/}).click();
  await tab(page,'Rest-pause').click();await expect(page.getByLabel('Reps de Mini-serie 1',{exact:true})).toHaveValue('5');
  for(const n of [1,2])await page.getByRole('button',{name:`Guardar Mini-serie ${n}`,exact:true}).click();
  const data=await state(page);expect(data.logs.map(log=>log.kind)).toEqual(['effective','rp','rp']);
  expect(data.logs.map(log=>log.weight)).toEqual([20,20,20]);expect(data.logs[1].reps).toBe(5);
});

test('Otras conserva calentamiento y aproximación manual; técnicas avanzadas siguen optativas',async({page})=>{
  await reference(page,'Press banca','100');
  await page.getByLabel('Carga de Press banca',{exact:true}).fill('97.5');
  await tab(page,'Otras').click();
  await expect(page.getByLabel('Carga de Press banca',{exact:true})).toHaveValue('97.5');
  const select=card(page).getByRole('combobox',{name:'Tipo de serie',exact:true});
  expect(await select.locator('option').evaluateAll(items=>items.map(item=>item.value))).toEqual(['warmup','approach','effective','drop','rp']);
  await select.selectOption('warmup');
  await expect(page.getByLabel('Carga de Press banca',{exact:true})).toHaveValue('50');
  await expect(card(page).getByRole('checkbox',{name:'Llegué al fallo',exact:true})).toBeDisabled();
  await card(page).getByRole('button',{name:/^Guardar serie/}).click();
  await select.selectOption('approach');await card(page).getByRole('button',{name:/^Guardar serie/}).click();
  expect((await state(page)).logs.map(log=>log.kind)).toEqual(['warmup','approach']);
  await tab(page,'Efectiva').click();await expect(card(page).locator('.set-form')).toHaveAttribute('data-kind','effective');
});

test('borradores de efectiva, previas y notas sobreviven recarga offline; reglas e historial accesibles',async({page,context})=>{
  await reference(page,'Press banca','100');await page.getByLabel('Carga de Press banca',{exact:true}).fill('97.5');
  await tab(page,'Previas').click();await page.getByLabel('Reps de Aproximación 2',{exact:true}).fill('7');
  await card(page).locator('.quick-history > summary').click();await page.getByLabel('Notas de Press banca',{exact:true}).fill('Dato ficticio: banco 2');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.reload();
  await expect(tab(page,'Previas')).toHaveAttribute('aria-selected','true');
  await expect(page.getByLabel('Reps de Aproximación 2',{exact:true})).toHaveValue('7');
  await tab(page,'Efectiva').click();await expect(page.getByLabel('Carga de Press banca',{exact:true})).toHaveValue('97.5');
  await card(page).locator('.quick-history > summary').click();await expect(page.getByLabel('Notas de Press banca',{exact:true})).toHaveValue('Dato ficticio: banco 2');
  await card(page).getByRole('button',{name:'Guardar notas',exact:true}).click();
  await card(page).locator('.history-panel summary').click();await expect(card(page).getByText('Todavía no hay series registradas.',{exact:true})).toBeVisible();
  await card(page).getByText('Progresión, reglas y descansos',{exact:true}).click();await expect(card(page).getByRole('heading',{name:'Progresión · regla y motivo',exact:true})).toBeVisible();
  expect((await state(page)).profiles[(await state(page)).routine[0][0].profileId].notes).toBe('Dato ficticio: banco 2');
});

test('teclado y anchos 320–1440: un panel visible, controles táctiles y sin desbordamiento',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await exercise(page,'Press declinado');await reference(page,'Press declinado','100');
  await tab(page,'Efectiva').focus();await page.keyboard.press('ArrowLeft');await expect(tab(page,'Previas')).toBeFocused();
  await page.keyboard.press('End');await expect(tab(page,'Otras')).toHaveAttribute('aria-selected','true');
  await tab(page,'Efectiva').click();
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:844});
    for(const name of ['Previas','Efectiva','Drop set','Otras']){
      await tab(page,name).click();
      await expect(card(page).getByRole('tabpanel')).toHaveCount(1);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      for(const item of await card(page).locator('.quick-tabs button').all())expect((await item.boundingBox()).height).toBeGreaterThanOrEqual(44);
      if(width===320&&name==='Previas')await card(page).screenshot({path:'test-results/quick-preparations-320.png'});
      if(width===1440&&name==='Efectiva')await card(page).screenshot({path:'test-results/quick-effective-desktop.png'});
    }
  }
  await page.setViewportSize({width:390,height:844});await tab(page,'Efectiva').click();await card(page).scrollIntoViewIfNeeded();
  await card(page).screenshot({path:'test-results/quick-effective-mobile.png'});
  await tab(page,'Previas').click();await card(page).screenshot({path:'test-results/quick-preparations-mobile.png'});
  await tab(page,'Drop set').click();await card(page).screenshot({path:'test-results/quick-drop-mobile.png'});
  expect(errors).toEqual([]);
});
