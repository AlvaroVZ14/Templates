import { useState } from 'react';
import { weekDates } from './domain.js';
import { JOURNAL_FIELDS, optionalNumber, shiftDate, sleepWarning, validateJournal, validateMeal, weightWeek } from './wellness.js';
import TrendChart from './TrendChart.jsx';

export default function Diary({ data, date, setDate, change, saving }) {
  const entry = data.journal[date];
  const [fields, setFields] = useState(() => Object.fromEntries(JOURNAL_FIELDS.map(({ key }) => [key, entry?.[key] ?? ''])));
  const [pain, setPain] = useState(entry?.pain ?? '');
  const [goal, setGoal] = useState(String(data.settings.sleepGoal));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const warning = sleepWarning(data.journal, date);
  const days = weekDates(date), rows = weightWeek(data.journal, days);
  const format = value => value === null ? '—' : value.toLocaleString('es-CL', { maximumFractionDigits: 2 });
  async function save(event) {
    event.preventDefault(); setError(''); setMessage('');
    const values = { ...Object.fromEntries(JOURNAL_FIELDS.map(({ key }) => [key, optionalNumber(fields[key])])), pain: pain.trim(), updatedAt: new Date().toISOString() };
    const invalid = validateJournal(values); if (invalid) { setError(invalid); return; }
    if (await change(state => ({ ...state, journal: { ...state.journal, [date]: values } }))) setMessage('Diario guardado.');
  }
  async function saveGoal(event) {
    event.preventDefault(); setError(''); setMessage('');
    const sleepGoal = Number(goal);
    if (!goal.trim() || !Number.isFinite(sleepGoal) || sleepGoal <= 0 || sleepGoal > 24) { setError('La meta de sueño debe ser mayor que 0 y hasta 24 horas.'); return; }
    if (await change(state => ({ ...state, settings: { ...state.settings, sleepGoal } }))) setMessage('Meta de sueño guardada.');
  }
  return <div className="wellness-page"><div className="page-heading"><div><p className="eyebrow">REGISTRA CÓMO LLEGAS</p><h1>Tu diario<span className="accent">.</span></h1></div><span className="outlined-tag">DÍA A DÍA</span></div>
    <label className="wellness-date">Fecha del diario<input type="date" value={date} onChange={event => event.target.value && setDate(event.target.value)} /></label>
    {warning && <div className="notice warning" role="alert"><strong>Dos noches seguidas con menos de 7 horas.</strong><p>{warning.dates[0]}: {warning.hours[0]} h · {warning.dates[1]}: {warning.hours[1]} h. Tu meta es {data.settings.sleepGoal} h.</p></div>}
    <form className="wellness-card sleep-goal" onSubmit={saveGoal}><label>Meta de sueño (horas)<input type="number" min="0.1" max="24" step="0.1" inputMode="decimal" value={goal} onChange={event => setGoal(event.target.value)} required /></label><button className="secondary" disabled={saving}>Guardar meta</button></form>
    <form className="wellness-card" onSubmit={save}><div className="section-heading"><h2>Cómo estás hoy</h2><span>Campos opcionales</span></div><p className="field-note">El sueño corresponde a la noche que terminó en esta fecha. Escalas: 1 es menor y el máximo es mayor.</p><div className="wellness-grid">{JOURNAL_FIELDS.map(({ key, label, min, max, step }) => <label key={key}>{label}<input type="number" aria-label={label} min={min} max={max} step={step} inputMode={step === 1 ? 'numeric' : 'decimal'} placeholder="Sin registrar" value={fields[key]} onChange={event => setFields({ ...fields, [key]: event.target.value })} /></label>)}</div><label>Dolor por zona<textarea aria-label="Dolor por zona" maxLength="3000" rows="3" placeholder="Zona y descripción, si corresponde" value={pain} onChange={event => setPain(event.target.value)} /></label><button className="primary full" disabled={saving}>Guardar diario</button></form>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="success" role="status">{message}</p>}
    <section className="wellness-card"><div className="section-heading"><h2>Peso de la semana</h2><span>kg</span></div><div className="week-selector"><button className="icon-button" aria-label="Semana anterior de peso" onClick={() => setDate(shiftDate(date, -7))}>←</button><span>{days[0]} — {days[6]}</span><button className="icon-button" aria-label="Semana siguiente de peso" onClick={() => setDate(shiftDate(date, 7))}>→</button></div><TrendChart title="Peso semanal y promedio móvil de 7 días" unit="kg" labels={days.map(day => day.slice(5))} series={[{ name: 'Peso', color: '#ff9471', values: rows.map(row => row.weight) }, { name: 'Promedio 7 días', color: '#b4d5af', dashed: true, values: rows.map(row => row.average) }]} /><p className="field-note">Promedio de los pesos registrados en los 7 días calendario hasta cada fecha. No se rellenan días sin peso; se indica cuántos registros hay.</p><div className="table-scroll"><table className="health-table"><thead><tr><th>Día</th><th>Peso</th><th>Promedio</th><th>Datos</th></tr></thead><tbody>{rows.map(row => <tr key={row.date}><th>{row.date.slice(5)}</th><td>{format(row.weight)}</td><td>{format(row.average)}</td><td>{row.count}/7</td></tr>)}</tbody></table></div></section>
    <Meals data={data} date={date} change={change} saving={saving} />
  </div>;
}

function Meals({ data, date, change, saving }) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const meals = data.meals.filter(meal => meal.date === date);
  const total = meals.reduce((sum, meal) => ({ kcal: sum.kcal + meal.kcal, protein: sum.protein + meal.protein }), { kcal: 0, protein: 0 });
  function values() { return { name: name.trim(), kcal: optionalNumber(kcal), protein: optionalNumber(protein) }; }
  async function save(event) {
    event.preventDefault(); setMessage(''); setError('');
    const value = values(), invalid = validateMeal(value); if (invalid) { setError(invalid); return; }
    const meal = { ...value, id: editing ?? crypto.randomUUID(), date };
    if (await change(state => ({ ...state, meals: editing ? state.meals.map(item => item.id === editing ? meal : item) : [...state.meals, meal] }))) { setName(''); setKcal(''); setProtein(''); setEditing(null); setMessage('Comida guardada.'); }
  }
  async function favorite() {
    setError(''); setMessage(''); const value = values(), invalid = validateMeal(value); if (invalid) { setError(invalid); return; }
    if (await change(state => { const existing = state.favorites.find(item => item.name.toLocaleLowerCase('es') === value.name.toLocaleLowerCase('es')); const item = { ...value, id: existing?.id ?? crypto.randomUUID() }; return { ...state, favorites: existing ? state.favorites.map(fav => fav.id === existing.id ? item : fav) : [...state.favorites, item] }; })) setMessage('Favorito guardado con los valores de tu porción.');
  }
  return <section className="wellness-card"><div className="section-heading"><h2>Comidas</h2><span>Tu porción, tus valores</span></div><div className="meal-totals"><strong>{Number(total.kcal.toFixed(1))}<small> kcal</small></strong><strong>{Number(total.protein.toFixed(1))}<small> g proteína</small></strong></div>
    <div className="favorite-list" aria-label="Comidas favoritas">{data.favorites.map(fav => <button key={fav.id} className="secondary" onClick={() => { setName(fav.name); setKcal(fav.kcal ?? ''); setProtein(fav.protein ?? ''); setEditing(null); setMessage(fav.kcal === null ? 'Completa las kcal y proteína de tu porción para guardar este favorito.' : 'Valores del favorito cargados.'); }}>{fav.name}</button>)}</div><p className="field-note">Los favoritos iniciales no inventan calorías ni porciones. Completa sus datos una vez y pulsa Guardar como favorito.</p>
    <form className="meal-form" onSubmit={save}><label>Nombre de la comida<input maxLength="100" value={name} onChange={event => setName(event.target.value)} required /></label><div className="input-pair"><label>Kcal de la comida<input type="number" min="0" max="10000" step="0.1" inputMode="decimal" value={kcal} onChange={event => setKcal(event.target.value)} required /></label><label>Proteína de la comida (g)<input type="number" min="0" max="1000" step="0.1" inputMode="decimal" value={protein} onChange={event => setProtein(event.target.value)} required /></label></div><button className="primary full" disabled={saving}>{editing ? 'Actualizar comida' : 'Guardar comida'}</button><button type="button" className="secondary" disabled={saving} onClick={favorite}>Guardar como favorito</button>{editing && <button type="button" className="quiet" onClick={() => { setEditing(null); setName(''); setKcal(''); setProtein(''); }}>Cancelar edición</button>}</form>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="success" role="status">{message}</p>}
    <div className="meal-records">{meals.length === 0 ? <p className="field-note">Aún sin comidas para esta fecha.</p> : meals.map(meal => <div className="meal-row" key={meal.id}><div><strong>{meal.name}</strong><span>{meal.kcal} kcal · {meal.protein} g proteína</span></div><button className="quiet" onClick={() => { setEditing(meal.id); setName(meal.name); setKcal(meal.kcal); setProtein(meal.protein); }}>Editar</button><button className="icon-button" aria-label={`Eliminar comida ${meal.name}`} disabled={saving} onClick={() => change(state => ({ ...state, meals: state.meals.filter(item => item.id !== meal.id) }))}>×</button></div>)}</div>
  </section>;
}
