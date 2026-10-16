import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {generateSummary,summaryPeriods,SUMMARY_REQUEST} from '../src/summaries.js';
test('ventanas semanales y mensuales cruzan mes/año y febrero bisiesto sin solaparse',()=>{
 assert.deepEqual(summaryPeriods('weekly','2027-01-03'),[{start:'2026-12-28',end:'2027-01-03'},{start:'2026-12-21',end:'2026-12-27'}]);assert.deepEqual(summaryPeriods('monthly','2024-03-15'),[{start:'2024-03-01',end:'2024-03-15'},{start:'2024-02-01',end:'2024-02-29'}]);
});
test('resumen conserva detalle, unidades y ausencias, excluye borradores y no muta datos',()=>{
 const state=initialState(),ex=state.routine[0][0];state.logs=[{id:'a',date:'2026-10-12',exerciseId:ex.id,profileId:ex.profileId,exerciseName:ex.name,muscle:'Pecho',equipment:'dumbbell',kind:'effective',weight:40,reps:8,rpe:9,failure:true,restRealSeconds:180},{id:'b',date:'2026-10-12',exerciseId:ex.id,profileId:ex.profileId,exerciseName:ex.name,muscle:'Pecho',equipment:'dumbbell',kind:'approach',weight:20,reps:10,rpe:6,failure:false},{id:'c',date:'2026-10-12',exerciseId:ex.id,profileId:ex.profileId,exerciseName:ex.name,muscle:'Pecho',equipment:'dumbbell',kind:'drop',weight:30,reps:5,rpe:10,parentId:'a'}];state.journal={'2026-10-12':{weight:70,sleepHours:6,stress:2,energy:7,fatigue:5,pain:'Hombro derecho'}};state.meals=[{date:'2026-10-12',kcal:600,protein:40}];state.trainingDrafts={test:{values:{weight:999}}};const before=structuredClone(state),text=generateSummary(state,'weekly','2026-10-15');assert.match(text,/1 previas, 1 efectivas/);assert.match(text,/40 kg × 8 reps × RPE 9/);assert.match(text,/descanso real: 180 s/);assert.match(text,/no registrado/);assert.match(text,/kg por mano/);assert.match(text,/Hombro derecho/);assert.match(text,/600 kcal y 40 g/);assert.match(text,/Sin evaluación/);assert.ok(text.endsWith(SUMMARY_REQUEST));assert.ok(!text.includes('999'));assert.deepEqual(state,before);
});
