import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {workoutSummary} from '../src/workoutSummary.js';
test('resumen deriva volumen, descansos medidos y mejora de última sesión sin modificar datos',()=>{
 const state=initialState(),ex=state.routine[1][0],base={profileId:ex.profileId,exerciseId:ex.id,exerciseName:ex.name,equipment:ex.equipment,muscle:ex.muscle};
 state.logs=[{...base,id:'past',date:'2026-10-27',kind:'effective',weight:75,reps:8},{...base,id:'work',date:'2026-11-03',kind:'effective',weight:80,reps:8,restRealSeconds:150},{...base,id:'drop',date:'2026-11-03',kind:'drop',weight:50,reps:4,restRealSeconds:0},{...base,id:'prep',date:'2026-11-03',kind:'approach',weight:20,reps:10,restRealSeconds:600},{...base,id:'future',date:'2026-11-10',kind:'effective',weight:200,reps:8}];
 const before=structuredClone(state),report=workoutSummary(state,'2026-11-03');assert.equal(report.volumeKg,840);assert.equal(report.effectiveSets,1);assert.equal(report.averageRestSeconds,75);assert.equal(report.measuredRests,2);assert.equal(report.loadImprovements[0].previousWeight,75);assert.equal(report.loadImprovements[0].weight,80);assert.deepEqual(state,before);
});
test('resumen vacío y descansos ausentes no inventan ceros ni récords',()=>{
 const report=workoutSummary(initialState(),'2026-11-03');assert.equal(report.volumeKg,0);assert.equal(report.averageRestSeconds,null);assert.equal(report.measuredRests,0);assert.deepEqual(report.loadImprovements,[]);
});
