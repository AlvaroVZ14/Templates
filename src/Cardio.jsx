import {useFormDraft,useDraftState} from './drafts.jsx';
import { useEffect,useState } from 'react';
import { cardioRecommendation, cardioWeek, markCardio } from './program/tracking.js';
import { InfoNotice } from './program/PhasePanel.jsx';

export const CARDIO_TYPES = ['Caminata inclinada', 'Bici', 'Trote suave'];
export const INTENSITIES = ['Suave', 'Moderada', 'Alta'];

export default function Cardio({ data, date, change, saving }) {
  const draft=useFormDraft(`cardio:${date}`,date),stepsDraft=useFormDraft(`steps:${date}`,date),extraDraft=useFormDraft(`cardio-extra:${date}`,date);
  const [type, setType] = useDraftState(draft,'type',CARDIO_TYPES[0]);
  const [minutes, setMinutes] = useDraftState(draft,'minutes','');
  const [intensity, setIntensity] = useDraftState(draft,'intensity','Suave');
  const [steps, setSteps] = useDraftState(stepsDraft,'steps',data.dailySteps[date] === undefined ? '' : String(data.dailySteps[date]));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const sessions = data.cardio.filter(session => session.date === date);
  const recommendation = cardioRecommendation(data,date), weekly = cardioWeek(data,date);
  const [extra,setExtra] = useDraftState(extraDraft,'extra',data.cardioPreferences[recommendation.phaseId]?.extraMinutes??0);
  useEffect(()=>draft.remember({type,minutes,intensity}),[type,minutes,intensity]);
  useEffect(()=>extraDraft.remember({extra}),[extra]);
  useEffect(()=>stepsDraft.remember({steps}),[steps]);
  async function record(event) {
    event.preventDefault(); setMessage(''); setError('');
    const value = Number(minutes);
    if (!minutes || !Number.isInteger(value) || value < 1 || value > 600) { setError('Ingresa entre 1 y 600 minutos completos.'); return; }
    const session = { id: crypto.randomUUID(), date, type, minutes: value, intensity, createdAt: new Date().toISOString() };
    if (await change(state => markCardio({ ...state, cardio: [...state.cardio, {...session,recommendation:structuredClone(recommendation)}] },date,'performed',recommendation))) { draft.clear();setMinutes(''); setMessage('Cardio guardado.'); }
  }
  async function saveSteps(event) {
    event.preventDefault(); setError(''); setMessage('');
    if (steps !== '' && (!Number.isInteger(Number(steps)) || Number(steps) < 0 || Number(steps) > 200000)) { setError('Ingresa entre 0 y 200000 pasos, o deja el campo vacío.'); return; }
    if (await change(state => { const dailySteps = { ...state.dailySteps }; if (steps === '') delete dailySteps[date]; else dailySteps[date] = Number(steps); return { ...state, dailySteps }; })) {stepsDraft.clear();setMessage('Pasos diarios guardados.');}
  }
  return <section className="cardio-section" aria-label="Cardio de la sesión"><div className="section-heading"><h2>Cardio y pasos</h2><span>{sessions.reduce((sum, session) => sum + session.minutes, 0)} min hoy</span></div>
    <div className="notice"><strong>{recommendation.optional?'Opcional según tolerancia':'Después de pesas, siempre'} · {recommendation.mode}</strong><p>{recommendation.min}–{recommendation.max} min · {recommendation.frequency.join('–')} veces/semana{recommendation.steps?` · ${recommendation.steps} pasos`:''}. {weekly.minutes} minutos y {weekly.performed} días realizados esta semana; {weekly.omitted} omitidos. No compensar sesiones omitidas.</p></div>
    {recommendation.reduce&&<InfoNotice data={data} change={change} id={`cardio-reduce-${date}`}><strong>Reduce o salta el cardio hoy.</strong><p>{recommendation.reason}. Prioriza recuperación; no hay que compensarlo después.</p></InfoNotice>}
    {recommendation.plateau&&<InfoNotice data={data} change={change} id={`cardio-plateau-${recommendation.phaseId}-${new Date(`${date}T12:00:00`).getMonth()}`}><strong>El promedio no bajó en dos semanas.</strong><p>Puedes considerar sumar 5–10 minutos. Solo se aplica si lo confirmas abajo.</p></InfoNotice>}
    <p className="field-note">Para la fecha seleccionada. No suma series de musculación.</p>
    <form onChangeCapture={draft.touch} onSubmit={record} className="cardio-form"><label>Tipo de cardio<select value={type} onChange={event => setType(event.target.value)}>{CARDIO_TYPES.map(label => <option key={label}>{label}</option>)}</select></label><div className="input-pair"><label>Minutos<input aria-label="Minutos de cardio" type="number" min="1" max="600" inputMode="numeric" value={minutes} onChange={event => setMinutes(event.target.value)} required /></label><label>Intensidad<select value={intensity} onChange={event => setIntensity(event.target.value)}>{INTENSITIES.map(label => <option key={label}>{label}</option>)}</select></label></div><button className="primary full" disabled={saving}>Guardar cardio</button></form>
    {sessions.map(session => <div className="cardio-row" key={session.id}><div><strong>{session.type}</strong><small>{session.intensity}</small></div><b>{session.minutes} min</b><button className="icon-button" aria-label={`Eliminar cardio ${session.type}`} disabled={saving} onClick={() => change(state => ({ ...state, cardio: state.cardio.filter(item => item.id !== session.id) }))}>×</button></div>)}
    <button className="secondary full" disabled={saving||sessions.length>0||data.cardioDays[date]?.status==='omitted'} onClick={async()=>{if(await change(state=>markCardio(state,date,'omitted',recommendation)))setMessage('Cardio omitido. No se compensará otro día.');}}>Omitir cardio hoy</button>
    <details className="program-details"><summary>Ajustar minutos e historial de cardio</summary><form onChangeCapture={extraDraft.touch} className="program-form" onSubmit={async event=>{event.preventDefault();const value=Number(extra);if(!Number.isInteger(value)||value<0||value>60)return;if(await change(state=>({...state,cardioPreferences:{...state.cardioPreferences,[recommendation.phaseId]:{extraMinutes:value}},cardioEvents:[...state.cardioEvents,{date,status:'adjustment',extraMinutes:value,at:new Date().toISOString()}]}))){extraDraft.clear();setMessage('Minutos adicionales confirmados.');}}}><label>Minutos adicionales de cardio<input aria-label="Minutos adicionales de cardio" type="number" min="0" max="60" value={extra} onChange={event=>setExtra(event.target.value)} required /></label><button className="secondary" disabled={saving}>Confirmar minutos de cardio</button></form>{data.cardioEvents.map((event,index)=><p className="field-note" key={index}>{event.date} · {event.status==='performed'?'Realizado':event.status==='omitted'?'Omitido':`Ajuste confirmado: +${event.extraMinutes} min`}</p>)}</details>
    <form onChangeCapture={stepsDraft.touch} className="steps-form" onSubmit={saveSteps}><label>Pasos diarios (opcional)<input aria-label="Pasos diarios" type="number" min="0" max="200000" inputMode="numeric" placeholder="Sin registrar" value={steps} onChange={event => setSteps(event.target.value)} /></label><button className="secondary" disabled={saving}>Guardar pasos</button></form>
    {message && <p className="success" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}
  </section>;
}
