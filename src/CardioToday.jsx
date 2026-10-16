import {useEffect,useState} from 'react';
import {DAYS} from './domain.js';
import {useFormDraft,useDraftState} from './drafts.jsx';
import {calculateCardio,cardioWeek,completePlannedCardio} from './program/cardio.js';
import {markCardio} from './program/tracking.js';

export default function CardioToday({data,date,change,saving}){
  const recommendation=calculateCardio(data,date),weekly=cardioWeek(data,date),existing=data.cardio.find(row=>row.id===`planned-cardio-${date}`),draft=useFormDraft(`planned-cardio:${date}`,date);
  const [minutes,setMinutes]=useDraftState(draft,'minutes',String(existing?.minutes??(recommendation.minutes||5))),[message,setMessage]=useState(''),[error,setError]=useState('');
  useEffect(()=>draft.remember({minutes}),[minutes]);
  useEffect(()=>{if(!draft.dirty.current)setMinutes(String(existing?.minutes??(recommendation.minutes||5)));},[existing?.minutes,recommendation.minutes]);
  async function done(event){event.preventDefault();setError('');setMessage('');try{const value=Number(minutes);completePlannedCardio(data,date,value);if(await change(state=>completePlannedCardio(state,date,value))){draft.clear();setMessage('Cardio hecho. Minutos reales guardados.');}}catch(error){setError(error.message);}}
  return <section className="cardio-today wellness-card" aria-label="Cardio de hoy"><div className="section-heading"><h2>Cardio de hoy</h2><span>{date}</span></div><div className="cardio-minutes"><strong>{recommendation.minutes}</strong><span>min recomendados</span></div>
    <h3>{recommendation.minutes>0?recommendation.type:'Hoy: sin cardio, solo pasos'}</h3>
    <p>{recommendation.minutes>0?recommendation.intensity:`Meta de pasos: ${recommendation.steps}, según tolerancia.`}</p>
    <p className="cardio-timing">{recommendation.afterWeights?'Después de las pesas.':'Día de descanso: sin pesas; hazlo cuando te acomode.'}</p><p className="field-note">Motivo: {recommendation.reason}</p>
    {data.cardioDays[date]?.recommendation?.version===2&&data.cardioDays[date].recommendation.minutes!==recommendation.minutes&&<p className="field-note">Al marcar este día guardaste un objetivo de {data.cardioDays[date].recommendation.minutes} min. El plan actual cambió; los minutos realizados y el objetivo histórico se conservan.</p>}
    {recommendation.reduce&&<p className="notice"><strong>Reduce o salta el cardio hoy.</strong> {recommendation.recoveryReason}. No lo compenses después.</p>}
    {recommendation.plateau&&<p className="notice">El promedio de peso no bajó en dos semanas con datos suficientes. Considera sumar 5–10 min; no se aplica solo. Confírmalo en Ajustes → Cardio.</p>}
    <details><summary>¿Qué significa zona 2?</summary><p>Ritmo en que puedes hablar frases completas sin quedarte sin aire.</p><p>El ritmo depende de tu tolerancia: baja la velocidad o elige caminar/bicicleta si trotar no permite conversar.</p>{recommendation.heartRate&&<p>Guía aproximada: {recommendation.heartRate.join('–')} pulsaciones/min (60–70% de 220 − {recommendation.age}). No es una medición ni una zona personal validada; prioriza poder hablar.</p>}</details>
    {(recommendation.scheduled||recommendation.optional||existing)&&<form className="cardio-done-form" onChangeCapture={draft.touch} onSubmit={done}>
      <label>Minutos reales de este registro<input aria-label="Minutos reales de cardio" type="number" min="0.5" max="600" step="0.5" inputMode="decimal" required value={minutes} onChange={event=>setMinutes(event.target.value)}/></label>
      <p className="field-note">{recommendation.optional?'Solo caminata suave opcional: 5–10 min. No es una obligación. ':''}{data.cardio.some(row=>row.date===date&&row.id!==existing?.id)?'Ya hay otros registros hoy: estos minutos se suman; no los registres dos veces.':'Puedes corregir los minutos aquí sin duplicar el registro.'}</p>
      <button className="primary full" disabled={saving}>{existing?'Actualizar minutos hechos':'Hecho'}</button>
    </form>}
    <button type="button" className="secondary" disabled={saving||data.cardio.some(row=>row.date===date)||data.cardioDays[date]?.status==='omitted'} onClick={async()=>{if(await change(state=>markCardio(state,date,'omitted',recommendation)))setMessage('Cardio omitido. No se compensará otro día.');}}>Omitir cardio hoy</button>
    {message&&<p className="success" role="status">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}
    <div className="cardio-week-total" aria-label="Cardio semanal"><strong>{weekly.minutes} / {weekly.recommended} min</strong><span>hechos / recomendados esta semana</span><p>{weekly.omitted} días omitidos. No se suman minutos a otro día.</p></div>
    <details className="cardio-week-details"><summary>Cardio de cada día de la semana</summary><div className="table-scroll"><table className="health-table"><thead><tr><th>Día</th><th>Plan</th><th>Hecho</th></tr></thead><tbody>{weekly.rows.map((row,index)=><tr key={row.date}><th>{DAYS[index]} {row.date.slice(5)}</th><td>{row.recommended} min{row.status==='omitted'?' · Omitido':''}</td><td>{row.minutes} min</td></tr>)}</tbody></table></div><p className="field-note">El plan guardado al marcar Hecho/Omitir conserva su versión; el resto se calcula desde calendario y ajustes. Una recomendación no significa que se haya realizado.</p></details>
  </section>;
}
