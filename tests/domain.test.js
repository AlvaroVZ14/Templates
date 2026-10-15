import test from 'node:test';
import assert from 'node:assert/strict';
import { DAYS, TARGETS, INCREMENTS, dayIndex, initialState, localDate, removeLog, restFor, validateLog, validateRoutine, weekDates, weeklyVolume, preparationSuggestions, extensionSuggestions, migrateState, recordSet, exerciseHistory } from '../src/domain.js';

test('la rutina conserva orden, series y extensiones del encargo', () => {
  const state = initialState();
  assert.deepEqual(state.routine.map(day => day.map(ex => [ex.sets, ex.technique])), [
    [[2,''],[1,'drop'],[1,''],[1,''],[1,''],[2,'drop'],[1,'drop'],[2,'rp']],
    [[2,'drop'],[1,''],[1,''],[2,'drop'],[2,'drop'],[2,''],[1,'rp']], [],
    [[2,''],[1,'drop'],[1,'drop'],[1,'rp'],[1,''],[2,''],[2,'drop']],
    [[2,'drop'],[2,''],[2,'drop'],[1,'rp'],[2,'rp'],[1,''],[1,'drop']],
    [[2,''],[1,'drop'],[1,''],[1,''],[1,'drop'],[2,'rp'],[2,'drop']], [],
  ]);
  assert.deepEqual(state.targets, TARGETS);
  assert.equal(DAYS.length, 7);
  assert.ok(state.routine.flat().every(ex => !ex.forced && !ex.negative));
  assert.equal(new Set(state.routine.flat().map(ex => ex.id)).size, 36);
});
test('aproximaciones y descansos respetan equipo y primer músculo', () => {
  const state = initialState();
  for (const day of state.routine) {
    const seen = new Set();
    for (const ex of day) {
      assert.equal(ex.approaches, !seen.has(ex.muscle) || ex.compound ? 2 : 1);
      assert.equal(ex.increment, INCREMENTS[ex.equipment]);
      assert.equal(ex.rests.effective, ex.compound ? 210 : 150);
      assert.equal(ex.rests.warmup, 90); assert.equal(ex.rests.rp, 20); assert.equal(ex.rests.drop, 15);
      seen.add(ex.muscle);
    }
  }
  const ex = state.routine[0][0];
  assert.equal(restFor(ex, 'approach', 1), 90);
  assert.equal(restFor(ex, 'approach', 2), 210);
  assert.equal(restFor(ex, 'rp'), 20);
});

test('preparación de 1, 2 y 3 series usa los porcentajes y reps pedidos', () => {
  const ex = initialState().routine[0][0];
  const expected = { 1: [[60,8]], 2: [[50,10],[75,5]], 3: [[40,10],[60,6],[80,3]] };
  for (const approaches of [1,2,3]) assert.deepEqual(preparationSuggestions({ ...ex, approaches },100).map(row => [row.weight,row.reps]),expected[approaches]);
  assert.deepEqual(preparationSuggestions(ex,null),[]);
  assert.deepEqual(preparationSuggestions(ex,0).map(row => row.weight),[0,0]);
});

test('redondea por equipo, drop encadena caídas y RP conserva el peso exacto', () => {
  const ex = initialState().routine[0][0];
  assert.equal(preparationSuggestions({ ...ex, approaches: 1 },62.5)[0].weight,37.5);
  assert.equal(preparationSuggestions({ ...ex, approaches: 1, increment: 1 },23)[0].weight,14);
  assert.equal(preparationSuggestions({ ...ex, approaches: 1, increment: 5 },62.5)[0].weight,40);
  assert.deepEqual(extensionSuggestions({ ...ex, dropCount:3 },100,'drop').map(row => row.weight),[80,65,52.5]);
  assert.deepEqual(extensionSuggestions({ ...ex, dropCount:3 },100,'drop',[{kind:'drop',step:1,weight:70}]).map(row => row.weight),[80,55,45]);
  assert.deepEqual(extensionSuggestions(ex,23,'rp').map(row => [row.weight,row.reps]),[[23,4],[23,4]]);
});

test('migración conserva historial y recupera peso sin inventar RPE antiguos', () => {
  const original = initialState();
  original.schemaVersion = 1; delete original.profiles; delete original.cardio; delete original.dailySteps;
  const ex = original.routine[0][0]; ex.equipment='free';
  original.logs=[{id:'old',exerciseId:ex.id,date:'2026-10-12',kind:'effective',weight:82.5,reps:7,failure:true,createdAt:'2026-10-12T12:00:00Z'}];
  const migrated=migrateState(original);
  assert.equal(original.schemaVersion,1); assert.equal(migrated.schemaVersion,3);
  assert.equal(migrated.logs[0].weight,82.5); assert.equal(migrated.logs[0].rpe,null);
  assert.equal(migrated.profiles[migrated.routine[0][0].profileId].workWeight,82.5);
  assert.equal(migrateState(migrated),migrated);
});

test('efectiva actualiza peso compartido e inicia descanso para la técnica', () => {
  const state=initialState(), ex=state.routine[0][7];
  const log={id:'work',exerciseId:ex.id,profileId:ex.profileId,date:'2026-10-12',kind:'effective',weight:21,reps:8,rpe:10,failure:true,createdAt:new Date().toISOString()};
  const next=recordSet(state,ex,log);
  assert.equal(next.profiles[ex.profileId].workWeight,21); assert.equal(next.timer.duration,20);
  assert.equal(state.logs.length,0); assert.equal(exerciseHistory(next,ex).length,1);
  assert.ok(validateLog({...log,rpe:11},ex,[]));
  assert.equal(state.routine[0][2].profileId,state.routine[5][0].profileId);
});
test('semana local lunes a domingo, incluso en cambio de año', () => {
  assert.equal(dayIndex('2026-10-18'), 6);
  assert.deepEqual(weekDates('2027-01-01'), ['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']);
  assert.equal(localDate(new Date(2026, 9, 15, 23, 59)), '2026-10-15');
});
test('volumen cuenta solo efectivas de la semana; conserva metas independientes', () => {
  const state = initialState();
  state.logs = ['warmup', 'approach', 'effective', 'drop', 'rp', 'forced', 'negative'].map((kind, i) => ({ id: String(i), kind, date: '2026-10-12', muscle: 'Pecho' }));
  state.logs.push({ kind: 'effective', date: '2026-10-19', muscle: 'Pecho' });
  const rows = weeklyVolume(state, '2026-10-15');
  assert.equal(rows[0].done, 1); assert.equal(rows[0].planned, 9); assert.equal(rows[0].target, 8);
  assert.deepEqual(rows.map(row => row.planned), [9, 9, 8, 8, 7, 6, 3, 1, 2]);
});
test('técnicas opcionales y extensiones requieren habilitación y padre del mismo día', () => {
  const ex = initialState().routine[0][0];
  const base = { kind: 'effective', date: '2026-10-12', weight: 60, reps: 8, exerciseId: ex.id };
  assert.equal(validateLog(base, ex, []), null);
  assert.ok(validateLog({ ...base, reps: 1.5 }, ex, []));
  assert.ok(validateLog({ ...base, weight: -1 }, ex, []));
  assert.ok(validateLog({ ...base, kind: 'forced' }, ex, []));
  assert.ok(validateLog({ ...base, kind: 'drop' }, ex, []));
  const parent = { ...base, id: 'effective-1' };
  assert.equal(validateLog({ ...base, kind: 'rp', parentId: parent.id }, ex, [parent]), null);
  assert.ok(validateLog({ ...base, kind: 'rp', parentId: parent.id, date: '2026-10-13' }, ex, [parent]));
  assert.equal(validateLog({ ...base, kind: 'forced', parentId: parent.id }, { ...ex, forced: true }, [parent]), null);
});
test('eliminar efectiva elimina también sus extensiones', () => {
  assert.deepEqual(removeLog([{ id: 'a' }, { id: 'b', parentId: 'a' }, { id: 'c' }], 'a'), [{ id: 'c' }]);
});

test('el editor rechaza valores inválidos incluso en ejercicios colapsados', () => {
  const state = initialState();
  assert.equal(validateRoutine(state.routine), null);
  const ex = state.routine[0][0];
  ex.sets = 0; assert.ok(validateRoutine(state.routine));
  ex.sets = 2; ex.approaches = 4; assert.ok(validateRoutine(state.routine));
  ex.approaches = 3; ex.rests.effective = 1.5; assert.ok(validateRoutine(state.routine));
});
