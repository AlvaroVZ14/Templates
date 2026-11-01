import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,weeklyVolume} from '../src/domain.js';
import {confirmQuickSet,dropWeight,finishQuickSession,previousEffectiveSession,quickSetValues} from '../src/quickRegistration.js';
const date='2026-11-03',time=Date.parse(`${date}T18:00:00Z`);
const effective=(ex,extra={})=>({id:crypto.randomUUID(),exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,exerciseName:ex.name,muscle:ex.muscle,date:'2026-10-27',createdAt:'2026-10-27T18:00:00Z',kind:'effective',weight:40,reps:9,...extra});
test('fila precarga la última sesión por ejercicio/equipo y conserva cada serie, sin usar previas ni el futuro',()=>{
 const state=initialState(),ex=state.routine[1][0];state.logs=[effective(ex,{weight:99,date:'2026-10-20'}),effective(ex,{weight:40,reps:9}),effective(ex,{weight:35,reps:7,createdAt:'2026-10-27T18:03:00Z'}),effective(ex,{kind:'approach',weight:10}),effective(ex,{date:'2026-11-10',weight:200})];
 assert.equal(previousEffectiveSession(state,ex,date).length,2);assert.equal(quickSetValues(state,ex,date,0).weight,40);assert.equal(quickSetValues(state,ex,date,1).weight,35);assert.equal(quickSetValues(state,ex,date,1).reps,7);
 const curl=state.routine[5][3];state.logs.push(effective(curl,{setRole:'heavy'}));assert.equal(quickSetValues(state,curl,date,3).weight,null);
});
test('confirmación guarda una sola efectiva sin RPE/fallo inventados, inicia sesión y respeta Back-off',()=>{
 let state=initialState();const ex=state.routine[1][0],before=structuredClone(state);
 state=confirmQuickSet(state,ex,date,0,{weight:40,reps:9},time);assert.equal(before.logs.length,0);assert.equal(state.logs.length,1);assert.equal(state.logs[0].rpe,null);assert.equal(state.logs[0].failure,null);assert.equal(state.logs[0].setRole,'top');assert.equal(state.timer.duration,150);assert.equal(state.gymSession.date,date);
 state=confirmQuickSet(state,ex,date,1,{weight:36,reps:8},time+150000);assert.equal(state.profiles[ex.profileId].workWeight,40);assert.equal(state.logs[0].restRealSeconds,150);assert.equal(state.logs[1].setRole,'backoff');
 assert.throws(()=>confirmQuickSet(state,ex,date,1,{weight:36,reps:8},time+200000),/orden/);
});
test('descanso automático sobrevive recarga y cerrar barra; es tiempo entre confirmaciones con límite de un día',()=>{
 let state=initialState();const ex=state.routine[1][1];state=confirmQuickSet(state,ex,date,0,{weight:80,reps:8},time);state=structuredClone({...state,timer:null});state=confirmQuickSet(state,ex,date,1,{weight:72.5,reps:8},time+178000);
 assert.equal(state.logs[0].restRealSeconds,178);assert.equal(state.logs[0].restMeasurement,'between-confirmations');assert.equal(state.logs[1].restRealSeconds,null);
});
test('drop reduce30%, se guarda dentro de última efectiva en la misma operación y no añade volumen',()=>{
 let state=initialState();const ex=state.routine[1][2];assert.equal(dropWeight(ex,100),70);assert.equal(dropWeight(ex,100,1),50);
 for(let index=0;index<2;index++)state=confirmQuickSet(state,ex,date,index,{weight:100,reps:10},time+index*105000);
 const before=structuredClone(state);assert.throws(()=>confirmQuickSet(state,ex,date,2,{weight:100,reps:10,technique:'drop',extensions:[{weight:70,reps:null}]},time+210000),/Completa/);assert.deepEqual(state,before);
 state=confirmQuickSet(state,ex,date,2,{weight:100,reps:10,technique:'drop',extensions:[{weight:70,reps:6}]},time+210000);
 assert.equal(state.logs.length,4);assert.equal(state.logs.at(-1).parentId,state.logs.at(-2).id);assert.equal(state.timer.duration,105);assert.equal(weeklyVolume(state,date).find(row=>row.muscle==='Pecho').done,3);
});
test('RP registra dos mini-series vinculadas sin exigir otro formulario y descarga impide técnicas',()=>{
 let state=initialState();const ex=state.routine[1][3];state=confirmQuickSet(state,ex,date,0,{weight:20,reps:15},time);
 state=confirmQuickSet(state,ex,date,1,{weight:20,reps:14,technique:'rp',extensions:[{weight:20,reps:4},{weight:20,reps:3}]},time+105000);
 assert.equal(state.logs.filter(row=>row.kind==='effective').length,2);assert.equal(state.logs.filter(row=>row.kind==='rp').length,2);assert.equal(state.timer.duration,105);
 const deload=initialState();deload.deloads=[{startDate:date,endDate:date}];assert.throws(()=>confirmQuickSet(deload,{...ex,sets:1,deload:true},date,0,{weight:20,reps:12,technique:'rp',extensions:[]},time),/descarga/);
});
test('terminar sesión no borra series ni borradores anteriores y bloquea registros nuevos',()=>{
 let state=initialState();const ex=state.routine[1][0];state.trainingDrafts={old:{date,values:{weight:80}}};state=confirmQuickSet(state,ex,date,0,{weight:40,reps:8},time);state=finishQuickSession(state,date,time+600000);
 assert.equal(state.sessionMeta[date].gymSummary.effectiveSets,1);assert.equal(state.gymSession,null);assert.equal(state.quickRest,null);assert.equal(state.timer,null);assert.equal(state.trainingDrafts.old.values.weight,80);assert.throws(()=>confirmQuickSet(state,ex,date,1,{weight:36,reps:8},time+700000),/terminada/);
});
