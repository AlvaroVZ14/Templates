import {quickTab} from './quick-helpers.js';
import {test as base} from '@playwright/test';
import {test,expect,go,chooseDate} from './fixtures.js';

base('apertura de 1,3 s omitible, una vez al día de Chile y sin irrumpir a medianoche',async({page})=>{
  await page.clock.install({time:new Date('2026-10-13T02:59:00Z')});await page.goto('./');
  const intro=page.getByRole('button',{name:'Omitir apertura',exact:true});await expect(intro).toBeVisible();
  await intro.click();await expect(intro).toHaveCount(0);
  await page.getByRole('button',{name:'Posponer configuración',exact:true}).click();
  await page.clock.fastForward(65000);await expect(intro).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('heavy-duty-grunge-intro-day'))).toBe('2026-10-12');
  await page.reload();await expect(intro).toBeVisible();await page.clock.runFor(1350);await expect(intro).toHaveCount(0);
  await page.reload();await expect(page.getByRole('heading',{name:'Hoy',exact:true})).toBeVisible();await expect(intro).toHaveCount(0);
});

async function noYellow(page){
  const yellow=await page.evaluate(()=>{
    const bad=[];
    function check(value,tag){for(const match of value.matchAll(/rgba?\((\d+)[, ]+([\d.]+)[, ]+([\d.]+)/g)){
      const [r,g,b]=match.slice(1).map(Number),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
      if(!delta||delta/Math.max(1,max)<.25)continue;
      let h=max===r?(g-b)/delta:max===g?(b-r)/delta+2:(r-g)/delta+4;h=(h*60+360)%360;
      if(h>=30&&h<=75)bad.push(`${tag}: ${match[0]}`);
    }}
    for(const el of document.querySelectorAll('body *'))for(const pseudo of [null,'::before','::after']){
      const style=getComputedStyle(el,pseudo);if(style.display==='none'||Number(style.opacity)===0)continue;
      for(const key of ['color','backgroundColor','backgroundImage','borderTopColor','borderLeftColor','borderBottomColor','borderRightColor','boxShadow','textShadow','fill','stroke','outlineColor'])check(style[key]??'',el.tagName+':'+key);
    }
    return bad.slice(0,15);
  });expect(yellow).toEqual([]);
}

test('afiche, collage, grietas y todas las pantallas: legibles en móvil y sin amarillo',async({page})=>{
  test.setTimeout(90000);await page.clock.install({time:new Date('2026-10-12T18:00:00Z')});await page.goto('./');await chooseDate(page,'2026-10-12');
  await expect(page.locator('.poster-session strong')).toHaveText('Pecho');await expect(page.locator('.poster-session em')).toHaveText('Y');
  await expect(page.locator('.session-hero .hero-collage')).toHaveCount(1);await expect(page.locator('.session-hero .iron-collage')).toHaveCount(1);
  expect(await page.locator('.session-hero .shadow-figure .shadow-media').first().evaluate(el=>getComputedStyle(el).filter)).toContain('grayscale(1)');
  expect(await page.locator('.film-dust').evaluate(el=>getComputedStyle(el).animationTimingFunction)).toContain('steps');
  for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:900});
    for(const section of ['Hoy','Historial','Medidas','Diario','Comida','Progreso','Método','Ajustes','Rutina','Zonas con molestias']){
      await go(page,section);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${section} ${width}`).toBe(true);await noYellow(page);
    }
  }
  await page.setViewportSize({width:390,height:844});await go(page,'Hoy');for(const item of await page.locator('.today-extra').all())if(await item.getAttribute('open')!==null)await item.locator(':scope > summary').click();await page.clock.runFor(400);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/p22-hoy-mobile.png',fullPage:false});
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/p22-hoy-desktop.png',fullPage:false});
  await go(page,'Progreso');await page.clock.runFor(400);await page.evaluate(()=>scrollTo(0,0));await expect(page.locator('.progress-card.insufficient .signal')).toHaveText(['=','=','=']);
  await page.screenshot({path:'test-results/p22-progreso-desktop.png',fullPage:false});
});

test('transición y registro animados; efectos reducidos, apagados y gimnasio quietos',async({page})=>{
  await page.clock.install({time:new Date('2026-10-12T18:00:00Z')});await page.goto('./');await chooseDate(page,'2026-10-12');
  await page.getByRole('button',{name:'Abrir menú',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Diario',exact:true}).click();await expect(page.locator('.grunge-cut')).toHaveCount(1);await page.clock.runFor(400);await expect(page.locator('.grunge-cut')).toHaveCount(0);
  await go(page,'Hoy');await quickTab(page,'Otras');await page.getByLabel('Tipo de serie').selectOption('effective');await page.getByLabel('Carga de Press banca',{exact:true}).fill('60');await page.getByLabel('Repeticiones de Press banca',{exact:true}).fill('8');await page.getByRole('button',{name:/^Guardar serie/}).click();
  await expect(page.locator('.log-row .grunge-stamp')).toHaveText('FALLO');
  await go(page,'Ajustes');await page.getByLabel('Efectos visuales',{exact:true}).selectOption('reduced');await page.getByRole('button',{name:'Guardar apariencia',exact:true}).click();
  await expect(page.locator('.app-shell')).toHaveAttribute('data-grunge','reduced');expect(await page.locator('.film-dust').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.getByLabel('Efectos visuales',{exact:true}).selectOption('off');await page.getByRole('button',{name:'Guardar apariencia',exact:true}).click();await expect(page.locator('.film-dust')).not.toBeVisible();
  await page.getByLabel('Efectos visuales',{exact:true}).selectOption('full');await page.getByRole('button',{name:'Guardar apariencia',exact:true}).click();await go(page,'Hoy');
  await page.getByRole('button',{name:/^Empezar sesión/}).click();await expect(page.locator('.grunge-film')).not.toBeVisible();await expect(page.locator('.session-hero .grunge-cracks')).not.toBeVisible();
});

base('movimiento reducido del sistema: sin apertura, corte ni película animada',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./');await expect(page.getByRole('heading',{name:'Configurar pesos',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Omitir apertura',exact:true})).toHaveCount(0);await expect(page.locator('.film-dust')).not.toBeVisible();
  await page.getByRole('button',{name:'Posponer configuración',exact:true}).click();await page.getByRole('button',{name:'Abrir menú',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Progreso',exact:true}).click();await expect(page.locator('.grunge-cut')).toHaveCount(0);
});
