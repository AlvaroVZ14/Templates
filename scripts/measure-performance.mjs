import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {initialState} from '../src/domain.js';
import {shiftDate} from '../src/wellness.js';
const label=process.argv[2]??'current',url='http://localhost:4175/Templates/';
const browser=await chromium.launch({channel:'chromium'}),context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage(),cdp=await context.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:200000,uploadThroughput:100000});
await page.addInitScript(()=>{
 const RealDate=Date,offset=Date.parse('2026-11-03T18:00:00Z')-RealDate.now();window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[RealDate.now()+offset]));}static now(){return RealDate.now()+offset;}};
 window.__perf={frames:[],longTasks:[],cls:0};let last=0;
 const frame=now=>{if(last)window.__perf.frames.push(now-last);last=now;requestAnimationFrame(frame);};requestAnimationFrame(frame);
 try{new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__perf.longTasks.push(entry.duration);}).observe({type:'longtask',buffered:true});new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__perf.cls+=entry.value;}).observe({type:'layout-shift',buffered:true});}catch{}
 document.addEventListener('click',event=>{const button=event.target.closest('.fast-confirm');if(!button)return;const row=button.closest('.fast-set'),start=performance.now();const observer=new MutationObserver(()=>{if(!row.classList.contains('confirmed'))return;observer.disconnect();requestAnimationFrame(()=>{window.__perf.responses??=[];window.__perf.responses.push(performance.now()-start);});});observer.observe(row,{attributes:true,attributeFilter:['class']});},true);
});
const state=initialState();state.weightSetup={reviewedAt:'2026-11-03T18:00:00Z'};state.appearanceSettings={...state.appearanceSettings,effects:'full'};
for(const ex of state.routine.flat())state.profiles[ex.profileId].workWeight=40;
for(let week=26;week>=1;week--)for(const day of [1,2,3,5,6]){const date=shiftDate('2026-11-03',-week*7+day-1);state.sessionMeta??={};state.sessionMeta[date]={startedAt:`${date}T18:00:00Z`,endedAt:`${date}T19:00:00Z`};for(const ex of state.routine[day])for(let i=0;i<ex.sets;i++)state.logs.push({id:`synthetic-${week}-${day}-${ex.id}-${i}`,date,exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,exerciseName:ex.name,muscle:ex.muscle,kind:'effective',weight:ex.setPlan[i].role==='backoff'?36:40,reps:8,setRole:ex.setPlan[i].role,rpe:9,failure:false,createdAt:`${date}T18:${String(i).padStart(2,'0')}:00Z`});}
await page.route(url,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic benchmark</title>'}));await page.goto(url);
await page.evaluate(async state=>{const db=await new Promise(resolve=>{const r=indexedDB.open('heavy-duty-personal',1);r.onupgradeneeded=()=>r.result.createObjectStore('app');r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const tx=db.transaction('app','readwrite');tx.objectStore('app').put(state,'state');tx.oncomplete=resolve;});db.close();},state);await page.unroute(url);
async function opened(){await page.locator('.home-start').waitFor();return page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now())))));}
await page.reload();const cold=await opened();await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForTimeout(1000);
const warm=[];for(let i=0;i<5;i++){await page.reload();warm.push(await opened());}
await context.setOffline(true);const offline=[];for(let i=0;i<5;i++){await page.reload();offline.push(await opened());}
await page.getByRole('button',{name:'EMPEZAR ENTRENAMIENTO',exact:true}).click();await page.locator('.workout-exercise').first().waitFor();
await page.evaluate(()=>{window.__perf.frames=[];window.__perf.longTasks=[];});
for(const details of await page.locator('.workout-exercise').all()){
 if(!await details.evaluate(el=>el.open))await details.locator(':scope>summary').click();
 while(await details.getByRole('button',{name:/^Confirmar /}).count()){const button=details.getByRole('button',{name:/^Confirmar /}).first(),label=await button.getAttribute('aria-label');await button.click();await details.getByRole('button',{name:label.replace('Confirmar ','Guardada '),exact:true}).waitFor({timeout:10000});await page.waitForTimeout(120);}
}
await page.waitForFunction(()=>!(JSON.parse(localStorage.getItem('blood-guts-series-queue-v1')??'null')?.pending.length));
await page.waitForTimeout(400);const metrics=await page.evaluate(()=>window.__perf);
const summary=values=>{const sorted=[...values].sort((a,b)=>a-b);return {samples:values.length,p50:Number(sorted[Math.floor((sorted.length-1)*.5)]?.toFixed(1)),p95:Number(sorted[Math.ceil((sorted.length-1)*.95)]?.toFixed(1)),max:Number(sorted.at(-1)?.toFixed(1))};};
const result={label,environment:{viewport:'390x844',dpr:2,cpuSlowdown:4,network:'1.6 Mbps / 40 ms latency',browser:browser.version(),syntheticSessions:130,syntheticSets:state.logs.length,physicalPhone:false},openingMs:{firstVisit:cold,warm:summary(warm),offline:summary(offline)},confirmationMs:summary(metrics.responses??[]),frames:{...summary(metrics.frames),over20ms:metrics.frames.filter(n=>n>20).length,total:metrics.frames.length},longTasksMs:metrics.longTasks,cls:metrics.cls};
await mkdir('test-results',{recursive:true});await writeFile(`test-results/performance-${label}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();
