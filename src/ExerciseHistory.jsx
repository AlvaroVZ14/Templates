import {useFormDraft,useDraftState} from './drafts.jsx';
import { useEffect, useState } from 'react';
import { KINDS } from './domain.js';

export default function ExerciseHistory({ exercise, history, profile, change, saving,date }) {
  const draft=useFormDraft(`notes:${date}:${exercise.id}`,date);
  const [notes, setNotes] = useDraftState(draft,'notes',profile.notes);
  useEffect(()=>draft.remember({notes}),[notes]);
  const [message, setMessage] = useState('');
  const [limit, setLimit] = useState(20);
  useEffect(() => { if(!draft.dirty.current)setNotes(profile.notes); }, [profile.notes]);
  const byDate = new Map();
  for (const log of history.filter(item => item.kind === 'effective' && item.equipment === exercise.equipment)) {
    const best = byDate.get(log.date);
    if (!best || log.weight >= best.weight) byDate.set(log.date, log);
  }
  const points = [...byDate.values()].slice(-20);
  const max = Math.max(1, ...points.map(point => point.weight));
  const x = index => points.length === 1 ? 170 : 35 + index / (points.length - 1) * 270;
  const y = weight => 125 - weight / max * 95;
  const dateLabel = date => new Date(`${date}T12:00:00Z`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return <div className="exercise-extras">
    <form onChangeCapture={draft.touch} className="exercise-notes" onSubmit={async event => {
      event.preventDefault(); setMessage('');
      if (await change(state => ({ ...state, profiles: { ...state.profiles, [exercise.profileId]: { ...profile, ...state.profiles[exercise.profileId], notes } } }))) {draft.clear();setMessage('Notas guardadas.');}
    }}>
      <label>Notas del ejercicio<textarea aria-label={`Notas de ${exercise.name}`} maxLength="3000" rows="3" placeholder="Ejecución, ajuste del asiento, sensaciones…" value={notes} onChange={event => setNotes(event.target.value)} /></label>
      <button className="secondary" disabled={saving}>Guardar notas</button>{message && <p className="success" role="status">{message}</p>}
    </form>
    <details className="history-panel"><summary>Historial del ejercicio <span>{history.length} series</span></summary>
      {points.length > 0 ? <><p className="field-note">Mayor carga efectiva por sesión · últimas 20 sesiones · {exercise.equipment === 'dumbbell' ? 'kg por mano' : 'kg'} · {points.length === 1 ? 'Registra otra sesión para ver la evolución.' : 'Cada punto corresponde a una fecha.'}</p>
        <svg className="history-chart" viewBox="0 0 340 160" role="img" aria-label={`Evolución de carga de ${exercise.name}`}><path d="M35 25V125H310" fill="none" stroke="#686563" /><path d="M35 77H310M35 30H310" fill="none" stroke="#333436" strokeDasharray="3 5" /><text x="3" y="34">{max}</text><text x="13" y="128">0</text><polyline points={points.map((point, i) => `${x(i)},${y(point.weight)}`).join(' ')} fill="none" stroke="#ff9471" strokeWidth="2.5" />{points.map((point, i) => <circle key={point.id} cx={x(i)} cy={y(point.weight)} r="4" fill="#ff7048"><title>{point.date}: {point.weight} kg × {point.reps}, RPE {point.rpe ?? 'sin dato'}</title></circle>)}<text x="35" y="150">{dateLabel(points[0].date)}</text><text x="305" y="150" textAnchor="end">{dateLabel(points.at(-1).date)}</text></svg>
      </> : <p className="field-note">El gráfico aparecerá cuando guardes una efectiva con este equipo.</p>}
      <div className="history-entries">{history.length === 0 ? <p className="field-note">Todavía no hay series registradas.</p> : [...history].reverse().slice(0, limit).map(log => <div key={log.id} className="history-entry"><div><strong>{dateLabel(log.date)} {log.date.slice(0, 4)} · {KINDS[log.kind]}</strong><span>{log.failure ? 'Al fallo' : 'Sin fallo'} · RPE {log.rpe ?? 'sin dato'}</span></div><b>{log.weight} {log.equipment === 'dumbbell' ? 'kg/mano' : 'kg'} × {log.reps}</b></div>)}</div>
      {history.length > limit && <button className="secondary" onClick={() => setLimit(limit + 20)}>Ver más series</button>}
    </details>
  </div>;
}
