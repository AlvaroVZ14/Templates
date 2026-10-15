import { useState } from 'react';
import { MEASURES, measurementRatios, measurementReminder, measurementStats, orderedMeasurements, validateMeasurement, waistWarning } from './measurements.js';
import { optionalNumber } from './wellness.js';
import TrendChart from './TrendChart.jsx';

export default function Measurements({ data, date, setDate, change, saving }) {
  const existing = data.measurements.find(record => record.date === date);
  const [fields, setFields] = useState(() => Object.fromEntries(MEASURES.map(({key})=>[key,existing?.values[key] ?? ''])));
  const [conditions, setConditions] = useState(existing?.conditions ?? false);
  const [selected, setSelected] = useState('biceps');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const reminder = measurementReminder(data.measurements,date);
  const stats = measurementStats(data.measurements,date), ratios = measurementRatios(data.measurements,date);
  const points = orderedMeasurements(data.measurements,date).filter(record=>typeof record.values[selected]==='number').slice(-20);
  const initial = data.measurements.find(record=>record.initial);
  const format = value => value === null ? '—' : Number(value.toFixed(2)).toLocaleString('es-CL');
  const delta = value => value === null ? '—' : `${value > 0 ? '+' : ''}${format(value)}`;
  async function save(event) {
    event.preventDefault(); setError(''); setMessage('');
    const record = { id: existing?.id ?? crypto.randomUUID(), date, initial: existing?.initial ?? false, conditions, values: Object.fromEntries(MEASURES.map(({key})=>[key,optionalNumber(fields[key])])) };
    const invalid = validateMeasurement(record); if (invalid) { setError(invalid); return; }
    if (await change(state=>({ ...state, measurements: state.measurements.some(item=>item.date===date) ? state.measurements.map(item=>item.date===date ? {...record,id:item.id,initial:item.initial} : item) : [...state.measurements,record] }))) setMessage('Medidas guardadas.');
  }
  return <div className="wellness-page"><div className="page-heading"><div><p className="eyebrow">LA EVOLUCIÓN EN CENTÍMETROS</p><h1>Tus medidas<span className="accent">.</span></h1></div><span className="outlined-tag">CADA 2 SEMANAS</span></div>
    <label className="wellness-date">Fecha de medidas<input type="date" value={date} onChange={event=>event.target.value && setDate(event.target.value)} /></label>
    <div className={`notice ${reminder.due ? 'warning' : ''}`} role={reminder.due ? 'alert' : 'status'}><strong>{reminder.due ? 'Toca registrar tus medidas.' : 'Próximo control de medidas'}</strong><p>{reminder.due ? `Pendiente desde ${reminder.date}.` : `${reminder.date}.`} Cada 14 días, los jueves. En ayunas, a la misma hora, con la misma cinta y lado. Cuerpo relajado; bíceps en pose.</p><p>Completa las seis medidas para cerrar el recordatorio del período. Una anotación tardía conserva el calendario de los jueves.</p></div>
    <form className="wellness-card" onSubmit={save}><div className="section-heading"><h2>{existing?.initial ? 'Medición inicial' : existing ? 'Editar medición' : 'Registrar medición'}</h2><span>cm</span></div><p className="field-note">Puedes guardar medidas parciales. Un campo vacío significa sin dato para esta fecha.</p><div className="wellness-grid">{MEASURES.map(({key,label})=><label key={key}>{label} (cm)<input aria-label={`${label} (cm)`} type="number" min="0.1" max="500" step="0.1" inputMode="decimal" placeholder="Sin registrar" value={fields[key]} onChange={event=>setFields({...fields,[key]:event.target.value})} /></label>)}</div><label className="check-label"><input type="checkbox" checked={conditions} onChange={event=>setConditions(event.target.checked)} /><span>En ayunas y mismas condiciones<small>Bíceps en pose; el resto relajado</small></span></label><button className="primary full" disabled={saving}>Guardar medidas</button></form>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="success" role="status">{message}</p>}
    <section className="wellness-card"><div className="section-heading"><h2>Cambios por medida</h2><span>Inicial: {initial?.date ?? '—'}</span></div><p className="field-note">Último valor registrado hasta la fecha elegida. Cada cambio se calcula contra el registro anterior disponible de esa misma medida y contra la inicial.</p><div className="table-scroll"><table className="health-table measure-table"><thead><tr><th>Medida</th><th>cm</th><th>Anterior</th><th>Inicial</th></tr></thead><tbody>{stats.map(row=><tr key={row.key}><th>{row.label}<small>{row.date ?? 'Sin registro'}</small></th><td>{format(row.value)}</td><td>{delta(row.previousChange)}</td><td>{delta(row.initialChange)}</td></tr>)}</tbody></table></div></section>
    <section className="wellness-card"><div className="section-heading"><h2>Relaciones</h2><span>Sin unidades</span></div><div className="ratio-grid">{ratios.map(ratio=><div className="ratio-card" key={ratio.label}><span>{ratio.label}</span><strong>{format(ratio.value)}</strong><small>{ratio.date ?? 'Faltan ambas medidas en una fecha'}</small></div>)}</div><p className="field-note">Cada relación usa ambas medidas de la misma fecha; no mezcla registros de días diferentes.</p></section>
    <section className="wellness-card"><div className="section-heading"><h2>Evolución por medida</h2><span>Últimos 20 registros</span></div><label>Medida del gráfico<select aria-label="Medida del gráfico" value={selected} onChange={event=>setSelected(event.target.value)}>{MEASURES.map(({key,label})=><option key={key} value={key}>{label}</option>)}</select></label><TrendChart title={`Evolución de ${MEASURES.find(item=>item.key===selected).label}`} unit="cm" labels={points.map(point=>point.date.slice(5))} series={[{name:MEASURES.find(item=>item.key===selected).label,color:'#ff9471',values:points.map(point=>point.values[selected])}]} /><div className="table-scroll"><table className="health-table"><thead><tr><th>Fecha</th><th>cm</th><th>Condiciones</th></tr></thead><tbody>{orderedMeasurements(data.measurements,date).filter(record=>typeof record.values[selected]==='number').toReversed().map(record=><tr key={record.id}><th>{record.date}</th><td>{format(record.values[selected])}</td><td>{record.conditions === null ? 'Sin dato' : record.conditions ? 'Confirmadas' : 'Sin confirmar'}</td></tr>)}</tbody></table></div></section>
  </div>;
}

export function WaistNotice({ records, date }) {
  const hasRecords = records.some(record=>record.date <= date && typeof record.values.waist === 'number');
  const warning = waistWarning(records,date);
  return warning ? <aside className="notice warning" role="alert"><strong>La cintura subió más de 1 cm en un mes.</strong><p>+{Number(warning.difference.toFixed(2)).toLocaleString('es-CL')} cm entre {warning.from} y {warning.to}. Umbral de seguimiento de tu registro.</p></aside> : <p className="waist-caption">{hasRecords ? 'Cintura: sin aumento registrado mayor de 1 cm dentro de un mes, o faltan mediciones comparables.' : 'Registra cintura en Medidas para comparar su cambio mensual.'}</p>;
}
