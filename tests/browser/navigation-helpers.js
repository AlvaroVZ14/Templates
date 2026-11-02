import {expect} from '@playwright/test';
export async function menu(page){if(!await page.getByRole('dialog').isVisible())await page.getByRole('button',{name:'Abrir menú',exact:true}).click();return page.getByRole('dialog');}
export async function go(page,name){
 const drawer=await menu(page),group=name==='Hoy'?'Ir a otra sesión':['Diario','Comida','Cardio y recuperación'].includes(name)?'Comida y sueño':['Ajustes','Perfil','Acerca de','Rutina','Configurar pesos','Zonas con molestias'].includes(name)?'Ajustes':null;
 if(group){const summary=drawer.locator('.drawer-group>summary').filter({hasText:new RegExp(`^${group}$`)});if(!await summary.locator('..').evaluate(el=>el.open))await summary.click();}
 const target=['Historial','Progreso','Volumen'].includes(name)?'Historial y progreso':name==='Diario'?'Sueño y diario':name==='Ajustes'?'Configuración':name;
 await drawer.getByRole('button',{name:target,exact:true}).click();await expect(drawer).not.toBeVisible();
  await expect(page.locator('.page-skeleton')).toHaveCount(0);
  await page.locator('main').evaluate(()=>true);
  if(name==='Historial'){const details=page.locator('.overview-history');if(!await details.evaluate(el=>el.open))await details.locator(':scope>summary').click();}
 if(name==='Volumen'&&await page.locator('.weekly-volume-details').count())await page.locator('.weekly-volume-details>summary').click();
}
export async function chooseDate(page,date){const drawer=await menu(page),summary=drawer.locator('.drawer-group>summary').filter({hasText:'Ir a otra sesión'});if(!await summary.locator('..').evaluate(el=>el.open))await summary.click();const field=drawer.getByLabel('Fecha de entrenamiento',{exact:true});if(await field.inputValue()===date)await drawer.getByRole('button',{name:'Abrir sesi\u00f3n seleccionada',exact:true}).click();else await field.fill(date);await expect(drawer).not.toBeVisible();}
export async function openExercise(page,name){
  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.locator('.page-skeleton')).toHaveCount(0);
 if(await page.locator('.app-shell').getAttribute('data-page')==='today')await page.getByRole('button',{name:'EMPEZAR ENTRENAMIENTO',exact:true}).click();
 if(await page.locator('.app-shell').getAttribute('data-page')!=='workout'){const drawer=await menu(page),group=drawer.locator('.drawer-group>summary').filter({hasText:'Ir a otra sesi\u00f3n'});if(!await group.locator('..').evaluate(el=>el.open))await group.click();await drawer.getByRole('button',{name:'Abrir sesi\u00f3n seleccionada',exact:true}).click();}
 await expect(page.locator('.app-shell')).toHaveAttribute('data-page','workout');await expect(page.locator('.fast-session-heading')).toBeVisible();
 const choice=page.getByRole('navigation',{name:'Elegir ejercicio',exact:true}).getByRole('button',{name:`Ir a ${name}`,exact:true});
 await choice.click();await expect(choice).toHaveAttribute('aria-current','step');
 await expect(page.getByRole('article',{name,exact:true})).toBeInViewport();
}
