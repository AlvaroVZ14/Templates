import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {progressionSuggestion,progressionSet,saveExerciseFeedback} from '../src/doubleProgression.js';
import {confirmQuickSet} from '../src/quickRegistration.js';
import {BACKUP_STORES,validateBackup,combineStates} from '../src/backup.js';
import {projectCollections} from '../src/history.js';
const date='2026-11-03',nextDate='2026-11-10';
function fixture(equipment='barbell'){
 const state=initialState(),ex={...state.routine[1][0],equipment,increment:2.5};
 state.logs=Array.from({length:ex.sets},(_,i)=>({id:`set-${i}`,date,exerciseId:ex.id,profileId:ex.profileId,exerciseName:ex.name,equipment,kind:'effective',weight:i?72.5:80,reps:10,setRole:i?'backoff':'top',createdAt:`${date}T18:0${i}:00Z`,rpe:null,failure:null}));
 return {state,ex};
}
test('ALL sets and explicit clean 0–2 RIR, not one top or historical unknown effort',()=>{
 let {state,ex}=fixture();assert.equal(progressionSuggestion(state,ex,nextDate).action,'maintain');
 state=saveExerciseFeedback(state,ex,date,'strong',true);
 let suggestion=progressionSuggestion(state,ex,nextDate);assert.equal(suggestion.action,'increase');assert.equal(suggestion.prescriptions[0].weight,82.5);assert.equal(suggestion.prescriptions[0].reps,6);assert.equal(suggestion.prescriptions[1].weight,75);
 state.logs[2].reps=9;assert.equal(progressionSuggestion(state,ex,nextDate).action,'maintain');
 state.logs.pop();assert.equal(progressionSuggestion(state,ex,nextDate).action,'maintain');assert.throws(()=>saveExerciseFeedback(state,ex,date,'normal',true),/Completa/);
});
test('warmup and technique extensions do not enter progression; mismatched roles never qualify',()=>{
 let {state,ex}=fixture();state.logs.push({...state.logs[0],id:'warm',kind:'approach',reps:2},{...state.logs[0],id:'drop',kind:'drop',reps:2,parentId:'set-3'});
 state=saveExerciseFeedback(state,ex,date,'normal',true);assert.equal(progressionSuggestion(state,ex,nextDate).action,'increase');
 state.logs[1].setRole='light';assert.equal(progressionSuggestion(state,ex,nextDate).action,'maintain');
 assert.equal(progressionSuggestion(state,{...ex,sets:3},nextDate).action,'maintain');
 assert.equal(progressionSuggestion(state,{...ex,equipment:'machine'},nextDate).action,'maintain');
});
test('equipment increments and cable small plate configured, clean feedback required',()=>{
 for(const equipment of ['barbell','dumbbell','machine','cable']){
  let {state,ex}=fixture(equipment);if(equipment==='cable')state.profiles[ex.profileId].progressionPlateKg=1.25;
  state=saveExerciseFeedback(state,ex,date,'normal',false);assert.equal(progressionSuggestion(state,ex,nextDate).action,'maintain');
  state=saveExerciseFeedback(state,ex,date,'normal',true);assert.equal(progressionSuggestion(state,ex,nextDate).prescriptions[0].weight,equipment==='cable'?81.25:82.5);
 }
});
test('weak overrides success and duplicate edits do not make two weak sessions',()=>{
 let {state,ex}=fixture();state=saveExerciseFeedback(state,ex,date,'weak',true);state=saveExerciseFeedback(state,ex,date,'weak',true);
 let suggestion=progressionSuggestion(state,ex,nextDate);assert.equal(suggestion.action,'maintain');assert.equal(suggestion.prescriptions[0].weight,80);assert.doesNotMatch(suggestion.reason,/Dos sesiones/);
 const rows=state.logs.map(row=>({...row,id:`next-${row.id}`,date:nextDate}));state.logs.push(...rows);state=saveExerciseFeedback(state,ex,nextDate,'weak',true);
 assert.match(progressionSuggestion(state,ex,'2026-11-17').reason,/Dos sesiones/);
 state=saveExerciseFeedback(state,ex,nextDate,'normal',true);assert.equal(progressionSuggestion(state,ex,'2026-11-17').action,'increase');
});
test('maintain targets +1 rep capped, actual top drives editable backoff; deload cannot increase',()=>{
 let {state,ex}=fixture();state.logs[0].reps=8;
 assert.equal(progressionSet(state,ex,nextDate,0).reps,9);assert.equal(progressionSet(state,ex,nextDate,1).reps,10);
 assert.equal(progressionSet(state,{...ex,backoffPercent:20},nextDate,1,[{kind:'effective',setRole:'top',weight:100}]).weight,80);
 state.logs[0].reps=10;state=saveExerciseFeedback(state,ex,date,'strong',true);assert.equal(progressionSuggestion(state,{...ex,deload:true},nextDate).action,'maintain');
});
test('edited historical values invalidate the effort declaration; deload history and load ceiling never increase',()=>{
 let {state,ex}=fixture();state=saveExerciseFeedback(state,ex,date,'strong',true);state.logs[0].weight=90;assert.equal(progressionSuggestion(state,ex,nextDate).action,'maintain');
 state=saveExerciseFeedback(state,ex,date,'strong',true);state.logs[0].deload=true;assert.equal(progressionSuggestion(state,ex,nextDate).action,'maintain');
 state.logs[0].deload=false;state.logs[0].weight=1500;state=saveExerciseFeedback(state,ex,date,'strong',true);assert.equal(progressionSuggestion(state,ex,nextDate).action,'maintain');
});
test('first confirmation freezes decision, actual manual load updates reference without repeated increments',()=>{
 let {state,ex}=fixture();state=saveExerciseFeedback(state,ex,date,'strong',true);const before=structuredClone(state),now=Date.parse(`${nextDate}T18:00:00Z`);
 state=confirmQuickSet(state,ex,nextDate,0,{weight:85,reps:6},now);
 assert.deepEqual(before.logs.map(row=>row.weight),[80,72.5,72.5,72.5]);assert.equal(state.profiles[ex.profileId].workWeight,85);
 assert.equal(progressionSuggestion(state,ex,nextDate).prescriptions[0].weight,82.5);assert.equal(progressionSet(state,ex,nextDate,1,state.logs.filter(row=>row.date===nextDate)).weight,77.5);
 state=confirmQuickSet(state,ex,nextDate,1,{weight:77.5,reps:6},now+150000);assert.equal(state.progressionDecisions.filter(row=>row.type==='used').length,1);assert.ok(state.logs.at(-1).progressionDecisionId);
});
test('an already open legacy session without progression fields adopts a decision when continuing',()=>{
 let {state,ex}=fixture();state.logs.push({...state.logs[0],id:'already-logged',date:nextDate});
 state=confirmQuickSet(state,ex,nextDate,1,{weight:72.5,reps:8},Date.parse(`${nextDate}T18:03:00Z`));
 assert.equal(state.progressionDecisions.length,1);assert.equal(state.logs.at(-1).progressionDecisionId,state.progressionDecisions[0].id);assert.equal(state.logs.find(row=>row.id==='already-logged').weight,80);
});
function backup(state){const rows=projectCollections(state,state.sessions??[]),{sessions:_,...cache}=state,records=Object.fromEntries(BACKUP_STORES.map(key=>[key,[]]));records.app=[{key:'state',value:{...cache,storageFormat:2}}];for(const [key,values] of Object.entries(rows))records[key]=values.map(value=>({key:value.id,value}));return JSON.parse(JSON.stringify({format:'olympia-friends-backup',formatVersion:1,databaseName:'olympia-friends',databaseVersion:2,records}));}
test('decisions and feedback survive export/import and idempotent merge; bad imports rejected',()=>{
 let {state,ex}=fixture();state=saveExerciseFeedback(state,ex,date,'normal',true);
 const file=backup(state),restored=validateBackup(file).state;
 assert.deepEqual(restored.exerciseFeedback,state.exerciseFeedback);assert.deepEqual(restored.progressionDecisions,state.progressionDecisions);
 const merged=combineStates(restored,restored);assert.deepEqual(merged.progressionDecisions,state.progressionDecisions);assert.doesNotThrow(()=>validateBackup(backup(merged)));
 for(const change of [s=>s.exerciseFeedback[0].cleanRir='yes',s=>s.exerciseFeedback[0].sourceSets='broken',s=>s.progressionDecisions[0].version=2,s=>s.progressionDecisions[0].prescriptions[0].weight=-1,s=>s.profiles[ex.profileId].progressionPlateKg=0]){const bad=structuredClone(file);change(bad.records.app[0].value);assert.throws(()=>validateBackup(bad));}
});
test('merging independent installations relinks progression exercises while preserving source snapshots',()=>{
 let {state,ex}=fixture('dumbbell');ex.id='imported-incline';state.routine[1][0].id=ex.id;state.logs=state.logs.map(row=>({...row,exerciseId:ex.id}));state=saveExerciseFeedback(state,ex,date,'normal',true);
 const local=initialState(),current=validateBackup(backup(local)).state,incoming=validateBackup(backup(state)).state,merged=combineStates(current,incoming);
 const target=local.routine[1][0];assert.notEqual(target.id,ex.id);assert.equal(merged.exerciseFeedback[0].exerciseId,target.id);assert.equal(merged.progressionDecisions[0].exerciseId,target.id);assert.deepEqual(merged.exerciseFeedback[0].sourceSets,state.exerciseFeedback[0].sourceSets);
 assert.doesNotThrow(()=>validateBackup(backup(merged)));
});
