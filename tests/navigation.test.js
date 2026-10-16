import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {sessionNeighbors,shiftWeek,swipeDirection,incompleteSession} from '../src/navigation.js';
test('navegación limitada a sesiones de la semana, con descanso y calendario personalizado',()=>{
 const data=initialState();assert.deepEqual(sessionNeighbors(data,'2026-10-13'),{previous:'2026-10-12',next:'2026-10-15'});
 assert.equal(sessionNeighbors(data,'2026-10-12').previous,null);assert.equal(sessionNeighbors(data,'2026-10-17').next,null);
 assert.equal(sessionNeighbors(data,'2026-10-14').next,'2026-10-15');
 data.calendar['2026-10-15']={type:'rest',routineDay:3};assert.equal(sessionNeighbors(data,'2026-10-13').next,'2026-10-16');
 assert.equal(shiftWeek('2026-01-03'),'2025-12-27');
});
test('gestos filtran movimiento corto, vertical o demasiado lento',()=>{
 const start={x:100,y:100,time:0};assert.equal(swipeDirection(start,{x:20,y:105,time:300}),'left');assert.equal(swipeDirection(start,{x:185,y:108,time:300}),'right');
 for(const end of [{x:120,y:100,time:200},{x:180,y:200,time:200},{x:0,y:100,time:1000}])assert.equal(swipeDirection(start,end),null);
});
test('borradores y sesiones incompletas avisan, los borradores no cuentan como series',()=>{
 const data=initialState(),date='2026-10-12';assert.equal(incompleteSession(data,date,{}),false);
 assert.equal(incompleteSession(data,date,{a:{date,values:{weight:'80'}}}),true);assert.equal(data.logs.length,0);
 assert.equal(incompleteSession(data,date,{a:{date:'2026-10-13',values:{weight:'80'}}}),false);
 data.sessionMeta={[date]:{startedAt:'2026-10-12T10:00Z'}};assert.equal(incompleteSession(data,date,{}),true);
 data.sessionMeta[date].endedAt='2026-10-12T11:00Z';assert.equal(incompleteSession(data,date,{}),false);
});
