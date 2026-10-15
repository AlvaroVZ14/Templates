import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, migrateState } from '../src/domain.js';
import { INITIAL_MEASUREMENT, measurementRatios, measurementReminder, measurementStats, migrateMeasurements, previousMonth, validateMeasurement, waistWarning } from '../src/measurements.js';

const record = (date, values) => ({ id: date, date, values });
test('carga inicial exacta una vez y conserva datos de diario y entrenamiento',()=>{
  const state=initialState();
  assert.deepEqual(state.measurements,[INITIAL_MEASUREMENT]);
  assert.deepEqual(state.measurements[0].values,{biceps:35,forearm:31.5,waist:70,chest:100,thigh:59,calf:35.2});
  assert.equal(migrateState(state),state);
  const legacy={...state,schemaVersion:3,journal:{'2026-10-15':{weight:72}}}; delete legacy.measurements;
  const next=migrateMeasurements(legacy);
  assert.deepEqual(next.journal,legacy.journal); assert.deepEqual(next.routine,legacy.routine);
  assert.equal(next.measurements.length,1); assert.equal(migrateMeasurements(next),next);
});
test('cambios usan anterior e inicial de cada medida, sin mezclar parciales',()=>{
  const records=[structuredClone(INITIAL_MEASUREMENT),record('2026-10-29',{biceps:36,waist:70.5}),record('2026-11-12',{biceps:36.5,waist:71.5})];
  const biceps=measurementStats(records,'2026-11-12')[0];
  assert.equal(biceps.previousChange,.5); assert.equal(biceps.initialChange,1.5);
  const forearm=measurementStats(records,'2026-11-12')[1];
  assert.equal(forearm.value,31.5); assert.equal(forearm.previousChange,null);
  assert.equal(measurementStats(records,'2026-10-01')[0].value,null);
  const ratios=measurementRatios(records,'2026-11-12');
  assert.equal(ratios[0].value,100/70); assert.equal(ratios[0].date,'2026-10-15');
  assert.equal(ratios[1].value,35/35.2);
});
test('recordatorio quincenal conserva jueves incluso si se registra tarde',()=>{
  const records=[structuredClone(INITIAL_MEASUREMENT)];
  assert.deepEqual(measurementReminder(records,'2026-10-15'),{due:false,date:'2026-10-29'});
  assert.deepEqual(measurementReminder(records,'2026-10-29'),{due:true,date:'2026-10-29'});
  const partial=[...records,record('2026-10-30',{biceps:36})];
  assert.equal(measurementReminder(partial,'2026-10-30').due,true);
  const completed=[...records,record('2026-10-30',{...INITIAL_MEASUREMENT.values,biceps:36})];
  assert.deepEqual(measurementReminder(completed,'2026-10-30'),{due:false,date:'2026-11-12'});
  assert.deepEqual(measurementReminder(completed,'2026-11-13'),{due:true,date:'2026-11-12'});
});
test('aviso cintura exige más de 1 cm dentro del mes y no extrapola meses vacíos',()=>{
  const baseline=structuredClone(INITIAL_MEASUREMENT);
  assert.equal(waistWarning([baseline,record('2026-11-15',{waist:71})],'2026-11-15'),null);
  assert.ok(waistWarning([baseline,record('2026-11-15',{waist:71.1})],'2026-11-15'));
  assert.equal(waistWarning([baseline,record('2026-12-15',{waist:72})],'2026-12-15'),null);
  assert.equal(waistWarning([baseline,record('2026-11-15',{waist:72})],'2027-01-15'),null);
  assert.equal(previousMonth('2027-03-31'),'2027-02-28'); assert.equal(previousMonth('2028-03-31'),'2028-02-29');
});
test('acepta medidas parciales válidas y rechaza ceros o fechas inexistentes',()=>{
  const values={biceps:35,forearm:null,waist:null,chest:null,thigh:null,calf:null};
  assert.equal(validateMeasurement(record('2026-10-15',values)),null);
  assert.ok(validateMeasurement(record('2026-02-30',values)));
  assert.ok(validateMeasurement(record('2026-10-15',{...values,biceps:0})));
});
