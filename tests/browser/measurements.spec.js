import { test, expect } from '@playwright/test';

async function openMeasures(page,date='2026-10-15') {
  await page.goto('./'); await page.getByRole('button',{name:'Medidas',exact:true}).click();
  await page.getByLabel('Fecha de medidas',{exact:true}).fill(date);
}
async function fillMeasures(page,values={}) {
  const fields={ 'Bíceps en pose (cm)':'36','Antebrazo (cm)':'32','Cintura (cm)':'70.5','Pecho (cm)':'101','Muslo (cm)':'60','Pantorrilla (cm)':'35.5',...values };
  for (const [label,value] of Object.entries(fields)) await page.getByLabel(label,{exact:true}).fill(value);
  await page.getByRole('button',{name:'Guardar medidas',exact:true}).click();
  await expect(page.getByText('Medidas guardadas.',{exact:true})).toBeVisible();
}

test('iniciales, diferencias, relaciones, recordatorio y cintura funcionan sin conexión',async({page,context})=>{
  await openMeasures(page);
  for (const [label,value] of [['Bíceps en pose (cm)','35'],['Antebrazo (cm)','31.5'],['Cintura (cm)','70'],['Pecho (cm)','100'],['Muslo (cm)','59'],['Pantorrilla (cm)','35.2']]) await expect(page.getByLabel(label,{exact:true})).toHaveValue(value);
  await expect(page.locator('.wellness-page .notice')).toContainText('2026-10-29');
  await expect(page.locator('.ratio-card').first()).toContainText('1,43');
  await expect(page.locator('.ratio-card').last()).toContainText('0,99');
  await page.getByLabel('Fecha de medidas',{exact:true}).fill('2026-10-29');
  await expect(page.getByRole('alert')).toContainText('Toca registrar tus medidas');
  await fillMeasures(page);
  await expect(page.locator('.wellness-page .notice')).toContainText('2026-11-12');
  await page.getByLabel('Fecha de medidas',{exact:true}).fill('2026-11-12');
  await fillMeasures(page,{'Bíceps en pose (cm)':'36.5','Cintura (cm)':'71.2'});
  await expect(page.locator('.measure-table tbody tr').filter({hasText:'Bíceps en pose'}).locator('td')).toHaveText(['36,5','+0,5','+1,5']);
  await expect(page.getByRole('img',{name:'Evolución de Bíceps en pose',exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'Medida del gráfico',exact:true}).selectOption('waist');
  await expect(page.getByRole('img',{name:'Evolución de Cintura',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Volumen',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('La cintura subió más de 1 cm');
  await expect(page.getByRole('alert')).toContainText('+1,2 cm');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await context.setOffline(true); await page.reload();
  await page.getByRole('button',{name:'Medidas',exact:true}).click();
  await page.getByLabel('Fecha de medidas',{exact:true}).fill('2026-11-12');
  await expect(page.getByLabel('Bíceps en pose (cm)',{exact:true})).toHaveValue('36.5');
  await expect(page.locator('.measure-table tbody tr').filter({hasText:'Bíceps en pose'}).locator('td')).toHaveText(['36,5','+0,5','+1,5']);
  await page.getByLabel('Fecha de medidas',{exact:true}).fill('2026-10-15');
  await expect(page.getByLabel('Cintura (cm)',{exact:true})).toHaveValue('70');
});

test('migración desde diario conserva peso y favoritos y solo añade iniciales una vez',async({page})=>{
  await page.goto('./'); await page.getByRole('button',{name:'Diario',exact:true}).click();
  await page.getByLabel('Fecha del diario',{exact:true}).fill('2026-10-15');
  await page.getByLabel('Peso corporal (kg)',{exact:true}).fill('72');
  await page.getByRole('button',{name:'Guardar diario',exact:true}).click();
  await expect(page.getByText('Diario guardado.',{exact:true})).toBeVisible();
  await page.evaluate(async()=>{
    const db=await new Promise(resolve=>{const request=indexedDB.open('heavy-duty-personal');request.onsuccess=()=>resolve(request.result);});
    await new Promise((resolve,reject)=>{const transaction=db.transaction('app','readwrite'),store=transaction.objectStore('app'),request=store.get('state'); request.onsuccess=()=>{const state=request.result;state.schemaVersion=3;delete state.measurements;state.storageFormat=1; store.put(state,'state');};transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error);}); db.close();
  });
  await page.reload(); await page.getByRole('button',{name:'Diario',exact:true}).click();
  await page.getByLabel('Fecha del diario',{exact:true}).fill('2026-10-15');
  await expect(page.getByLabel('Peso corporal (kg)',{exact:true})).toHaveValue('72');
  await page.getByRole('button',{name:'Medidas',exact:true}).click();
  await expect(page.getByLabel('Bíceps en pose (cm)',{exact:true})).toHaveValue('35');
  await page.getByRole('button',{name:'Guardar medidas',exact:true}).click();
  await expect(page.getByText('Medidas guardadas.',{exact:true})).toBeVisible();
  await page.reload(); await page.getByRole('button',{name:'Medidas',exact:true}).click();
  await page.getByLabel('Fecha de medidas',{exact:true}).fill('2026-10-15');
  await expect(page.locator('.wellness-card').last().locator('tbody tr')).toHaveCount(1);
});

test('Medidas y Diario caben en móvil y el recordatorio admite medidas parciales',async({page})=>{
  await openMeasures(page,'2026-10-29');
  await page.getByLabel('Bíceps en pose (cm)',{exact:true}).fill('36');
  await page.getByRole('button',{name:'Guardar medidas',exact:true}).click();
  await expect(page.getByText('Medidas guardadas.',{exact:true})).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Toca registrar tus medidas');
  for (const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    for (const tab of ['Medidas','Diario','Volumen']) { await page.getByRole('button',{name:tab,exact:true}).click(); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true); }
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Medidas',exact:true}).click();
  await page.screenshot({path:'test-results/measurements-mobile.png',fullPage:true});
});

test('el recordatorio aparece al abrir Hoy cuando vence el control',async({page})=>{
  await page.clock.install({time:new Date('2026-10-29T12:00:00Z')});
  await page.goto('./');
  await expect(page.getByLabel('Recordatorio de medidas',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ir a Medidas',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Tus medidas.',exact:true})).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('2026-10-29');
});
