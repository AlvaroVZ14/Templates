import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {applyWorkWeights,weightExercises,startGymSession,openGymSession,finishGymSession,gymSummary} from '../src/gym.js';
import {projectCollections,hydrateCollections} from '../src/history.js';
const start='2026-10-12T15:00:00.000Z',end='2026-10-12T16:05:00.000Z';
function effective(state,date,weight,reps,patch={}){const ex=state.routine[0][0];return {id:crypto.randomUUID(),date,weight,reps,kind:'effective',exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,exerciseName:ex.name,createdAt:`${date}T15:00:00Z`,...patch};}
test('configuración única por perfil, días compartidos, pesos vacíos y cero válidos; conserva notas e historial',()=>{
 const state=initialState(),before=structuredClone(state),ex=state.routine[0][0],curl=state.routine[0][6],rows=weightExercises(state);state.profiles[ex.profileId].notes='Nota ficticia';state.logs=[effective(state,'2026-10-05',80,8)];
 assert.equal(rows.filter(row=>row.profileId===curl.profileId).length,1);assert.deepEqual(rows.find(row=>row.profileId===curl.profileId).days,[0,3,5]);
 const next=applyWorkWeights(state,{[`weight:${ex.profileId}`]:'0',[`reps:${ex.profileId}`]:'12'},start);
 assert.equal(next.profiles[ex.profileId].workWeight,0);assert.equal(next.profiles[ex.profileId].targetReps,12);assert.equal(next.profiles[ex.profileId].notes,'Nota ficticia');assert.equal(next.profiles[curl.profileId].workWeight,null);assert.deepEqual(next.logs,state.logs);assert.deepEqual(state.routine,before.routine);assert.equal(next.weightSetup.reviewedAt,start);
});
test('rechaza pesos/reps inválidos sin mutar perfiles antes de guardar',()=>{
 const state=initialState(),copy=structuredClone(state),id=state.routine[0][0].profileId;
 for(const values of [{[`weight:${id}`]:'-1'},{[`weight:${id}`]:'1501'},{[`weight:${id}`]:'NaN'},{[`reps:${id}`]:'0'},{[`reps:${id}`]:'2.5'},{[`reps:${id}`]:''}])assert.throws(()=>applyWorkWeights(state,values));
 assert.deepEqual(state,copy);
});
test('inicio solo en hoy con entrenamiento, persiste selección y no reinicia otra sesión abierta',()=>{
 const state=initialState(),first=state.routine[0][0];state.logs=[effective(state,'2026-10-12',80,8),effective(state,'2026-10-12',80,8)];
 const next=startGymSession(state,'2026-10-12',start);assert.equal(next.gymSession.currentExerciseId,state.routine[0][1].id);assert.equal(next.sessionMeta['2026-10-12'].startedAt,start);assert.equal(next.navigationSettings.lastSession,'2026-10-12');assert.equal(startGymSession(next,'2026-10-16',end),next);assert.equal(openGymSession(state),null);assert.equal(openGymSession(next).date,'2026-10-12');assert.equal(next.logs[0].exerciseId,first.id);
 assert.throws(()=>startGymSession(state,'2026-10-13',start));assert.throws(()=>startGymSession(state,'2026-10-14','2026-10-14T15:00:00Z'));
});
test('adopta el cronómetro existente sin reiniciarlo y rechaza reabrir una sesión terminada',()=>{
 const state=initialState();state.sessionMeta={'2026-10-12':{startedAt:'2026-10-12T14:50:00Z',notes:'Conservar'}};
 const next=startGymSession(state,'2026-10-12',start);assert.equal(next.sessionMeta['2026-10-12'].startedAt,'2026-10-12T14:50:00Z');assert.equal(next.sessionMeta['2026-10-12'].notes,'Conservar');
 const finished=finishGymSession(next,end);assert.equal(openGymSession(finished),null);assert.throws(()=>startGymSession(finished,'2026-10-12',end));assert.equal(finishGymSession(finished,end),finished);
});
test('selección inicial respeta las series reducidas de una descarga',()=>{
 const state=initialState();state.deloads=[{startDate:'2026-10-12',endDate:'2026-10-18'}];state.logs=[effective(state,'2026-10-12',80,8)];
 assert.equal(startGymSession(state,'2026-10-12',start).gymSession.currentExerciseId,state.routine[0][1].id);
});
test('resumen compara solo efectivas contra la última fecha del mismo perfil/equipo, no récords inventados',()=>{
 const state=startGymSession(initialState(),'2026-10-12',start);state.logs=[effective(state,'2026-09-28',200,20),effective(state,'2026-10-05',80,8),effective(state,'2026-10-05',85,7),effective(state,'2026-10-05',500,100,{kind:'approach'}),effective(state,'2026-10-10',500,100,{equipment:'machine'}),effective(state,'2026-10-12',90,9),effective(state,'2026-10-12',1000,100,{kind:'drop'}),effective(state,'2026-10-12',100,10,{profileId:'nuevo',exerciseName:'Sin historial'})];
 const summary=gymSummary(state,'2026-10-12',end);assert.equal(summary.effectiveSets,2);assert.equal(summary.durationSeconds,3900);assert.equal(summary.records.length,1);assert.equal(summary.records[0].weight,90);assert.equal(summary.records[0].previousWeight,85);assert.equal(summary.records[0].previousReps,8);assert.equal(summary.records[0].previousDate,'2026-10-05');assert.equal(summary.records[0].reps,9);
});
test('finalizar conserva series/borradores y metadatos; duración y resumen sobreviven proyección histórica',()=>{
 const state=startGymSession(initialState(),'2026-10-12',start);state.logs=[effective(state,'2026-10-12',80,8)];state.trainingDrafts={pending:{date:'2026-10-12',values:{weight:'90'}}};state.timer={end:1};
 const next=finishGymSession(state,end);assert.equal(next.gymSession,null);assert.equal(next.timer,null);assert.deepEqual(next.logs,state.logs);assert.deepEqual(next.trainingDrafts,state.trainingDrafts);assert.equal(next.sessionMeta['2026-10-12'].gymSummary.effectiveSets,1);assert.equal(next.sessionMeta['2026-10-12'].durationSeconds,3900);assert.equal(state.sessionMeta['2026-10-12'].endedAt,null);
 const rows=projectCollections(next),restored=hydrateCollections(next,rows);assert.equal(rows.sessions[0].durationSeconds,3900);assert.equal(rows.sessions[0].endedAt,end);assert.deepEqual(restored.sessionMeta,next.sessionMeta);assert.deepEqual(restored.logs,next.logs);
});
