import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('dist');
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname.replace(/^\/Templates\//,'');const file=resolve(root,path||'index.html');if(!file.startsWith(root))throw Error();const body=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.ttf':'font/ttf','.png':'image/png','.jpg':'image/jpeg'})[extname(file)]??'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chromium',headless:true});
const results=[];
try{
 for(const mobile of [true,false]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/Templates/`);await page.getByRole('button',{name:'Posponer configuración',exact:true}).click();
  // Configure a training day in this disposable profile. Leave native clocks,
  // performance.now and requestAnimationFrame intact for the timing sample.
  await page.locator('.today-extra>summary').last().click();
  await page.locator('summary').filter({hasText:'Tipo de día y hora de entrenamiento'}).click();
  await page.getByLabel('Tipo de día',{exact:true}).selectOption('weights');
  await page.getByLabel('Rutina de este día',{exact:true}).selectOption('0');
  await page.getByRole('button',{name:'Guardar calendario',exact:true}).click();
  await page.getByText('Calendario guardado. Regenera el plan previsto para aplicar la distribución.',{exact:true}).waitFor();
  await page.locator('.today-extra>summary').last().click();await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(1000);
  const measure=()=>page.evaluate(()=>new Promise(resolve=>{
   const gaps=[],longTasks=[];let last=performance.now(),start=last;
   const observer=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>e.duration)));observer.observe({type:'longtask',buffered:false});
   const frame=time=>{gaps.push(time-last);last=time;if(time-start<3000)requestAnimationFrame(frame);else{observer.disconnect();const sorted=gaps.toSorted((a,b)=>a-b),canvas=document.querySelector('.ember-field');resolve({frames:gaps.length,fps:+(gaps.length*1000/(time-start)).toFixed(1),medianFrameMs:+sorted[Math.floor(sorted.length*.5)].toFixed(1),p95FrameMs:+sorted[Math.floor(sorted.length*.95)].toFixed(1),longTasks:longTasks.length,particles:canvas?.dataset.particles??0,targetFps:canvas?.dataset.targetFps??0,canvas:canvas?[canvas.width,canvas.height]:null,overflow:document.documentElement.scrollWidth>innerWidth});}};requestAnimationFrame(frame);
  }));
  const full=await measure();
  await page.getByRole('button',{name:/^Empezar sesión/}).click();
  await page.waitForTimeout(500);const gym=await measure();
  results.push({viewport:mobile?'390x844 DPR3 touch':'1440x900 DPR1',full,gym});await context.close();
 }
 await writeFile('docs/audit/performance.json',JSON.stringify({environment:'Chromium headless local; viewport emulado, sin CPU throttling; no es prueba en celular físico',sampleSeconds:3,results},null,2));
 console.log(JSON.stringify(results));
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
