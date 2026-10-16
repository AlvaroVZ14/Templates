import {test,expect} from '@playwright/test';
import {go,menu,chooseDate} from './navigation-helpers.js';
test('único menú, secciones accesibles, lado y última sesión conservados, Atrás cierra',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('./');await expect(page.getByRole('heading',{name:'A entrenar.'})).toBeVisible();await expect(page.locator('.bottom-nav')).toHaveCount(0);await expect(page.locator('main nav,main .week-strip,main .session-navigation')).toHaveCount(0);
 for(const section of ['Historial','Medidas','Diario','Comida','Progreso','Método','Ajustes','Rutina','Hoy']){await go(page,section);await expect(page.locator('h1:visible')).toHaveCount(1);}
 await chooseDate(page,'2026-10-12');await page.reload();await menu(page);await expect(page.getByLabel('Fecha de entrenamiento')).toHaveValue('2026-10-12');await page.goBack();await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page.getByRole('heading',{name:'A entrenar.'})).toBeVisible();
 await go(page,'Ajustes');await page.getByLabel('Lado del menú',{exact:true}).selectOption('left');await expect(page.getByRole('status')).toContainText('Preferencia guardada');await go(page,'Hoy');const button=await page.getByRole('button',{name:'Abrir menú'}).boundingBox();expect(button.x).toBeLessThan(45);await page.screenshot({path:'test-results/clean-today.png',fullPage:false});
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}expect(errors).toEqual([]);
});
