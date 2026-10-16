import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {nextTraining,restMessage,sessionName,weekdayName} from '../src/calendarText.js';
import {shiftDate} from '../src/wellness.js';
test('miércoles vuelve jueves y domingo vuelve lunes, con nombre y mañana',()=>{
  const state=initialState(),wed=restMessage(state,'2026-10-14','2026-10-14'),sun=restMessage(state,'2026-10-18','2026-10-18');
  assert.equal(wed.title,'Hoy toca descansar.');assert.equal(wed.next.date,'2026-10-15');assert.match(wed.text,/mañana \(jueves\): Hombro \+ Brazo/);
  assert.equal(sun.next.date,'2026-10-19');assert.match(sun.text,/mañana \(lunes\): Pecho \+ Hombro \+ Bíceps/);
});
test('títulos dependen de la fecha vista real, incluyendo mañana y cambio de año',()=>{
  const state=initialState();assert.equal(restMessage(state,'2026-10-14','2026-10-16').title,'Este día es de descanso.');assert.equal(restMessage(state,'2026-10-18','2026-10-17').title,'Mañana toca descansar.');assert.equal(restMessage(state,'2027-01-01','2026-12-31').title,'Mañana toca descansar.');
});
test('editor y calendario: sesiones movidas, descansos consecutivos y semanas completas omitidas',()=>{
  const state=initialState();state.routine[3]=[];assert.equal(nextTraining(state,'2026-10-14').date,'2026-10-16');assert.match(restMessage(state,'2026-10-14','2026-10-14').text,/el viernes: Pierna/);
  state.calendar['2026-10-15']={type:'weights',routineDay:0};assert.equal(nextTraining(state,'2026-10-14').name,'Pecho + Hombro + Bíceps');
  for(let i=1;i<=25;i++)state.calendar[shiftDate('2026-10-14',i)]={type:'rest'};
  assert.equal(nextTraining(state,'2026-10-14').date,'2026-11-09');
});
test('rutina vacía, una sesión semanal y fecha excepcional lejana, sin bucles ni datos escritos',()=>{
  const state=initialState(),before=structuredClone(state);nextTraining(state,'2026-10-18');assert.deepEqual(state,before);
  state.routine=state.routine.map((list,index)=>index===0?list:[]);state.calendar['2099-12-31']={type:'rest'};assert.equal(nextTraining(state,'2026-10-19').date,'2026-10-26');
  state.routine=state.routine.map(()=>[]);assert.equal(nextTraining(state,'2026-10-18'),null);assert.match(restMessage(state,'2026-10-18','2026-10-16').text,/No hay una próxima sesión/);
  assert.equal(sessionName([{muscle:'Pecho'}]),'Pecho');assert.equal(weekdayName('2027-01-01'),'viernes');
});
