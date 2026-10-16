import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, preparationSuggestions, extensionSuggestions, recordSet, weeklyVolume } from '../src/domain.js';
import { activeDeload, applyProgression, deloadAdvice, finishDeload, introduceTechnique, migrateTraining, muscleRecovery, progression, sessionExercise, sessions, startDeload, trainingLogError } from '../src/training.js';
import {shiftDate} from '../src/wellness.js';

function fixture(){const state=initialState(),ex=state.routine[0][0];state.trainingStarted='2026-10-01';state.profiles[ex.profileId].workWeight=100;return {state,ex};}
function log(ex,date,weight=100,reps=10,extra={}){return {id:crypto.randomUUID(),exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,muscle:ex.muscle,kind:'effective',date,weight,reps,rpe:10,failure:true,createdAt:`${date}T20:00:00Z`,...extra};}

test('migra rangos y metadatos sin cambiar referencias, rutina ni registros',()=>{
 const {state,ex}=fixture(),old={...state,schemaVersion:5};old.logs=[log(ex,'2026-10-01')];const next=migrateTraining(old,'2026-10-15');
 assert.equal(next.schemaVersion,6);assert.deepEqual(next.logs,old.logs);assert.deepEqual(next.routine,old.routine);assert.equal(next.profiles[ex.profileId].workWeight,100);assert.equal(next.profiles[ex.profileId].repMax,12);assert.deepEqual(next.deloads,[]);assert.equal(migrateTraining(next),next);
});
test('doble progresión confirma una vez y actualiza la referencia de todas las sugerencias',()=>{
 let {state,ex}=fixture();state.logs=[log(ex,'2026-10-12',100,12)];let advice=progression(state,ex,'2026-10-12');assert.equal(advice.weight,102.5);assert.match(advice.reason,/2,5–5%/);
 const next=applyProgression(state,ex,'2026-10-12'),weight=next.profiles[ex.profileId].workWeight;
 assert.equal(weight,102.5);assert.equal(state.profiles[ex.profileId].workWeight,100);assert.equal(next.profiles[ex.profileId].targetReps,8);assert.equal(preparationSuggestions(ex,weight)[0].weight,52.5);assert.equal(extensionSuggestions(ex,weight,'drop')[0].weight,82.5);assert.equal(extensionSuggestions(ex,weight,'rp')[0].weight,102.5);assert.equal(progression(next,ex,'2026-10-12').type,'maintain');assert.throws(()=>applyProgression(next,ex,'2026-10-12'));
 state.logs[0].failure=false;assert.notEqual(progression(state,ex,'2026-10-12').type,'increase');state.logs[0].failure=true;state.logs[0].reps=11;assert.equal(progression(state,ex,'2026-10-12').type,'maintain');
 state.logs=[log(ex,'2026-10-12',30,12)];assert.equal(progression(state,{...ex,increment:5},'2026-10-12').type,'rounding');assert.notEqual(progression(state,ex,'2026-11-01').type,'increase');
});
test('compara sesiones, no series del mismo día, e ignora preparación, equipo distinto y descarga',()=>{
 const {state,ex}=fixture();state.logs=[log(ex,'2026-10-01',100,10),log(ex,'2026-10-08',100,9),log(ex,'2026-10-15',95,8),log(ex,'2026-10-15',100,15),log(ex,'2026-10-16',105,12,{kind:'approach'}),log(ex,'2026-10-17',105,12,{equipment:'machine'}),log(ex,'2026-10-18',100,8,{deload:true})];
 assert.equal(sessions(state,ex,'2026-10-18').length,3);assert.equal(progression(state,ex,'2026-10-18').type,'review');assert.equal(progression(state,ex,'2026-10-08').type,'maintain');
});
test('estancamiento requiere tres semanas registradas y solo introduce una técnica por sesión',()=>{
 let {state,ex}=fixture();state.logs=['2026-10-01','2026-10-08','2026-10-15','2026-10-22'].map(date=>log(ex,date));assert.equal(progression(state,ex,'2026-10-15').type,'maintain');assert.equal(progression(state,ex,'2026-10-22').type,'technique');
 state=introduceTechnique(state,ex,'2026-10-22','rp');assert.equal(sessionExercise(state,ex,'2026-10-22').technique,'rp');assert.equal(sessionExercise(state,ex,'2026-10-23').technique,'');assert.throws(()=>introduceTechnique(state,ex,'2026-10-22','drop'));assert.throws(()=>introduceTechnique(state,ex,'2026-10-23','forced'));assert.equal(ex.forced,false);assert.equal(ex.negative,false);
 state.logs[2].reps=11;assert.notEqual(progression(state,ex,'2026-10-22').type,'technique');
});
test('no mezcla técnicas y limita forzadas/negativas a dos ejercicios activados',()=>{
 const {state,ex}=fixture(),second=state.routine[0][1],third=state.routine[0][2],date='2026-10-15';
 assert.match(trainingLogError(state,ex,log(ex,date,100,3,{kind:'forced'})),/Activa/);
 ex.forced=true;second.negative=true;third.forced=true;
 for(const [exercise,kind] of [[ex,'forced'],[second,'negative']]){const parent=log(exercise,date);state.logs.push(parent,log(exercise,date,100,3,{kind,parentId:parent.id}));}
 assert.match(trainingLogError(state,third,log(third,date,100,3,{kind:'forced'})),/máximo 2/);
 assert.equal(trainingLogError(state,ex,log(ex,date,100,2,{kind:'forced'})),null);
 assert.match(trainingLogError(state,ex,log(ex,date,80,6,{kind:'drop'})),/No mezcles/);
 assert.throws(()=>recordSet(state,third,log(third,date,100,3,{kind:'forced',parentId:'missing'})));
});
test('registro manual tampoco introduce dos técnicas nuevas en la misma sesión',()=>{
 let {state,ex}=fixture();const other=state.routine[0][2],date='2026-10-15';
 const first=log(ex,date),second=log(other,date);state.logs=[first,second];
 state=recordSet(state,ex,log(ex,date,80,5,{kind:'drop',parentId:first.id}));assert.equal(state.logs.at(-1).techniqueIntroduced,true);
 assert.match(trainingLogError(state,other,log(other,date,100,4,{kind:'rp',parentId:second.id})),/una a la vez/);
 assert.equal(trainingLogError(state,ex,log(ex,date,65,4,{kind:'drop',parentId:first.id})),null);
});
test('descarga mantiene carga y preparaciones, limita volumen y esfuerzo y conserva historial',()=>{
 let {state,ex}=fixture();ex.sets=3;ex.technique='drop';ex.forced=true;
 const normal=preparationSuggestions(sessionExercise(state,ex,'2026-10-15'),100),normalVolume=weeklyVolume(state,'2026-10-15')[0].planned;state=startDeload(state,'2026-10-15');const plan=sessionExercise(state,ex,'2026-10-15');assert.equal(plan.sets,2);assert.equal(plan.technique,'');assert.equal(plan.forced,false);assert.deepEqual(preparationSuggestions(plan,100),normal);assert.equal(progression(state,ex,'2026-10-15').type,'deload');assert.ok(weeklyVolume(state,'2026-10-15')[0].planned<normalVolume);
 assert.match(trainingLogError(state,ex,log(ex,'2026-10-15')),/sin fallo/);assert.match(trainingLogError(state,ex,log(ex,'2026-10-15',80,5,{kind:'drop'})),/sin técnicas/);
 for(let i=0;i<2;i++)state=recordSet(state,ex,log(ex,'2026-10-15',90,8,{failure:false,rpe:6}));
 assert.equal(state.profiles[ex.profileId].workWeight,100);assert.equal(state.logs[0].deload,true);assert.throws(()=>recordSet(state,ex,log(ex,'2026-10-15',100,8,{failure:false,rpe:6})),/50%/);assert.equal(state.timer.duration,ex.rests.effective);
 assert.equal(activeDeload(state,'2026-10-21')!==null,true);assert.equal(activeDeload(state,'2026-10-22'),null);assert.equal(sessionExercise(state,ex,'2026-10-22').sets,3);assert.equal(sessionExercise(state,ex,'2026-10-22').technique,'drop');
 state=finishDeload(state,'2026-10-17');assert.equal(activeDeload(state,'2026-10-18'),null);assert.equal(state.deloads.length,1);assert.throws(()=>startDeload(state,'2026-10-16'));
});
test('sugiere descarga a las seis semanas o con dos semanas suficientes de mala recuperación y caída',()=>{
 let {state,ex}=fixture();assert.equal(deloadAdvice(state,'2026-11-11').due,false);assert.equal(deloadAdvice(state,'2026-11-12').due,true);state=startDeload(state,'2026-11-12');assert.equal(deloadAdvice(state,'2026-11-20').due,false);
 ({state,ex}=fixture());for(let i=0;i<14;i++)state.journal[shiftDate('2026-10-01',i)]={fatigue:9,sleepHours:6};state.logs=[log(ex,'2026-10-01',100,10),log(ex,'2026-10-08',100,9),log(ex,'2026-10-14',100,8)];assert.equal(deloadAdvice(state,'2026-10-14').early,true);delete state.journal['2026-10-01'];delete state.journal['2026-10-02'];delete state.journal['2026-10-03'];delete state.journal['2026-10-04'];assert.equal(deloadAdvice(state,'2026-10-14').due,false);
});
test('recuperación distingue menos de 48h, horas desconocidas y estímulo actual',()=>{
 const {state,ex}=fixture();state.logs=[log(ex,'2026-10-14',100,8,{performedAt:'2026-10-15T01:00:00Z'})];
 assert.equal(muscleRecovery(state,'Pecho','2026-10-15',new Date('2026-10-15T20:00:00Z')).warning,true);assert.equal(muscleRecovery(state,'Pecho','2026-10-16',new Date('2026-10-17T02:00:00Z')).warning,false);
 delete state.logs[0].performedAt;assert.equal(muscleRecovery(state,'Pecho','2026-10-16').uncertain,true);assert.equal(muscleRecovery(state,'Pecho','2026-10-15').warning,true);assert.equal(muscleRecovery(state,'Espalda','2026-10-15').last,null);
 state.logs.push(log(ex,'2026-10-15'));assert.equal(muscleRecovery(state,'Pecho','2026-10-15').today,true);
});
