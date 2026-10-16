import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,validateLog} from '../src/domain.js';
import {comparison,exerciseEvolution,exerciseKey,historySummary,hydrateCollections,monthsBefore,previousSession,projectCollections,verifyProjection} from '../src/history.js';
import {requestPersistentStorage} from '../src/storage.js';

function fixture(){const state=initialState(),ex=state.routine[0][0];state.phases[0].startDate='2025-01-01';state.logs=['2025-01-06','2026-03-02','2026-07-06','2026-10-05','2026-10-12'].map((date,i)=>({id:`set-${i}`,date,exerciseId:ex.id,profileId:ex.profileId,exerciseName:ex.name,muscle:ex.muscle,equipment:ex.equipment,kind:'effective',weight:100+i*5,reps:8+i,rpe:10,failure:true,createdAt:`${date}T18:00:00Z`}));return {state,ex};}
test('colecciones reconstruyen sin perder ni duplicar series, diario, cardio, medidas ni fases',()=>{
 const {state,ex}=fixture();for(const kind of ['warmup','approach','drop','rp','forced','negative'])state.logs.push({...state.logs.at(-1),id:kind,kind,weight:50,parentId:state.logs.at(-1).id,restRealSeconds:kind==='rp'?20:null});state.journal={'2026-10-12':{weight:70,sleepHours:8}};state.cardio=[{id:'bike',date:'2026-10-12',minutes:20}];
 const rows=projectCollections(state);assert.equal(verifyProjection(state,rows),true);assert.deepEqual(hydrateCollections(state,rows).logs,state.logs);assert.equal(rows.sessions.length,5);assert.equal(rows.sessions.at(-1).exercises[0].sets.length,7);assert.equal(rows.sessions.at(-1).exercises[0].sets[1].type,'preparation');assert.ok(rows.sessions.at(-1).exerciseKeys.includes(exerciseKey(ex)));
 const damaged=structuredClone(rows);damaged.sessions.at(-1).exercises[0].sets.pop();assert.throws(()=>verifyProjection(state,damaged),/logs/);
 const duplicate=structuredClone(rows);duplicate.cardio.push(duplicate.cardio[0]);assert.throws(()=>verifyProjection(state,duplicate),/duplicadas/);
});
test('sesión conserva fase y día originales, admite datos desconocidos y no desaparece al borrar series',()=>{
 const {state}=fixture(),original=projectCollections(state).sessions;assert.equal(original[0].durationSeconds,null);assert.equal(original[0].exercises[0].sets[0].restRealSeconds,null);state.calendar={'2026-10-12':{routineDay:4}};state.phases[0].targetWeight=80;state.logs=[];
 const sessions=projectCollections(state,original).sessions;assert.equal(sessions.length,5);assert.equal(sessions.at(-1).routineDay,0);assert.equal(sessions.at(-1).phase.targetWeight,74);assert.equal(sessions.at(-1).exercises.length,0);
});
test('comparación usa sesión anterior del mismo día y equipo, aunque cruce mes o año',()=>{
 const {state}=fixture(),rows=projectCollections(state).sessions,current=rows.at(-1),prior=previousSession(rows,current);assert.equal(prior.date,'2026-10-05');assert.equal(comparison(current,prior)[0].weightChange,5);assert.equal(comparison(current,prior)[0].repsChange,1);assert.equal(previousSession(rows,rows[0]),null);
 const different=structuredClone(prior);different.exercises[0].key='other-equipment';assert.equal(comparison(current,different)[0].before,null);
});
test('gráfico filtra 3, 6, 12 meses y todo sin eliminar historia',()=>{
 const {state,ex}=fixture(),rows=projectCollections(state).sessions;assert.deepEqual(['3','6','12','all'].map(range=>exerciseEvolution(rows,exerciseKey(ex),range,'2026-10-15').length),[2,3,4,5]);assert.equal(monthsBefore('2026-05-31',3),'2026-02-28');assert.equal(historySummary(rows).count,5);assert.equal(historySummary(rows).first,'2025-01-06');
});
test('duración y notas pueden actualizarse o quedar sin dato explícitamente',()=>{
 const {state}=fixture();state.sessionMeta={'2026-10-12':{durationSeconds:3300,notes:'Nota de prueba'}};const prior=projectCollections(state).sessions;assert.equal(prior.at(-1).durationSeconds,3300);state.sessionMeta['2026-10-12']={durationSeconds:null,notes:''};const next=projectCollections(state,prior).sessions;assert.equal(next.at(-1).durationSeconds,null);assert.equal(next.at(-1).notes,'');
 const ex=state.routine[0][0];assert.equal(validateLog({...state.logs[0],restRealSeconds:180},ex,state.logs),null);assert.match(validateLog({...state.logs[0],restRealSeconds:-1},ex,state.logs),/descanso real/);
});
test('persistencia solicita permiso y distingue concedido, denegado, ausente y error',async()=>{
 let calls=0;assert.equal((await requestPersistentStorage({persisted:async()=>true,persist:async()=>{calls++;return true;}})).kind,'granted');assert.equal(calls,0);assert.equal((await requestPersistentStorage({persist:async()=>{calls++;return false;}})).kind,'denied');assert.equal(calls,1);assert.equal((await requestPersistentStorage({})).kind,'unsupported');assert.equal((await requestPersistentStorage({persist:async()=>{throw Error();}})).kind,'error');
});
