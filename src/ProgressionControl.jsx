import {useState} from 'react';
import {progressionSuggestion,saveExerciseFeedback} from './doubleProgression.js';
const number=value=>value==null?'elige peso':`${value.toLocaleString('es-CL')} kg`;
const feelings=[['strong','😀 fuerte'],['normal','😐 normal'],['weak','😫 flojo']];
export default function ProgressionControl({data,ex,date,change,saving,complete,hideFeedback=false,feedbackOnly=false}){
  const feedback=(data.exerciseFeedback??[]).findLast(row=>row.date===date&&row.exerciseId===ex.id);
  const [clean,setClean]=useState(feedback?.cleanRir??false),[error,setError]=useState('');
  const suggestion=progressionSuggestion(data,ex,date),first=suggestion.prescriptions[0];
  const next=(data.progressionDecisions??[]).findLast(row=>row.date===date&&row.exerciseId===ex.id&&row.type==='next');
  async function save(feeling){setError('');const ok=await change(state=>saveExerciseFeedback(state,ex,date,feeling,clean));if(!ok)setError('No se guardó la sensación. Vuelve a intentarlo.');}
  return <div className="fast-progression">
    {!feedbackOnly&&<><p>Hoy: <strong>{number(first?.weight)} × {first?.repMin}–{first?.repMax}</strong> · {suggestion.action==='increase'?'subir':'mantener'}</p>
    <details><summary aria-label="Regla y motivo" title="Regla y motivo">ⓘ</summary><p>{suggestion.reason}</p><p>{ex.loadType==='heavy'?'Compuesto pesado: carga controlable, descanso largo de 2–3 min.':'Aislamiento: cerca del fallo técnico, ejecución limpia y descanso de 1,5–2 min.'} Excéntrica controlada de 2–3 s. La carga sugerida se acepta al tocar ✓ y puedes editarla antes.</p>
      {ex.equipment==='cable'&&<label>Placa pequeña (kg; ajusta a tu polea)<input aria-label={`Placa pequeña de ${ex.name}`} type="number" inputMode="decimal" min="0.5" max="100" step="0.5" defaultValue={data.profiles?.[ex.profileId]?.progressionPlateKg??ex.increment??5} disabled={saving} onBlur={event=>{const kg=Number(event.target.value);if(kg>=.5&&kg<=100)change(state=>({...state,profiles:{...state.profiles,[ex.profileId]:{...state.profiles?.[ex.profileId],progressionPlateKg:kg}}}));}}/></label>}
    </details></>}
    {complete&&!hideFeedback&&<div className="fast-feedback"><label><input type="checkbox" checked={clean} onChange={event=>setClean(event.target.checked)}/> Todas las efectivas con técnica limpia y 0–2 RIR</label><div role="group" aria-label={`Sensación de ${ex.name}`}>{feelings.map(([value,label])=><button key={value} disabled={saving} aria-pressed={feedback?.feeling===value&&feedback.cleanRir===clean} onClick={()=>save(value)}>{label}</button>)}</div>{feedback?.cleanRir!==clean&&<small>Cambio pendiente: toca una sensación para guardar.</small>}{next&&<p>Próxima: {number(next.prescriptions[0]?.weight)} · {next.reason}</p>}</div>}
    {error&&<p role="alert">{error}</p>}
  </div>;
}
export function ProgressionHistory({data}){
  const [limit,setLimit]=useState(20),rows=[...(data.progressionDecisions??[])].reverse();
  return <details className="wellness-card"><summary>Decisiones de progresión ({rows.length})</summary>{!rows.length&&<p>Se guardan al confirmar la primera serie y al registrar tu sensación.</p>}{rows.slice(0,limit).map(row=><article key={row.id}><h3>{row.date} · {row.exerciseName}</h3><p>{row.type==='next'?'Próxima sesión':'Sugerencia usada'} · {row.feeling?feelings.find(([value])=>value===row.feeling)?.[1]:''} · {row.reason}</p><p>{row.prescriptions.map((set,index)=>`${index+1}: ${number(set.weight)} × ${set.reps}`).join(' · ')}</p>{row.type==='used'&&<p>Registrado: {data.logs.filter(log=>log.progressionDecisionId===row.id).map(log=>`${number(log.weight)} × ${log.reps}`).join(' · ')||'Sin series vinculadas'}</p>}</article>)}{rows.length>limit&&<button onClick={()=>setLimit(limit+20)}>Ver más decisiones</button>}</details>;
}
