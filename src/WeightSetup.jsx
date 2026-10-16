import {useEffect,useState} from 'react';
import {DAYS,EQUIPMENT,localDate} from './domain.js';
import {useFormDraft} from './drafts.jsx';
import {applyWorkWeights,weightExercises} from './gym.js';

export default function WeightSetup({data,change,saving,onDone}){
  const exercises=weightExercises(data),draft=useFormDraft('weights:setup',localDate());
  const [values,setValues]=useState(()=>({...Object.fromEntries(exercises.flatMap(ex=>[[`weight:${ex.profileId}`,String(data.profiles[ex.profileId]?.workWeight??'')],[`reps:${ex.profileId}`,String(data.profiles[ex.profileId]?.targetReps??8)]])),...draft.initial}));
  const [error,setError]=useState('');
  useEffect(()=>draft.remember(values),[values]);
  const missing=exercises.filter(ex=>String(values[`weight:${ex.profileId}`]??'').trim()==='').length;
  function update(key,value){draft.touch();setValues(current=>({...current,[key]:value}));setError('');}
  async function save(event){
    event.preventDefault();setError('');
    try{applyWorkWeights(data,values);if(await change(state=>applyWorkWeights(state,values))){draft.clear();onDone();}}catch(error){setError(error.message);}
  }
  async function postpone(){
    if(await change(state=>({...state,weightSetup:{...state.weightSetup,reviewedAt:new Date().toISOString()}})))onDone();
  }
  return <section className="weight-setup">
    <div className="page-heading"><div><p className="eyebrow">TU PUNTO DE PARTIDA</p><h1>Configurar pesos</h1></div></div>
    <p className="page-intro">Carga tus pesos de trabajo y reps objetivo de una vez. Mancuernas: peso por mano. Si un ejercicio se repite, comparte la referencia; tus series anteriores conservan sus valores.</p>
    <div className="setup-progress" role="status">{exercises.length-missing} de {exercises.length} ejercicios con peso · {missing} pendientes</div>
    <form onSubmit={save} className="weight-setup-form">
      <div className="weight-setup-list">{exercises.map(ex=><article className={`weight-setup-row ${String(values[`weight:${ex.profileId}`]??'').trim()===''?'weight-missing':''}`} key={ex.profileId}>
        <div><h2>{ex.name}</h2><p>{EQUIPMENT[ex.equipment]} · {[...new Set(ex.days)].map(day=>DAYS[day]).join(' · ')}</p>{String(values[`weight:${ex.profileId}`]??'').trim()===''&&<span className="weight-pending">◇ Peso pendiente · se pedirá al abrir el ejercicio</span>}</div>
        <div className="input-pair"><label>Peso ({ex.equipment==='dumbbell'?'kg por mano':'kg'})<input aria-label={`Peso inicial de ${ex.name}`} type="number" inputMode="decimal" min="0" max="1500" step="any" placeholder="Pendiente" value={values[`weight:${ex.profileId}`]??''} onChange={event=>update(`weight:${ex.profileId}`,event.target.value)}/></label><label>Reps objetivo<input aria-label={`Reps iniciales de ${ex.name}`} required type="number" inputMode="numeric" min="1" max="200" step="1" value={values[`reps:${ex.profileId}`]??'8'} onChange={event=>update(`reps:${ex.profileId}`,event.target.value)}/></label></div>
      </article>)}</div>
      {error&&<p className="error" role="alert">{error}</p>}
      <div className="setup-actions"><button className="primary full" disabled={saving}>Guardar pesos y continuar</button><button className="secondary full" type="button" disabled={saving} onClick={postpone}>Posponer configuración</button><p className="field-note">Puedes volver desde el menú → Configurar pesos. Posponer conserva este borrador; no cambia tus referencias.</p></div>
    </form>
  </section>;
}
