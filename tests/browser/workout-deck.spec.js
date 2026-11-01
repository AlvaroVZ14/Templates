import {test,expect} from '@playwright/test';
import {initialState} from '../../src/domain.js';
async function boot(page){
 await page.clock.install({time:new Date('2026-11-08T18:00:00Z')});
 const data=initialState();data.appearanceSettings={...data.appearanceSettings,effects:'off'};data.weightSetup={reviewedAt:'2026-11-08'};
 for(const profile of Object.values(data.profiles))profile.workWeight=80;
 for(const ex of data.routine[6])for(let i=0;i<ex.sets;i++)data.logs.push({id:`fixture-${ex.id}-${i}`,date:'2026-11-01',exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,exerciseName:ex.name,muscle:ex.muscle,kind:'effective',weight:80,reps:8,setRole:ex.setPlan[i].role,rpe:9,failure:false,createdAt:`2026-11-01T18:0${i}:00Z`});
 await page.route('**/Templates/',r=>r.fulfill({contentType:'text/html',body:'<!doctype html>'}));await page.goto('./');
 await page.evaluate(async data=>{const db=await new Promise(resolve=>{const r=indexedDB.open('heavy-duty-personal',1);r.onupgradeneeded=()=>r.result.createObjectStore('app');r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const tx=db.transaction('app','readwrite');tx.objectStore('app').put(data,'state');tx.oncomplete=resolve;});db.close();},data);
 await page.unroute('**/Templates/');await page.reload();await page.getByRole('button',{name:'EMPEZAR ENTRENAMIENTO',exact:true}).click();
 await expect(page.locator('.workout-focus')).toBeVisible();return data;
}
test('carrusel móvil: flechas, pastillas y swipe conservan borrador, progreso y serie guardada',async({page,context})=>{
 await page.setViewportSize({width:390,height:844});const data=await boot(page),first=data.routine[6][0],second=data.routine[6][1];
 const progress=page.getByRole('progressbar',{name:'Series completadas'}),firstCard=page.getByRole('article',{name:first.name,exact:true});
 await expect(progress).toHaveAttribute('aria-valuemax','17');await expect(page.locator('.session-segments i')).toHaveCount(17);
 await firstCard.getByRole('button',{name:`Peso de ${first.name}, serie 1: 80`,exact:true}).click();await firstCard.getByRole('button',{name:`Sumar 2.5 a Peso de ${first.name}, serie 1`,exact:true}).click();await firstCard.getByRole('button',{name:'Listo',exact:true}).click();
 await page.getByRole('button',{name:'Ejercicio siguiente',exact:true}).click();await expect(page.locator('.exercise-focus-heading h2')).toHaveText(second.name);
 await page.getByRole('navigation',{name:'Elegir ejercicio'}).getByRole('button',{name:`Ir a ${first.name}`,exact:true}).click();
 await expect(firstCard.getByRole('button',{name:`Peso de ${first.name}, serie 1: 82,5`,exact:true})).toBeInViewport();
 await firstCard.getByRole('button',{name:`Confirmar ${first.name}, serie 1`,exact:true}).click();await expect(progress).toHaveAttribute('aria-valuenow','1');await expect(page.locator('.session-segments i.complete')).toHaveCount(1);
 await page.screenshot({path:'test-results/workout-deck-390.png',fullPage:true,animations:'disabled'});
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:330,y:600}]});
 for(let step=1;step<=12;step++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:330-step*23,y:600}]});await page.waitForTimeout(25);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(page.locator('.exercise-focus-heading h2')).toHaveText(second.name);
 await page.getByRole('button',{name:'Ejercicio anterior',exact:true}).click();await expect(firstCard.locator('.confirmed')).toHaveCount(1);
 for(let row=2;row<=3;row++)await firstCard.getByRole('button',{name:`Confirmar ${first.name}, serie ${row}`,exact:true}).click();
 await expect(page.getByRole('navigation',{name:'Elegir ejercicio'}).getByRole('button',{name:`Ir a ${first.name}`,exact:true})).toHaveText('✓');
 await page.evaluate(()=>navigator.serviceWorker.ready);await context.setOffline(true);await page.reload();await expect(page.getByRole('progressbar',{name:'Series completadas'})).toHaveAttribute('aria-valuenow','3');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('escritorio1400: tres zonas, riel funcional y referencias del ejercicio activo',async({page})=>{
 await page.setViewportSize({width:1400,height:900});const data=await boot(page),first=data.routine[6][0],third=data.routine[6][2];
 await page.getByRole('button',{name:`Confirmar ${first.name}, serie 1`,exact:true}).click();
 const rail=page.getByRole('navigation',{name:'Ejercicios de la sesión'});await expect(rail).toBeVisible();await expect(rail.getByRole('button')).toHaveCount(7);
 await expect(page.getByRole('complementary',{name:'Referencia del ejercicio'})).toBeVisible();
 const boxes=await Promise.all(['.exercise-rail','.workout-focus','.workout-insights'].map(sel=>page.locator(sel).boundingBox()));expect(boxes[0].x+boxes[0].width).toBeLessThan(boxes[1].x);expect(boxes[1].x+boxes[1].width).toBeLessThan(boxes[2].x);
 await page.screenshot({path:'test-results/workout-deck-1400.png',fullPage:true,animations:'disabled'});
 await rail.getByRole('button').filter({hasText:third.name}).click();await expect(page.locator('.exercise-focus-heading h2')).toHaveText(third.name);await expect(page.locator('.workout-prescription')).toContainText(third.name);
 expect(await page.locator('.workout-exercise:visible').count()).toBe(1);
 await page.setViewportSize({width:390,height:844});await expect(page.getByRole('article',{name:third.name,exact:true})).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
