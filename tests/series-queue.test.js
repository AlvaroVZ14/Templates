import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {applySeriesOperation,createSeriesQueue,SERIES_RECOVERY} from '../src/seriesQueue.js';
const date='2026-11-03',now=Date.parse(date+'T18:00:00Z');
const memory=()=>{const rows=new Map();return {getItem:key=>rows.get(key),setItem:(key,value)=>rows.set(key,value),removeItem:key=>rows.delete(key)};};
function harness(options={}){
 let saved=initialState(),run;const storage=options.storage??memory(),errors=[];
 const queue=createSeriesQueue({storage,schedule:callback=>{run=callback;},onError:message=>errors.push(message),persist:async op=>{if(options.persist)await options.persist(op);saved=applySeriesOperation(saved,op);return saved;}});
 queue.initialize(saved);return {queue,storage,errors,start:()=>run(),ex:saved.routine[1][0],saved:()=>saved};
}
test('confirma visualmente antes de IndexedDB y serializa varias series con descanso real',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve),h=harness({persist:()=>gate});
 const first=h.queue.confirm(h.ex,date,0,{weight:40,reps:8},now);
 const second=h.queue.confirm(h.ex,date,1,{weight:36,reps:8},now+150000);
 assert.equal(h.queue.getState().logs.length,2);assert.equal(h.saved().logs.length,0);
 h.start();assert.equal(h.saved().logs.length,0);release();assert.deepEqual(await Promise.all([first,second]),[true,true]);
 await h.queue.flush();assert.equal(h.saved().logs.length,2);assert.equal(h.saved().logs[0].restRealSeconds,150);assert.equal(h.storage.getItem(SERIES_RECOVERY),undefined);
});
test('error revierte confirmaciones pendientes, conserva números y permite reintentar',async()=>{
 let fail=true;const h=harness({persist:()=>{if(fail)throw Error('quota');}});
 const first=h.queue.confirm(h.ex,date,0,{weight:42.5,reps:9},now),second=h.queue.confirm(h.ex,date,1,{weight:38,reps:7},now+150000);
 h.start();assert.deepEqual(await Promise.all([first,second]),[false,false]);
 assert.equal(h.queue.getState().logs.length,0);assert.equal(h.queue.getState().trainingDrafts[`quick:${date}:${h.ex.id}`].values['1:weight'],38);assert.equal(h.errors.length,1);
 fail=false;const retry=h.queue.confirm(h.ex,date,0,{weight:42.5,reps:9},now);h.start();assert.equal(await retry,true);assert.equal(h.saved().logs.length,1);
});
test('cierre antes de confirmar persistencia recupera la operación sin duplicar lo ya escrito',async()=>{
 const storage=memory(),h=harness({storage});h.queue.confirm(h.ex,date,0,{weight:40,reps:8},now);
 const pending=JSON.parse(storage.getItem(SERIES_RECOVERY)).pending[0],committed=applySeriesOperation(initialState(),pending);let saved=committed,run;
 const restored=createSeriesQueue({storage,schedule:callback=>run=callback,persist:async op=>saved=applySeriesOperation(saved,op)});
 restored.initialize(committed);assert.equal(restored.getState().logs.length,1);run();await restored.flush();assert.equal(saved.logs.length,1);assert.equal(storage.getItem(SERIES_RECOVERY),undefined);
});
test('inicio se recupera, y una técnica incompleta nunca se publica ni entra en la cola',async()=>{
 const h=harness(),start=h.queue.begin(date,now);assert.equal(h.queue.getState().gymSession.date,date);h.start();await start;
 const ex=h.saved().routine[1][2];for(let i=0;i<2;i++){const save=h.queue.confirm(ex,date,i,{weight:40,reps:10},now+i*105000);h.start();await save;}
 assert.throws(()=>h.queue.confirm(ex,date,2,{weight:40,reps:10,technique:'drop',extensions:[{weight:30,reps:null}]},now+210000),/Completa/);
 assert.equal(h.queue.pending(),0);assert.equal(h.saved().logs.length,2);
});
test('localStorage no disponible no bloquea IndexedDB',async()=>{
 const h=harness({storage:{getItem(){return null;},setItem(){throw Error('disabled');},removeItem(){}}}),save=h.queue.confirm(h.ex,date,0,{weight:40,reps:8},now);
 assert.equal(h.queue.getState().logs.length,1);h.start();assert.equal(await save,true);assert.equal(h.saved().logs.length,1);assert.equal(h.errors.length,1);
});
