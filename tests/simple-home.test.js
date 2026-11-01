import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {weeklySessions} from '../src/simpleHome.js';
test('home counts only completed planned sessions in the Monday week, no prep or technique volume',()=>{
 const state=initialState(),date='2026-11-03';assert.deepEqual(weeklySessions(state,date),{planned:5,done:0});
 state.logs=[{id:'a',date,exerciseId:state.routine[1][0].id,kind:'approach'}];state.sessionMeta={[date]:{endedAt:'2026-11-03T19:00:00Z'}};assert.equal(weeklySessions(state,date).done,0);
 state.logs.push({...state.logs[0],id:'b',kind:'effective'});assert.equal(weeklySessions(state,date).done,1);assert.equal(weeklySessions(state,'2026-11-10').done,0);
});
test('home respects edited rest days, deload sets, and completion without an explicit finish',()=>{
 const state=initialState(),date='2026-11-03';state.routine[6]=[];assert.equal(weeklySessions(state,date).planned,4);
 state.deloads=[{startDate:date,endDate:date}];state.logs=state.routine[1].flatMap(ex=>Array.from({length:Math.ceil(ex.sets/2)},(_,i)=>({id:`${ex.id}-${i}`,date,exerciseId:ex.id,kind:'effective'})));
 assert.equal(weeklySessions(state,date).done,1);state.logs.pop();assert.equal(weeklySessions(state,date).done,0);
});
