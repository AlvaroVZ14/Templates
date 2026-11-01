import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {confirmQuickSet} from '../src/quickRegistration.js';
import {adjustRestTimer,restTimerLabel} from '../src/restTimer.js';
const date='2026-11-03',now=Date.parse(`${date}T18:00:00Z`);
test('±15 modifica solo la cuenta atrás y conserva origen, reloj real y registros',()=>{
 let state=initialState(),ex=state.routine[1][0];state=confirmQuickSet(state,ex,date,0,{weight:80,reps:8},now);
 const original=structuredClone(state),extended=adjustRestTimer(state,15,now+10000),shortened=adjustRestTimer(extended,-15,now+10000);
 assert.equal(extended.timer.end,state.timer.end+15000);assert.equal(extended.timer.duration,state.timer.duration+15);assert.deepEqual(extended.quickRest,original.quickRest);assert.deepEqual(extended.logs,original.logs);assert.deepEqual(shortened.timer,state.timer);assert.deepEqual(state,original);
 const next=confirmQuickSet({...extended,timer:null},ex,date,1,{weight:72.5,reps:8},now+178000);assert.equal(next.logs[0].restRealSeconds,178);
});
test('cuenta atrás no negativa, reanudar tras acabar y compatibilidad con temporizador antiguo',()=>{
 const state={timer:{end:now+5000,duration:5,startedAt:now}},zero=adjustRestTimer(state,-15,now+3000);assert.equal(zero.timer.end,now+3000);assert.equal(zero.timer.duration,3);
 assert.equal(adjustRestTimer(state,15,now+10000).timer.end,now+25000);assert.equal(adjustRestTimer(state,99,now),state);assert.deepEqual(adjustRestTimer({timer:null},15,now),{timer:null});
 assert.ok(Number.isFinite(adjustRestTimer({timer:{end:now+30000}},15,now).timer.duration));
});
test('tipo de descanso viene de la serie de origen, aunque se seleccione otro ejercicio',()=>{
 let state=initialState(),ex=state.routine[1][0];state=confirmQuickSet(state,ex,date,0,{weight:80,reps:8},now);
 assert.equal(restTimerLabel(state,state.timer),'Compuesto 2–3 min');
 const log=state.logs[0];for(const [kind,label] of [['approach','Preparación 1–2 min'],['rp','Rest-pause 15–20 s'],['drop','Drop 10–15 s']])assert.equal(restTimerLabel({...state,logs:[{...log,kind}]},state.timer),label);
 assert.equal(restTimerLabel(state,{label:state.routine[1].find(ex=>ex.loadType==='isolation').name}),'Aislamiento 1,5–2 min');
});
