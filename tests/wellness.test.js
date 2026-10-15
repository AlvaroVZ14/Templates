import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, migrateState, weekDates } from '../src/domain.js';
import { migrateDiary, optionalNumber, shiftDate, sleepWarning, validateJournal, validateMeal, weightWeek } from '../src/wellness.js';

test('diario migra sin perder entrenamiento, con meta 8 y favoritos sin macros inventados', () => {
  const state = initialState();
  assert.equal(state.settings.sleepGoal, 8);
  assert.deepEqual(state.favorites.map(item => item.name), ['Pan con huevo', 'Pollo con arroz', 'Snack']);
  assert.ok(state.favorites.every(item => item.kcal === null && item.protein === null));
  const old = { ...state, schemaVersion: 2 }; delete old.journal; delete old.settings;
  const next = migrateState(old);
  assert.deepEqual(next.logs, old.logs); assert.deepEqual(next.routine, old.routine);
  assert.equal(migrateDiary(next), next);
});
test('aviso exige dos noches consecutivas, menos de 7 y registro reciente', () => {
  const journal = { '2026-10-14': { sleepHours: 6 }, '2026-10-15': { sleepHours: 6.9 } };
  assert.ok(sleepWarning(journal, '2026-10-15')); assert.ok(sleepWarning(journal, '2026-10-16'));
  assert.equal(sleepWarning(journal, '2026-10-17'), null);
  assert.equal(sleepWarning({ ...journal, '2026-10-15': { sleepHours: 7 } }, '2026-10-15'), null);
  assert.equal(sleepWarning({ '2026-10-13': { sleepHours: 6 }, '2026-10-15': { sleepHours: 6 } }, '2026-10-15'), null);
  assert.equal(sleepWarning({ '2026-10-15': { sleepHours: null } }, '2026-10-15'), null);
});
test('promedio móvil usa 7 días calendario, arrastra semana previa y no inventa ceros', () => {
  const journal = Object.fromEntries(Array.from({length:8},(_,i)=>[shiftDate('2026-10-11',i),{weight:70+i}]));
  const rows=weightWeek(journal,weekDates('2026-10-15'));
  assert.equal(rows[0].average,70.5); assert.equal(rows[0].count,2);
  assert.equal(rows[5].average,73); assert.equal(rows[5].count,7);
  assert.equal(rows[6].average,74); assert.equal(rows[6].count,7);
  const sparse=weightWeek({'2026-10-12':{weight:80},'2026-10-14':{weight:82}},weekDates('2026-10-15'));
  assert.equal(sparse[1].weight,null); assert.equal(sparse[2].average,81); assert.equal(sparse[2].count,2);
});
test('valida escalas y distingue campo vacío de cero', () => {
  const entry={weight:null,sleepHours:0,sleepQuality:null,energy:null,fatigue:null,stress:null,pain:''};
  assert.equal(validateJournal(entry),null); assert.ok(validateJournal({...entry,energy:11}));
  assert.ok(validateJournal({...entry,stress:1.5})); assert.ok(validateJournal({...entry,sleepQuality:0}));
  assert.equal(optionalNumber(''),null); assert.equal(optionalNumber('0'),0);
  assert.ok(validateMeal({name:'Snack',kcal:null,protein:null}));
  assert.equal(validateMeal({name:'Snack',kcal:120,protein:9}),null);
});
