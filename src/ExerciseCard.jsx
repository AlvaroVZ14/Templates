import {memo,useCallback,useEffect,useRef,useState} from 'react';
import {useFormDraft} from './drafts.jsx';
import {ExercisePainNotice,FailureSafety} from './Pain.jsx';
import {confirmQuickSet,dropWeight,previousEffectiveSession,quickSetValues} from './quickRegistration.js';
import ProgressionControl from './ProgressionControl.jsx';
import './fast-register.css';

const roles={top:'TOP',backoff:'BACK-OFF'};
const display=value=>value==null||value===''?'—':Number(value).toLocaleString('es-CL',{maximumFractionDigits:2});

function NumberControl({value,label,onChange,disabled=false,inherited=false,step=1,min=0,max=1500,initialValue=null}){
  const [editing,setEditing]=useState(false),[keyboard,setKeyboard]=useState(false);
  const container=useRef(null);
  const numberRef=useRef(null),previousValue=useRef(value);
  useEffect(()=>{const before=previousValue.current;previousValue.current=value;if(before===value||!label.startsWith('Peso')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const animation=numberRef.current?.animate([{opacity:.6,transform:'translateY(3px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:200,easing:'ease-out'});return()=>animation?.cancel();},[value]);
  useEffect(()=>{if(!editing)return;const close=event=>{if(!container.current?.contains(event.target)){setEditing(false);setKeyboard(false);}};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[editing]);
  return <div ref={container} className={`fast-number ${inherited?'inherited':''}`}>
    <button ref={numberRef} type="button" className="number-value" disabled={disabled} aria-label={`${label}: ${display(value)}`} aria-expanded={editing} onClick={()=>{setEditing(!editing);setKeyboard(false);}}>{display(value)}</button>
    {editing&&!disabled&&<div className="number-stepper" role="group" aria-label={`Ajustar ${label}`} onKeyDown={event=>{if(event.key==='Escape'){setEditing(false);setKeyboard(false);}}}>
      <button type="button" aria-label={`Restar ${step} a ${label}`} onClick={()=>onChange(Number(Math.max(min,(Number(value??initialValue)||0)-step).toFixed(2)))}>−{display(step)}</button>
      {value==null&&initialValue!=null?<button type="button" aria-label={`Usar sugerencia de ${label}`} onClick={()=>onChange(initialValue)}>{display(initialValue)}</button>:<strong>{display(value)}</strong>}
      <button type="button" aria-label={`Sumar ${step} a ${label}`} onClick={()=>onChange(Number(Math.min(max,(Number(value??initialValue)||0)+step).toFixed(2)))}>+{display(step)}</button>
      <button type="button" className="stepper-keyboard" onClick={()=>setKeyboard(!keyboard)}>Teclado</button>
      <button type="button" onClick={()=>{setEditing(false);setKeyboard(false);}}>Listo</button>
      {keyboard&&<input autoFocus aria-label={`Escribir ${label}`} type="number" inputMode={step===1?'numeric':'decimal'} min={min} max={max} step="any" value={value??''} onChange={event=>onChange(event.target.value===''?'':Number(event.target.value))}/>}
    </div>}
  </div>;
}

function ExerciseCard({exercise:ex,index,date,data,logs,change,saving,onConfirm}){
  const draft=useFormDraft(`quick:${date}:${ex.id}`,date);
  const [edits,setEdits]=useState(draft.initial),[error,setError]=useState('');
  const inFlight=useRef(new Set()),effective=logs.filter(log=>log.kind==='effective'),history=previousEffectiveSession(data,ex,date),previous=history[0];
  const finished=Boolean(data.sessionMeta?.[date]?.endedAt),unit=ex.equipment==='dumbbell'?'kg/mano':ex.weightMode==='added-load'?'kg lastre':'kg';
  const setEdit=(key,value)=>{draft.touch();setEdits(current=>{const next={...current,[key]:value};draft.remember(next);return next;});};
  const value=(key,fallback)=>Object.hasOwn(edits,key)?edits[key]:fallback;
  async function confirm(row,values){
    if(inFlight.current.has(row))return;
    inFlight.current.add(row);setError('');
    try{
      const pending=onConfirm?onConfirm(ex,date,row,values):change(state=>confirmQuickSet(state,ex,date,row,values));
      try{navigator.vibrate?.(20);}catch{/* Optional haptic support. */}
      if(await pending){setEdits(current=>{const remaining=Object.fromEntries(Object.entries(current).filter(([key])=>!key.startsWith(`${row}:`)));if(Object.keys(remaining).length)draft.remember(remaining);else draft.clear();return remaining;});}
      else {
        setError('No se pudo guardar. Tus valores siguen aqu\u00ed; vuelve a tocar \u2713.');
        setEdits(current=>{const next={...current,[`${row}:weight`]:values.weight,[`${row}:reps`]:values.reps,[`${row}:technique`]:!!values.technique};for(const [part,item] of (values.extensions??[]).entries()){next[`${row}:drop:${part}:weight`]=item.weight;next[`${row}:extra:${part}:reps`]=item.reps;}draft.touch();draft.remember(next);return next;});
      }
    }catch(error){setError(error.message||'No se pudo guardar. Revisa los valores.');}
    finally{inFlight.current.delete(row);}
  }
  const handlers=useRef({confirm,setEdit});handlers.current={confirm,setEdit};
  const confirmRow=useCallback((...args)=>handlers.current.confirm(...args),[]),editRow=useCallback((...args)=>handlers.current.setEdit(...args),[]);
  return <article className={`fast-exercise ${effective.length>=ex.sets?'fast-complete':''}`} aria-label={ex.name}>
    <header className="fast-exercise-heading"><span className="fast-index">{String(index+1).padStart(2,'0')}</span><h2>{ex.name}</h2><small>{effective.length}/{ex.sets}</small></header>
    {ex.loadType==='heavy'&&<p className="fast-warmup">Calentamiento: 1–2 progresivas + 1 de ajuste (no se registra)</p>}
    <ExercisePainNotice data={data} exercise={ex} date={date}/>
    <div className="fast-series" style={{'--series-count':ex.sets}} role="group" aria-label={`Series de ${ex.name}`}>
      {Array.from({length:ex.sets},(_,row)=>{
        const stored=effective[row],suggestion=quickSetValues(data,ex,date,row,logs),last=row===ex.sets-1;
        const weight=stored?.weight??value(`${row}:weight`,history.length||effective.length?suggestion.weight:null),reps=stored?.reps??value(`${row}:reps`,suggestion.reps);
        const kind=last&&!ex.deload&&['drop','rp'].includes(ex.technique)?ex.technique:null,extensions=stored?logs.filter(log=>log.parentId===stored.id):[];
        const selected=stored?extensions.length>0:Boolean(value(`${row}:technique`,false)),count=kind==='drop'?(ex.dropCount??1):(ex.rpCount??2);
        const past=history[row],previousExtensions=past?data.logs.filter(log=>log.parentId===past.id&&log.kind===kind):[];
        const techniqueValues=Array.from({length:count},(_,part)=>({weight:kind==='rp'?weight:value(`${row}:drop:${part}:weight`,dropWeight(ex,weight,part)),reps:value(`${row}:extra:${part}:reps`,previousExtensions[part]?.reps??(kind==='rp'?4:null))}));
        const disabled=saving||finished||!!stored,rowLabel=`${ex.name}, serie ${row+1}`;
        const model={row,rowLabel,kind,selected,disabled,stored:!!stored,role:suggestion.role,weight,reps,count,unit,initialWeight:suggestion.weight,canConfirm:row===effective.length,extensions:extensions.map(log=>({weight:log.weight,reps:log.reps})),techniqueValues,inheritedWeight:!Object.hasOwn(edits,`${row}:weight`),inheritedReps:!Object.hasOwn(edits,`${row}:reps`)};
        return <SeriesRow key={row} model={model} confirm={confirmRow} setEdit={editRow}/>;
      })}
    </div>
    <div className="series-guidance"><ProgressionControl compact hideFeedback previousMark={previous?`${previous.date} · ${display(previous.weight)}×${previous.reps} · ${unit}`:'Sin historial: toca — para elegir peso.'} data={data} ex={ex} date={date} change={change} saving={saving} complete={effective.length===ex.sets}/><FailureSafety data={data} exercise={ex} enabled={ex.loadType==='heavy'} change={change} saving={saving} compact/></div>
    <ProgressionControl feedbackOnly data={data} ex={ex} date={date} change={change} saving={saving} complete={effective.length===ex.sets}/>
    {error&&<p className="fast-error" role="alert">{error}</p>}
  </article>;
}

const SeriesRow=memo(function SeriesRow({model,confirm,setEdit}){
  const {row,rowLabel,kind,selected,disabled,stored,role,weight,reps,count,canConfirm,extensions,techniqueValues,inheritedWeight,inheritedReps,unit,initialWeight}=model;
  const previousStored=useRef(stored),[pulse,setPulse]=useState(false);
  useEffect(()=>{const justSaved=stored&&!previousStored.current;previousStored.current=stored;if(!stored){setPulse(false);return;}if(!justSaved)return;setPulse(true);const id=setTimeout(()=>setPulse(false),200);return()=>clearTimeout(id);},[stored]);
  globalThis.__BG_PERF__?.rowRender?.(rowLabel);
  return <div className={`fast-set series-card ${stored?'confirmed':canConfirm?'active':'pending'} ${pulse?'check-pulse':''}`} data-series={row+1}>
          <div className="fast-set-line">
            <div className="fast-role"><small>S{row+1}</small>{kind?<button type="button" className="technique-toggle" aria-label={`${kind==='drop'?'Drop':'RP'} en ${rowLabel}`} aria-pressed={selected} disabled={disabled} onClick={()=>setEdit(`${row}:technique`,!selected)}>{kind==='drop'?'DROP':'RP'} <span>{selected?'●':'○'}</span></button>:roles[role]&&<span>{roles[role]}</span>}</div>
            <div className="series-metric"><NumberControl label={`Peso de ${rowLabel}`} value={weight} initialValue={initialWeight} step={2.5} inherited={!stored&&inheritedWeight} disabled={disabled} onChange={next=>setEdit(`${row}:weight`,next)}/><small>{unit}</small></div>
            <div className="series-metric"><NumberControl label={`Reps de ${rowLabel}`} value={reps} step={1} min={1} max={200} inherited={!stored&&inheritedReps} disabled={disabled} onChange={next=>setEdit(`${row}:reps`,next)}/><small>reps</small></div>
            <button type="button" className="fast-confirm" aria-label={`${stored?'Guardada':'Confirmar'} ${rowLabel}`} disabled={disabled||!canConfirm||weight==null||weight===''} onClick={()=>confirm(row,{weight,reps,technique:selected?kind:null,extensions:techniqueValues})}>✓</button>
          </div>
          {role==='light'&&!stored&&<small className="fast-row-hint">Ligera · 12–15 reps{weight==null?' · elige carga':''}</small>}
          {selected&&kind&&<div className="fast-technique" aria-label={`Detalle ${kind} de ${rowLabel}`}>
            <small>{kind==='drop'?'−30% · caída':'RP · 15–20 s'}</small>
            {Array.from({length:count},(_,part)=><div className="fast-mini" key={part}>
              {kind==='drop'&&<><NumberControl label={`Peso caída ${part+1} de ${rowLabel}`} value={extensions[part]?.weight??techniqueValues[part].weight} step={2.5} disabled={disabled} onChange={next=>setEdit(`${row}:drop:${part}:weight`,next)}/><small>kg ×</small></>}
              <NumberControl label={`Reps ${kind==='drop'?'caída':'RP'} ${part+1} de ${rowLabel}`} value={extensions[part]?.reps??techniqueValues[part].reps} step={1} min={1} max={200} disabled={disabled} onChange={next=>setEdit(`${row}:extra:${part}:reps`,next)}/>
            </div>)}
          </div>}
        </div>;
},(previous,next)=>JSON.stringify(previous.model)===JSON.stringify(next.model));
const same=(a,b)=>a===b||JSON.stringify(a)===JSON.stringify(b);
const visibleExercise=({approaches,preparationSteps,preparationReason,automaticApproaches,preparationWarning,...exercise})=>exercise;
export function equalExerciseView(a,b){
  const ex=a.exercise;if(a.date!==b.date||a.index!==b.index||a.saving!==b.saving||!same(visibleExercise(ex),visibleExercise(b.exercise))||!same(a.logs,b.logs))return false;
  const before=a.data,after=b.data;
  if(before.sessionMeta?.[a.date]?.endedAt!==after.sessionMeta?.[b.date]?.endedAt)return false;
  if(!same(before.profiles[ex.profileId],after.profiles[ex.profileId]))return false;
  for(const key of ['journal','safetySettings','deloads'])if(!same(before[key],after[key]))return false;
  for(const key of ['exerciseFeedback','progressionDecisions'])if(!same((before[key]??[]).filter(row=>row.exerciseId===ex.id),(after[key]??[]).filter(row=>row.exerciseId===ex.id)))return false;
  const past=before.logs.filter(row=>row.date<a.date&&row.profileId===ex.profileId),nextPast=after.logs.filter(row=>row.date<b.date&&row.profileId===ex.profileId);
  return past.length===nextPast.length&&past.every((row,index)=>same(row,nextPast[index]));
}
export default memo(ExerciseCard,equalExerciseView);
