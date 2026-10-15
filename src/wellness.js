export const DEFAULT_FAVORITES = [
  { id: 'pan-huevo', name: 'Pan con huevo', kcal: null, protein: null },
  { id: 'pollo-arroz', name: 'Pollo con arroz', kcal: null, protein: null },
  { id: 'snack', name: 'Snack', kcal: null, protein: null },
];

export function migrateDiary(original) {
  if (original.schemaVersion >= 3) return original;
  return { ...original, schemaVersion: 3, journal: original.journal ?? {}, meals: original.meals ?? [], favorites: original.favorites ?? structuredClone(DEFAULT_FAVORITES), settings: { sleepGoal: 8, ...original.settings } };
}

export function shiftDate(date, days) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}
export function validDate(date) { return /^\d{4}-\d{2}-\d{2}$/.test(date) && shiftDate(date, 0) === date; }
export function optionalNumber(value) { return String(value).trim() === '' ? null : Number(value); }
export const JOURNAL_FIELDS = [
  { key: 'weight', label: 'Peso corporal (kg)', min: 1, max: 500, step: 0.1 },
  { key: 'sleepHours', label: 'Horas de sueño', min: 0, max: 24, step: 0.1 },
  { key: 'sleepQuality', label: 'Calidad de sueño (1–5)', min: 1, max: 5, step: 1 },
  { key: 'energy', label: 'Energía (1–10)', min: 1, max: 10, step: 1 },
  { key: 'fatigue', label: 'Fatiga (1–10)', min: 1, max: 10, step: 1 },
  { key: 'stress', label: 'Estrés (1–5)', min: 1, max: 5, step: 1 },
];
export function validateJournal(entry) {
  for (const { key, label, min, max, step } of JOURNAL_FIELDS) {
    const value = entry[key];
    if (value !== null && (!Number.isFinite(value) || value < min || value > max || (step === 1 && !Number.isInteger(value)))) return `${label}: usa un valor entre ${min} y ${max}.`;
  }
  if (entry.pain.length > 3000) return 'El dolor por zona admite hasta 3000 caracteres.';
  return null;
}
export function sleepWarning(journal, asOf) {
  const latest = Object.keys(journal).filter(date => date <= asOf && journal[date].sleepHours !== null && journal[date].sleepHours !== undefined).sort().at(-1);
  if (!latest || latest < shiftDate(asOf, -1)) return null;
  const previous = shiftDate(latest, -1);
  const first = journal[previous]?.sleepHours, second = journal[latest]?.sleepHours;
  return typeof first === 'number' && typeof second === 'number' && first < 7 && second < 7 ? { dates: [previous, latest], hours: [first, second] } : null;
}
export function weightWeek(journal, dates) {
  return dates.map(date => {
    const samples = Array.from({ length: 7 }, (_, index) => journal[shiftDate(date, index - 6)]?.weight).filter(value => typeof value === 'number' && value > 0);
    return { date, weight: journal[date]?.weight ?? null, average: samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : null, count: samples.length };
  });
}
export function validateMeal(meal) {
  if (!meal.name.trim() || meal.name.length > 100) return 'Escribe un nombre de comida de hasta 100 caracteres.';
  if (!Number.isFinite(meal.kcal) || meal.kcal < 0 || meal.kcal > 10000) return 'Ingresa entre 0 y 10000 kcal para tu porción.';
  if (!Number.isFinite(meal.protein) || meal.protein < 0 || meal.protein > 1000) return 'Ingresa entre 0 y 1000 g de proteína para tu porción.';
  return null;
}
