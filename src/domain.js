import { migrateDiary } from './wellness.js';
import { migrateMeasurements } from './measurements.js';
import { chileDate, migrateProgram } from './program/state.js';
import { migrateTraining, sessionExercise, trainingLogError } from './training.js';
import { migratePreparation, PREPARATION_STEPS } from './preparation.js';
import {classifyExercise,migrateClassification} from './classification.js';
import {migrateFruit} from './program/fruit.js';
import {dayContext} from './program/nutrition.js';

export const MUSCLES = ['Pecho', 'Espalda', 'Hombro', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Femoral', 'Aductor', 'Gemelo'];
export const TARGETS = { Pecho: 8, Espalda: 9, Hombro: 8, Bíceps: 8, Tríceps: 6, Cuádriceps: 6, Femoral: 4, Aductor: 1, Gemelo: 1 };
export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const KINDS = { warmup: 'Calentamiento', approach: 'Aproximación', effective: 'Efectiva', drop: 'Drop set', rp: 'Rest-pause', forced: 'Forzadas', negative: 'Negativas' };
export const EXTENSIONS = ['drop', 'rp', 'forced', 'negative'];
export const PREPARATION = PREPARATION_STEPS;
export const EQUIPMENT = { barbell: 'Barra', dumbbell: 'Mancuernas (por mano)', machine: 'Máquina', cable: 'Polea' };
export const INCREMENTS = { barbell: 2.5, dumbbell: 1, machine: 5, cable: 5 };
export function inferEquipment(ex) {
  if (ex.equipment !== 'free') return ex.equipment;
  return /mancuerna|elevaciones laterales/i.test(ex.name) ? 'dumbbell' : 'barbell';
}
export function defaultPreparation(ex, first) { return first || ex.compound ? 2 : 1; }
function profileKey(ex) { return `${ex.name.trim().toLocaleLowerCase('es')}:${inferEquipment(ex)}`; }
export function roundWeight(weight, increment) { return Number((Math.max(0, Math.round(weight / increment)) * increment).toFixed(3)); }
export function preparationSuggestions(ex, weight) {
  if (weight === null || !Number.isFinite(weight)) return [];
  const cap=Number((Math.floor((weight*.8+1e-8)/ex.increment)*ex.increment).toFixed(3));
  return (ex.preparationSteps??PREPARATION[ex.approaches]??[]).map((step, index) => ({ kind:'approach',step:index+1,weight:Math.min(roundWeight(weight*step.percent/100,ex.increment),cap),reps:step.reps,percent:step.percent,repRange:step.repRange }));
}
export function extensionSuggestions(ex, weight, kind = ex.technique, logs = []) {
  if (weight === null || !Number.isFinite(weight) || !['drop', 'rp'].includes(kind)) return [];
  const count = kind === 'drop' ? ex.dropCount : ex.rpCount;
  let previous = weight;
  return Array.from({ length: count }, (_, index) => {
    const suggestion = { kind, step: index + 1, weight: kind === 'drop' ? roundWeight(previous * 0.8, ex.increment) : weight, reps: kind === 'rp' ? 4 : null };
    previous = logs.find(log => log.kind === kind && log.step === index + 1)?.weight ?? suggestion.weight;
    return suggestion;
  });
}
export function exerciseHistory(state, exercise) {
  return state.logs.filter(log => (log.profileId ?? log.exerciseId) === exercise.profileId).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}
export function migrateState(original) {
  if (original.schemaVersion >= 2) return migrateFruit(migrateClassification(migratePreparation(migrateTraining(migrateProgram(migrateMeasurements(migrateDiary(original)))))));
  const state = structuredClone(original);
  state.profiles ??= {}; state.cardio ??= []; state.dailySteps ??= {};
  for (const day of state.routine) {
    const seen = new Set();
    for (const ex of day) {
      ex.equipment = inferEquipment(ex);
      ex.profileId = profileKey(ex);
      ex.increment = INCREMENTS[ex.equipment];
      ex.approaches = defaultPreparation(ex, !seen.has(ex.muscle));
      ex.dropCount ??= 1; ex.rpCount ??= 2;
      state.profiles[ex.profileId] ??= { workWeight: null, targetReps: 8, notes: '' };
      for (const log of state.logs.filter(log => log.exerciseId === ex.id)) { log.profileId ??= ex.profileId; log.equipment ??= ex.equipment; log.rpe ??= null; }
      seen.add(ex.muscle);
    }
  }
  for (const [id, profile] of Object.entries(state.profiles)) {
    const last = state.logs.filter(log => log.profileId === id && log.kind === 'effective').sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1);
    if (last && profile.workWeight === null) profile.workWeight = last.weight;
  }
  state.schemaVersion = 2;
  return migrateFruit(migrateClassification(migratePreparation(migrateTraining(migrateProgram(migrateMeasurements(migrateDiary(state)))))));
}

export function localDate(date = new Date()) {
  return chileDate(date);
}
export function dayIndex(date) { return (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7; }
export function weekDates(date) {
  const start = new Date(`${date}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - dayIndex(date));
  return DAYS.map((_, i) => { const d = new Date(start); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0,10); });
}
export function makeExercise(name = 'Nuevo ejercicio', muscle = 'Pecho', sets = 1, technique = '', equipment = 'barbell', compound = false, approaches = 1) {
  const id = crypto.randomUUID();
  return { id, profileId: id, name, muscle, sets, technique, equipment, compound, ...classifyExercise({name,compound}), approaches, preparationOverride:null, preparationJoint:'', increment: INCREMENTS[equipment] ?? 2.5, dropCount: 1, rpCount: 2, forced: false, negative: false, rests: { warmup: 90, effective: compound ? 210 : 150, rp: 20, drop: 15 } };
}
export function initialState() {
  const ex = (name, muscle, sets = 1, technique = '', equipment = 'free', compound = false, approaches = 1) => makeExercise(name, muscle, sets, technique, equipment, compound, approaches);
  return migrateState({
    schemaVersion: 1,
    targets: { ...TARGETS },
    logs: [], timer: null,
    routine: [
      [ex('Press banca', 'Pecho', 2, '', 'free', true, 3), ex('Press declinado', 'Pecho', 1, 'drop', 'free', true), ex('Press inclinado mancuernas', 'Pecho', 1, '', 'free', true), ex('Aperturas mancuernas', 'Pecho', 1), ex('Aperturas máquina', 'Pecho', 1, '', 'machine'), ex('Elevaciones laterales', 'Hombro', 2, 'drop', 'free', false, 3), ex('Curl polea', 'Bíceps', 1, 'drop', 'cable', false, 1), ex('Curl mancuernas sentado', 'Bíceps', 2, 'rp')],
      [ex('Ext. tríceps tras nuca', 'Tríceps', 2, 'drop', 'cable', false, 1), ex('Ext. tríceps', 'Tríceps', 1, '', 'cable'), ex('Pullover polea', 'Espalda', 1, '', 'cable', false, 1), ex('Remo pecho apoyado', 'Espalda', 2, 'drop', 'machine', true), ex('Jalón agarre estrecho', 'Espalda', 2, 'drop', 'cable', true), ex('Remo barra libre', 'Espalda', 2, '', 'free', true), ex('Sóleo máquina', 'Gemelo', 1, 'rp', 'machine', false, 1)],
      [],
      [ex('Press militar mancuernas', 'Hombro', 2, '', 'free', true, 3), ex('Elevaciones laterales polea', 'Hombro', 1, 'drop', 'cable'), ex('Ext. tríceps tras nuca', 'Tríceps', 1, 'drop', 'cable', false, 1), ex('Curl polea', 'Bíceps', 1, 'rp', 'cable', false, 1), ex('Ext. tríceps', 'Tríceps', 1, '', 'cable'), ex('Curl mancuernas', 'Bíceps', 2), ex('Posterior peck deck', 'Hombro', 2, 'drop', 'machine')],
      [ex('Ext. cuádriceps', 'Cuádriceps', 2, 'drop', 'machine', false, 1), ex('Hack squat', 'Cuádriceps', 2, '', 'machine', true), ex('Prensa', 'Cuádriceps', 2, 'drop', 'machine', true), ex('Gemelos prensa', 'Gemelo', 1, 'rp', 'machine', false, 1), ex('Femoral acostado', 'Femoral', 2, 'rp', 'machine', false, 1), ex('Hiperextensiones', 'Femoral', 1, '', 'free'), ex('Aductor', 'Aductor', 1, 'drop', 'machine', false, 1)],
      [ex('Press inclinado mancuernas', 'Pecho', 2, '', 'free', true, 3), ex('Jalón estrecho', 'Espalda', 1, 'drop', 'cable', true, 1), ex('Remo barra', 'Espalda', 1, '', 'free', true), ex('Aperturas polea', 'Pecho', 1, '', 'cable'), ex('Elevaciones laterales polea', 'Hombro', 1, 'drop', 'cable', false, 1), ex('Curl polea', 'Bíceps', 2, 'rp', 'cable', false, 1), ex('Ext. tríceps tras nuca', 'Tríceps', 2, 'drop', 'cable', false, 1)],
      [],
    ],
  });
}
export function weeklyVolume(state, date) {
  const dates = weekDates(date);
  return MUSCLES.map(muscle => ({
    muscle, target: state.targets[muscle],
    planned: dates.flatMap(day=>dayContext(state,day).exercises.map(ex=>sessionExercise(state,ex,day))).filter(ex => ex.muscle === muscle).reduce((sum, ex) => sum + ex.sets, 0),
    done: state.logs.filter(log => log.muscle === muscle && log.kind === 'effective' && dates.includes(log.date)).length,
  }));
}
export function validateLog(log, exercise, logs) {
  if(log.restRealSeconds!=null&&(!Number.isInteger(log.restRealSeconds)||log.restRealSeconds<0||log.restRealSeconds>86400))return 'El descanso real debe ser de 0 a 86400 segundos, o quedar sin dato.';
  if (!Number.isFinite(log.weight) || log.weight < 0 || log.weight > 1500) return 'Ingresa una carga entre 0 y 1500 kg.';
  if (!Number.isInteger(log.reps) || log.reps < 1 || log.reps > 200) return 'Ingresa entre 1 y 200 repeticiones completas.';
  if (log.rpe !== undefined && (!Number.isFinite(log.rpe) || log.rpe < 0 || log.rpe > 10)) return 'El RPE debe estar entre 0 y 10.';
  if (!Object.hasOwn(KINDS, log.kind)) return 'Tipo de serie no válido.';
  if (['forced', 'negative'].includes(log.kind) && !exercise[log.kind]) return 'Activa esta técnica en el editor del ejercicio.';
  if (EXTENSIONS.includes(log.kind) && !logs.some(parent => parent.id === log.parentId && parent.kind === 'effective' && parent.exerciseId === exercise.id && parent.date === log.date)) return 'Registra primero una serie efectiva para vincular la extensión.';
  return null;
}
export function removeLog(logs, id) { return logs.filter(log => log.id !== id && log.parentId !== id); }
export function validateRoutine(routine) {
  for (const ex of routine.flat()) {
    if (!ex.name.trim()) return 'Escribe un nombre para cada ejercicio.';
    if (!Number.isInteger(ex.sets) || ex.sets < 1 || ex.sets > 20) return 'Cada ejercicio debe tener entre 1 y 20 series efectivas.';
    if (!Number.isInteger(ex.approaches) || ex.approaches < 0 || ex.approaches > 3 || ex.preparationOverride!=null&&(!Number.isInteger(ex.preparationOverride)||ex.preparationOverride<0||ex.preparationOverride>3)) return 'Elige entre 0 y 3 series previas por ejercicio.';
    if (!Number.isFinite(ex.increment) || ex.increment <= 0 || ex.increment > 100) return 'El redondeo debe ser mayor que 0 y hasta 100 kg.';
    if (!Number.isInteger(ex.dropCount) || ex.dropCount < 1 || ex.dropCount > 3) return 'Elige entre 1 y 3 caídas de drop set.';
    if (!Number.isInteger(ex.rpCount) || ex.rpCount < 1 || ex.rpCount > 10) return 'Elige entre 1 y 10 mini-series de rest-pause.';
    if (Object.values(ex.rests).some(value => !Number.isInteger(value) || value < 1 || value > 900)) return 'Los descansos deben ser de 1 a 900 segundos completos.';
  }
  return null;
}
export function restFor(ex, kind, approachCount = 0) {
  if (['drop', 'rp'].includes(kind)) return ex.rests[kind];
  if (kind === 'warmup' || (kind === 'approach' && approachCount < ex.approaches)) return ex.rests.warmup;
  return ex.rests.effective;
}
export function recordSet(state, exercise, log) {
  exercise = sessionExercise(state,exercise,log.date);
  const invalid = validateLog(log, exercise, state.logs);
  if (invalid) throw new Error(invalid);
  const trainingError = trainingLogError(state,exercise,log);
  if (trainingError) throw new Error(trainingError);
  log = {...log,exerciseNotes:log.exerciseNotes??state.profiles[exercise.profileId]?.notes??'',...(['warmup','approach'].includes(log.kind)?{referenceWeight:state.profiles[exercise.profileId]?.workWeight}:{}),deload:exercise.deload,techniqueIntroduced:['drop','rp'].includes(log.kind)&&exercise.technique!==log.kind,performedAt:log.date===chileDate()?new Date().toISOString():null};
  const next = { ...state, logs: [...state.logs, log] };
  if (log.kind === 'effective' && !exercise.deload) next.profiles = { ...state.profiles, [exercise.profileId]: { workWeight: null, targetReps: 8, notes: '', ...state.profiles[exercise.profileId], workWeight: log.weight } };
  const prepared = next.logs.filter(item => item.exerciseId === exercise.id && item.date === log.date && item.kind === 'approach').length;
  const seconds = log.kind === 'effective' && exercise.technique ? exercise.rests[exercise.technique] : restFor(exercise, log.kind, prepared);
  next.timer = { end: Date.now() + seconds * 1000, duration: seconds, label: exercise.name };
  return next;
}
export function formatSeconds(seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
