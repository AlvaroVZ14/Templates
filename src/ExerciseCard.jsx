import {useEffect,useRef,useState} from 'react';
import {useFormDraft} from './drafts.jsx';
import {localDate} from './domain.js';
import {shiftDate} from './wellness.js';
import {ExercisePainNotice,FailureSafety} from './Pain.jsx';
import {confirmQuickSet,dropWeight,previousEffectiveSession,quickSetValues} from './quickRegistration.js';
import './fast-register.css';

const roles={top:'Top',backoff:'Back-off',heavy:'Pesada',light:'Ligera',standard:'Efectiva'};
const display=value=>value==null||value===''?'—':Number(value).toLocaleString('es-CL',{maximumFractionDigits:2});
function previousLabel(date,today){return date===shiftDate(today,-1)?'Ayer':new Date(`${date}T12:00:00Z`).toLocaleDateString('es-CL',{day:'numeric',month:'short',timeZone:'UTC'});}

function NumberControl({value,label,onChange,disabled=false,inherited=false,step=1,min=0,max=1500}){
  const [editing,setEditing]=useState(false),[keyboard,setKeyboard]=useState(false);
  const container=useRef(null);
  useEffect(()=>{if(!editing)return;const close=event=>{if(!container.current?.contains(event.target)){setEditing(false);setKeyboard(false);}};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[editing]);
  return <div ref={container} className={`fast-number ${inherited?'inherited':''}`}>
    <button type="button" className="number-value" disabled={disabled} aria-label={`${label}: ${display(value)}`} aria-expanded={editing} onClick={()=>{setEditing(!editing);setKeyboard(false);}}>{display(value)}</button>
    {editing&&!disabled&&<div className="number-stepper" role="group" aria-label={`Ajustar ${label}`} onKeyDown={event=>{if(event.key==='Escape'){setEditing(false);setKeyboard(false);}}}>
      <button type="button" aria-label={`Restar ${step} a ${label}`} onClick={()=>onChange(Number(Math.max(min,(Number(value)||0)-step).toFixed(2)))}>−{display(step)}</button>
      <strong>{display(value)}</strong>
      <button type="button" aria-label={`Sumar ${step} a ${label}`} onClick={()=>onChange(Number(Math.min(max,(Number(value)||0)+step).toFixed(2)))}>+{display(step)}</button>
      <button type="button" className="stepper-keyboard" onClick={()=>setKeyboard(!keyboard)}>Teclado</button>
      <button type="button" onClick={()=>{setEditing(false);setKeyboard(false);}}>Listo</button>
      {keyboard&&<input autoFocus aria-label={`Escribir ${label}`} type="number" inputMode={step===1?'numeric':'decimal'} min={min} max={max} step="any" value={value??''} onChange={event=>onChange(event.target.value===''?'':Number(event.target.value))}/>}
    </div>}
  </div>;
}

export default function ExerciseCard({exercise:ex,index,date,data,logs,change,saving}){
  const draft=useFormDraft(`quick:${date}:${ex.id}`,date);
  const [edits,setEdits]=useState(draft.initial),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const inFlight=useRef(false),effective=logs.filter(log=>log.kind==='effective'),history=previousEffectiveSession(data,ex,date),previous=history[0];
  const finished=Boolean(data.sessionMeta?.[date]?.endedAt),unit=ex.equipment==='dumbbell'?'kg/mano':ex.weightMode==='added-load'?'kg lastre':'kg';
  const setEdit=(key,value)=>{draft.touch();setEdits(current=>{const next={...current,[key]:value};draft.remember(next);return next;});};
  const value=(key,fallback)=>Object.hasOwn(edits,key)?edits[key]:fallback;
  async function confirm(row,values){
    if(inFlight.current)return;
    inFlight.current=true;setBusy(true);setError('');let reason='';
    try{
      const success=await change(state=>{try{return confirmQuickSet(state,ex,date,row,values);}catch(error){reason=error.message;throw error;}});
      if(success){const remaining=Object.fromEntries(Object.entries(edits).filter(([key])=>!key.startsWith(`${row}:`)));setEdits(remaining);if(Object.keys(remaining).length)draft.remember(remaining);else draft.clear();}
      else setError(reason||'No se pudo guardar. Tus valores siguen aquí; vuelve a tocar ✓.');
    }catch{setError('No se pudo guardar. Tus valores siguen aquí; vuelve a tocar ✓.');}
    finally{inFlight.current=false;setBusy(false);}
  }
  const firstPlan=quickSetValues(data,ex,date,0,logs);
  return <article className={`fast-exercise ${effective.length>=ex.sets?'fast-complete':''}`} aria-label={ex.name}>
    <header className="fast-exercise-heading"><span className="fast-index">{String(index+1).padStart(2,'0')}</span><h2>{ex.name}</h2><small>{effective.length}/{ex.sets}</small></header>
    {ex.loadType==='heavy'&&<p className="fast-warmup">Calentamiento: 1–2 progresivas + 1 de ajuste (no se registra)</p>}
    <p className="fast-target">{firstPlan.repMin}–{firstPlan.repMax} reps · {ex.deload?'descarga, lejos del fallo':'0–2 RIR'} · {previous?`${previousLabel(previous.date,localDate())} ${display(previous.weight)}×${previous.reps}`:'Sin historial: toca el peso'}<span> · {unit}</span></p>
    <ExercisePainNotice data={data} exercise={ex} date={date}/>
    <div className="fast-series" role="group" aria-label={`Series de ${ex.name}`}>
      {Array.from({length:ex.sets},(_,row)=>{
        const stored=effective[row],suggestion=quickSetValues(data,ex,date,row,logs),last=row===ex.sets-1;
        const weight=stored?.weight??value(`${row}:weight`,suggestion.weight),reps=stored?.reps??value(`${row}:reps`,suggestion.reps);
        const kind=last&&!ex.deload&&['drop','rp'].includes(ex.technique)?ex.technique:null,extensions=stored?logs.filter(log=>log.parentId===stored.id):[];
        const selected=stored?extensions.length>0:Boolean(value(`${row}:technique`,false)),count=kind==='drop'?(ex.dropCount??1):(ex.rpCount??2);
        const past=history[row],previousExtensions=past?data.logs.filter(log=>log.parentId===past.id&&log.kind===kind):[];
        const techniqueValues=Array.from({length:count},(_,part)=>({weight:kind==='rp'?weight:value(`${row}:drop:${part}:weight`,dropWeight(ex,weight,part)),reps:value(`${row}:extra:${part}:reps`,previousExtensions[part]?.reps??(kind==='rp'?4:null))}));
        const disabled=saving||busy||finished||!!stored,rowLabel=`${ex.name}, serie ${row+1}`;
        return <div className={`fast-set ${stored?'confirmed':''}`} key={row} data-series={row+1}>
          <div className="fast-set-line">
            <div className="fast-role">{kind?<button type="button" className="technique-toggle" aria-label={`${kind==='drop'?'Drop':'RP'} en ${rowLabel}`} aria-pressed={selected} disabled={disabled} onClick={()=>setEdit(`${row}:technique`,!selected)}>{kind==='drop'?'Drop':'RP'} <span>{selected?'●':'○'}</span></button>:<span>{roles[suggestion.role]??'Efectiva'}</span>}</div>
            <NumberControl label={`Peso de ${rowLabel}`} value={weight} step={2.5} inherited={!stored&&!Object.hasOwn(edits,`${row}:weight`)} disabled={disabled} onChange={next=>setEdit(`${row}:weight`,next)}/>
            <NumberControl label={`Reps de ${rowLabel}`} value={reps} step={1} min={1} max={200} inherited={!stored&&!Object.hasOwn(edits,`${row}:reps`)} disabled={disabled} onChange={next=>setEdit(`${row}:reps`,next)}/>
            <button type="button" className="fast-confirm" aria-label={`${stored?'Guardada':'Confirmar'} ${rowLabel}`} disabled={disabled||row!==effective.length} onClick={()=>confirm(row,{weight,reps,technique:selected?kind:null,extensions:techniqueValues})}>{stored?'✓':busy&&row===effective.length?'…':'✓'}</button>
          </div>
          {suggestion.role==='light'&&!stored&&<small className="fast-row-hint">Ligera · 12–15 reps{weight==null?' · elige carga':''}</small>}
          {selected&&kind&&<div className="fast-technique" aria-label={`Detalle ${kind} de ${rowLabel}`}>
            <small>{kind==='drop'?'−30% · caída':'RP · 15–20 s'}</small>
            {Array.from({length:count},(_,part)=><div className="fast-mini" key={part}>
              {kind==='drop'&&<><NumberControl label={`Peso caída ${part+1} de ${rowLabel}`} value={extensions[part]?.weight??techniqueValues[part].weight} step={2.5} disabled={disabled} onChange={next=>setEdit(`${row}:drop:${part}:weight`,next)}/><small>kg ×</small></>}
              <NumberControl label={`Reps ${kind==='drop'?'caída':'RP'} ${part+1} de ${rowLabel}`} value={extensions[part]?.reps??techniqueValues[part].reps} step={1} min={1} max={200} disabled={disabled} onChange={next=>setEdit(`${row}:extra:${part}:reps`,next)}/>
            </div>)}
          </div>}
        </div>;
      })}
    </div>
    {error&&<p className="fast-error" role="alert">{error}</p>}
    <FailureSafety data={data} exercise={ex} enabled={ex.loadType==='heavy'} change={change} saving={saving} compact/>
  </article>;
}
