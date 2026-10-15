import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,preparationSuggestions,recordSet,weeklyVolume} from '../src/domain.js';
import {contextualPreparation,isPressDay,migratePreparation,setPreparationCount} from '../src/preparation.js';
import {sessionExercise,startDeload} from '../src/training.js';
import {saveCalendar} from '../src/program/nutrition.js';

test('lunes aplica primero, compuesto posterior, primer aislamiento y siguientes sin previas',()=>{
 const state=initialState(),list=state.routine[0],plans=list.map(ex=>sessionExercise(state,ex,'2026-10-12'));
 assert.deepEqual(plans.map(ex=>ex.approaches),[2,1,1,1,0,2,2,0]);
 assert.deepEqual(preparationSuggestions(plans[0],100).map(row=>[row.weight,row.reps]),[[50,10],[75,8]]);
 assert.deepEqual(preparationSuggestions(plans[1],100).map(row=>[row.weight,row.reps]),[[60,8]]);
 assert.deepEqual(preparationSuggestions(plans[3],100).map(row=>[row.weight,row.reps]),[[45,10]]);
 assert.deepEqual(preparationSuggestions(plans[4],100),[]);assert.match(plans[3].preparationReason,/primer aislamiento/);
});
test('reordenar, cambiar la zona o corregir el calendario recalcula sin depender de historial',()=>{
 let state=initialState();const list=state.routine[0],machine=list[4];state.routine[0]=[machine,...list.filter(ex=>ex.id!==machine.id)];
 assert.equal(sessionExercise(state,machine,'2026-10-12').approaches,2);assert.equal(sessionExercise(state,list[0],'2026-10-12').approaches,1);
 const joint={...list[3],preparationJoint:'Otra articulación'};assert.equal(contextualPreparation(joint,[list[0],joint]).approaches,2);
 state=saveCalendar(state,'2026-10-18',{type:'weights',routineDay:0,trainingTime:'18:00'});assert.equal(sessionExercise(state,machine,'2026-10-18').approaches,2);
 assert.equal(isPressDay(list),true);assert.equal(isPressDay(state.routine[4]),false);
});
test('máquinas con músculo trabajado usan una muy ligera solo si es la primera de su grupo',()=>{
 const state=initialState(),first=state.routine[0][0],machine={...state.routine[0][4],compound:true},next={...machine,id:'next'};
 assert.deepEqual(contextualPreparation(machine,[first,machine]).preparationSteps,[{percent:45,reps:10}]);
 assert.equal(contextualPreparation(next,[first,machine,next]).approaches,0);
});
test('guarda 0–3 por ejercicio, respeta mínimo global y permite regresar a automático',()=>{
 let state=initialState();const ex=state.routine[0][0];state=setPreparationCount(state,ex.id,0);assert.equal(sessionExercise(state,ex,'2026-10-12').approaches,0);
 state.preparationSettings.minimum=1;assert.equal(sessionExercise(state,ex,'2026-10-12').approaches,1);assert.match(sessionExercise(state,ex,'2026-10-12').preparationReason,/Mínimo global/);
 state=setPreparationCount(state,ex.id,3);assert.equal(sessionExercise(state,ex,'2026-10-12').approaches,3);state=setPreparationCount(state,ex.id,null);assert.equal(sessionExercise(state,ex,'2026-10-12').approaches,2);assert.throws(()=>setPreparationCount(state,ex.id,4));
});
test('redondeo nunca supera 80%, incluso con poco peso e incrementos grandes',()=>{
 const state=initialState();for(const weight of [0,1,5,6,10,23,62.5,102.5])for(const increment of [1,2.5,5])for(const count of [0,1,2,3]){
 const ex={...state.routine[0][0],increment,...contextualPreparation({...state.routine[0][0],preparationOverride:count},state.routine[0])};
 for(const row of preparationSuggestions(ex,weight)){assert.ok(row.weight<=weight*.8+1e-8);assert.ok(Math.abs(row.weight/increment-Math.round(row.weight/increment))<1e-8);}
 }
});
test('registro rechaza fallo y más de 80%, guarda referencia y no suma volumen',()=>{
 let state=initialState();const ex=state.routine[0][0];state.profiles[ex.profileId].workWeight=100;
 const log={id:'prep',date:'2026-10-12',exerciseId:ex.id,profileId:ex.profileId,muscle:ex.muscle,kind:'approach',weight:80,reps:8,rpe:6,failure:false,createdAt:'2026-10-12T18:00:00Z'};
 assert.throws(()=>recordSet(state,ex,{...log,weight:81}),/80%/);assert.throws(()=>recordSet(state,ex,{...log,failure:true}),/nunca llegan al fallo/);
 state=recordSet(state,ex,log);assert.equal(state.logs[0].referenceWeight,100);assert.equal(weeklyVolume(state,'2026-10-12')[0].done,0);
 const before=preparationSuggestions(sessionExercise(state,ex,'2026-10-12'),100);state=startDeload(state,'2026-10-12');assert.deepEqual(preparationSuggestions(sessionExercise(state,ex,'2026-10-12'),100),before);
});
test('migra defaults a automático, conserva ajustes identificables e historial sin activar opcionales',()=>{
 const state=initialState(),old={...state,schemaVersion:6,routine:structuredClone(state.routine)};
 for(const ex of old.routine.flat())delete ex.preparationOverride;
 old.routine[0][0].approaches=3;const next=migratePreparation(old);
 assert.equal(next.schemaVersion,7);assert.equal(next.routine[0][0].preparationOverride,3);assert.equal(next.routine[0][1].preparationOverride,null);assert.deepEqual(next.logs,old.logs);assert.deepEqual(next.profiles,old.profiles);assert.equal(next.preparationSettings.general,false);assert.equal(next.preparationSettings.rotators,false);assert.equal(migratePreparation(next),next);
});
