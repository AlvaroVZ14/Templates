import { shiftDate, validDate } from './wellness.js';

export const MEASURES = [
  { key: 'biceps', label: 'Bíceps en pose' },
  { key: 'forearm', label: 'Antebrazo' },
  { key: 'waist', label: 'Cintura' },
  { key: 'chest', label: 'Pecho' },
  { key: 'thigh', label: 'Muslo' },
  { key: 'calf', label: 'Pantorrilla' },
];
export const INITIAL_MEASUREMENT = {
  id: 'initial-2026-10-15', date: '2026-10-15', initial: true, conditions: null,
  values: { biceps: 35, forearm: 31.5, waist: 70, chest: 100, thigh: 59, calf: 35.2 },
};
export function migrateMeasurements(original) {
  if (original.schemaVersion >= 4) return original;
  return { ...original, schemaVersion: 4, measurements: original.measurements ?? [structuredClone(INITIAL_MEASUREMENT)] };
}
export function validateMeasurement(record) {
  if (!validDate(record.date)) return 'Elige una fecha válida.';
  if (!MEASURES.some(({ key }) => record.values[key] !== null)) return 'Ingresa al menos una medida en cm.';
  for (const { key, label } of MEASURES) {
    const value = record.values[key];
    if (value !== null && (!Number.isFinite(value) || value <= 0 || value > 500)) return `${label}: ingresa una medida mayor que 0 y hasta 500 cm.`;
  }
  return null;
}
function observed(value) { return typeof value === 'number' && Number.isFinite(value) && value > 0; }
export function orderedMeasurements(records, asOf = '9999-12-31') { return records.filter(record => record.date <= asOf).toSorted((a,b) => a.date.localeCompare(b.date)); }
export function measurementStats(records, asOf) {
  const ordered = orderedMeasurements(records, asOf);
  const initial = records.find(record => record.initial) ?? ordered[0];
  return MEASURES.map(measure => {
    const points = ordered.filter(record => observed(record.values[measure.key]));
    const current = points.at(-1), previous = points.at(-2), baseline = initial?.values[measure.key];
    const value = current?.values[measure.key] ?? null;
    return { ...measure, date: current?.date ?? null, value, previousChange: previous ? value - previous.values[measure.key] : null, initialChange: value !== null && observed(baseline) ? value - baseline : null };
  });
}
export function measurementRatios(records, asOf) {
  const ordered = orderedMeasurements(records, asOf);
  return [['chest','waist','Pecho / cintura'],['biceps','calf','Bíceps / pantorrilla']].map(([numerator, denominator, label]) => {
    const record = ordered.findLast(item => observed(item.values[numerator]) && observed(item.values[denominator]));
    return { label, date: record?.date ?? null, value: record ? record.values[numerator] / record.values[denominator] : null };
  });
}
export function measurementReminder(records, asOf) {
  const anchor = records.find(record => record.initial)?.date ?? records.map(record=>record.date).sort()[0];
  if(!anchor)return {due:true,date:asOf};
  const days = Math.floor((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${anchor}T00:00:00Z`)) / 86400000);
  if (days < 14) return { due: false, date: shiftDate(anchor,14) };
  const cycle = Math.floor(days / 14), scheduled = shiftDate(anchor, cycle * 14);
  const completed = records.some(record => record.date >= scheduled && record.date <= asOf && MEASURES.every(({key}) => observed(record.values[key])));
  return { due: !completed, date: completed ? shiftDate(scheduled,14) : scheduled };
}
export function previousMonth(date) {
  const value = new Date(`${date}T12:00:00Z`), day = value.getUTCDate();
  value.setUTCDate(1); value.setUTCMonth(value.getUTCMonth() - 1);
  const last = new Date(Date.UTC(value.getUTCFullYear(),value.getUTCMonth()+1,0)).getUTCDate();
  value.setUTCDate(Math.min(day,last));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth()+1).padStart(2,'0')}-${String(value.getUTCDate()).padStart(2,'0')}`;
}
export function waistWarning(records, asOf) {
  const waist = orderedMeasurements(records,asOf).filter(record => observed(record.values.waist)), latest = waist.at(-1);
  if (!latest || latest.date < previousMonth(asOf)) return null;
  const first = waist.find(record => record.date >= previousMonth(latest.date) && record.date < latest.date);
  if (!first) return null;
  const difference = latest.values.waist - first.values.waist;
  return difference > 1 + 1e-9 ? { difference, from: first.date, to: latest.date } : null;
}
