export const MUSCLES = ['Pecho', 'Espalda', 'Hombro', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Femoral', 'Aductor', 'Gemelo'];
export const TARGETS = { Pecho: 8, Espalda: 9, Hombro: 8, Bíceps: 8, Tríceps: 6, Cuádriceps: 6, Femoral: 4, Aductor: 1, Gemelo: 1 };
export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const TITLES = ['Pecho, hombro y bíceps', 'Espalda y tríceps', 'Día de descanso', 'Hombro y brazo', 'Pierna', 'Torso', 'Día de descanso'];
export const KINDS = { warmup: 'Calentamiento', approach: 'Aproximación', effective: 'Efectiva', drop: 'Drop set', rp: 'Rest-pause', forced: 'Forzadas', negative: 'Negativas' };
export const EXTENSIONS = ['drop', 'rp', 'forced', 'negative'];
export const APPROACHES = [{ percent: 45, reps: 11, range: '40–50% × 10–12' }, { percent: 75, reps: 7, range: '70–80% × 6–8' }, { percent: 87.5, reps: 3, range: '85–90% × 2–3' }];

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dayIndex(date) { return (new Date(`${date}T12:00:00`).getDay() + 6) % 7; }
export function weekDates(date) {
  const start = new Date(`${date}T12:00:00`);
  start.setDate(start.getDate() - dayIndex(date));
  return DAYS.map((_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return localDate(d); });
}
export function makeExercise(name = 'Nuevo ejercicio', muscle = 'Pecho', sets = 1, technique = '', equipment = 'free', compound = false, approaches = 0) {
  return { id: crypto.randomUUID(), name, muscle, sets, technique, equipment, compound, approaches, forced: false, negative: false, rests: { warmup: 90, effective: compound ? 210 : 150, rp: 20, drop: 15 } };
}
export function initialState() {
  const ex = makeExercise;
  return {
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
  };
}
export function weeklyVolume(state, date) {
  const dates = weekDates(date);
  return MUSCLES.map(muscle => ({
    muscle, target: state.targets[muscle],
    planned: state.routine.flat().filter(ex => ex.muscle === muscle).reduce((sum, ex) => sum + ex.sets, 0),
    done: state.logs.filter(log => log.muscle === muscle && log.kind === 'effective' && dates.includes(log.date)).length,
  }));
}
export function validateLog(log, exercise, logs) {
  if (!Number.isFinite(log.weight) || log.weight < 0 || log.weight > 1500) return 'Ingresa una carga entre 0 y 1500 kg.';
  if (!Number.isInteger(log.reps) || log.reps < 1 || log.reps > 200) return 'Ingresa entre 1 y 200 repeticiones completas.';
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
    if (!Number.isInteger(ex.approaches) || ex.approaches < 0 || ex.approaches > 3) return 'Elige entre 0 y 3 aproximaciones por ejercicio.';
    if (Object.values(ex.rests).some(value => !Number.isInteger(value) || value < 1 || value > 900)) return 'Los descansos deben ser de 1 a 900 segundos completos.';
  }
  return null;
}
export function restFor(ex, kind, approachCount = 0) {
  if (['drop', 'rp'].includes(kind)) return ex.rests[kind];
  if (kind === 'warmup' || (kind === 'approach' && approachCount < ex.approaches)) return ex.rests.warmup;
  return ex.rests.effective;
}
export function formatSeconds(seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
