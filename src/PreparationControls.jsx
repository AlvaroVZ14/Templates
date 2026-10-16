import { useEffect, useId, useRef, useState } from 'react';
import { contextualPreparation, isPressDay, setPreparationCount } from './preparation.js';
import { preparationSuggestions } from './domain.js';
import { dayContext } from './program/nutrition.js';
import './preparation-ui.css';

export function PreparationCount({exercise:ex,data,date,currentWeight,reference,target,preparations,logs,unit,onReferenceChange,onTargetChange,onSaveReference,onSave,change,saving}){
  const dialog=useRef(null),id=useId(),busy=useRef(false);
  const [open,setOpen]=useState(false),[choice,setChoice]=useState(ex.preparationOverride??null),[feedback,setFeedback]=useState(''),[sheetError,setSheetError]=useState('');
  const base=data.routine.flat().find(item=>item.id===ex.id)??ex;
  const session=dayContext(data,date).exercises;
  const list=session.some(item=>item.id===ex.id)?session:data.routine.find(items=>items.some(item=>item.id===ex.id))??[base];
  const minimum=data.preparationSettings?.minimum??0;
  const completed=new Set(data.logs.filter(log=>log.date===date&&log.kind==='effective').map(log=>log.exerciseId));
  const automatic=contextualPreparation({...base,preparationOverride:null},list,minimum,completed);
  const previewPlan=contextualPreparation({...base,preparationOverride:choice},list,minimum,completed);
  const preview=preparationSuggestions({...ex,...previewPlan},currentWeight);
  const manual=ex.preparationOverride!=null;
  useEffect(()=>{
    if(!open)return;
    const element=dialog.current,oldOverflow=document.body.style.overflow;
    element.showModal();document.body.style.overflow='hidden';
    return()=>{element.close();document.body.style.overflow=oldOverflow;};
  },[open]);
  function show(){setChoice(ex.preparationOverride??null);setSheetError('');setOpen(true);}
  async function saveChoices(event){
    event.preventDefault();if(busy.current||saving)return;
    busy.current=true;setSheetError('');
    try{
      if(currentWeight===null && previewPlan.approaches>0){setSheetError('Ingresa tu peso de trabajo para calcular las cargas.');return;}
      const savedProfile=data.profiles[ex.profileId];
      if(currentWeight!==null && (currentWeight!==savedProfile?.workWeight||Number(target)!==savedProfile?.targetReps) && !(await onSaveReference())){setSheetError('Revisa el peso de trabajo y las reps objetivo.');return;}
      if(await change(state=>setPreparationCount(state,ex.id,choice))){setOpen(false);setFeedback(choice===null?'Previas automáticas guardadas.':'Ajuste manual de previas guardado.');}
      else setSheetError('No se pudo guardar el ajuste. Puedes volver a intentarlo.');
    }finally{busy.current=false;}
  }
  async function saveChip(step){
    if(busy.current||saving||logs.some(log=>log.kind==='approach'&&log.step===step.step))return;
    busy.current=true;setFeedback('');
    try{
      if(await onSave({...step,rpe:6,failure:false,restReal:''}))setFeedback(`Previa ${step.step} guardada · ${step.weight} ${unit} × ${step.reps}.`);
      else setFeedback('No se pudo guardar la previa. Abre el ejercicio para revisar los datos.');
    }finally{busy.current=false;}
  }
  async function restoreAutomatic(){
    if(busy.current||saving)return;
    busy.current=true;setFeedback('');
    try{
      if(await change(state=>setPreparationCount(state,ex.id,null)))setFeedback('Previas automáticas guardadas.');
      else setFeedback('No se pudo guardar el ajuste. Puedes volver a intentarlo.');
    }finally{busy.current=false;}
  }
  return <div className="preparation-count compact-preparation">
    <div className="preparation-line-row"><button className="preparation-line" type="button" onClick={show} aria-label={`Configurar previas de ${ex.name}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={id}>
      <strong>PREVIAS · {ex.approaches}</strong><span className="preparation-mode">{manual?'(Manual)':'(Auto)'}</span><span className="preparation-help" aria-hidden="true">?</span>
    </button>{manual&&<button type="button" className="preparation-restore" aria-label={`Volver a Auto de ${ex.name}`} disabled={saving} onClick={restoreAutomatic}>Volver a Auto</button>}</div>
    <p className="preparation-context">{ex.preparationReason}</p>
    {ex.preparationWarning&&<p className="error">{ex.preparationWarning}</p>}
    <div className="preparation-chips" aria-label={`Previas calculadas de ${ex.name}`}>
      {currentWeight===null?<button type="button" className="preparation-missing" onClick={show}>Ingresa tu peso de trabajo <span aria-hidden="true">＋</span></button>:preparations.length===0?<span className="preparation-none">Sin previas para este ejercicio.</span>:preparations.map(step=>{
        const saved=logs.find(log=>log.kind==='approach'&&log.step===step.step);
        return <button key={step.step} type="button" className={`preparation-chip ${saved?'is-complete':''}`} aria-label={`${saved?'Previa guardada':'Guardar previa'} ${step.step} de ${ex.name}`} disabled={saving||!!saved||currentWeight>1500} onClick={()=>saveChip(step)}>
          <span className="preparation-chip-mark" aria-hidden="true">{saved?'✓':String(step.step).padStart(2,'0')}</span><span><b>{saved?saved.weight:step.weight}<small> {unit}</small></b><span>{step.percent}% · × {saved?saved.reps:(step.repRange??step.reps)} reps · sin fallo</span></span>
        </button>;
      })}
    </div>
    {feedback&&<p className="preparation-feedback" role="status">{feedback}</p>}
    <dialog ref={dialog} id={id} className="preparation-sheet" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event=>{event.preventDefault();setOpen(false);}} onClose={()=>setOpen(false)} onClick={event=>{if(event.target!==event.currentTarget)return;const box=event.currentTarget.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)setOpen(false);}}>
      <div className="preparation-sheet-heading"><div><span className="eyebrow">PREPARACIÓN</span><h2 id={`${id}-title`}>Previas · {ex.name}</h2></div><button type="button" className="icon-button" aria-label={`Cerrar previas de ${ex.name}`} onClick={()=>setOpen(false)}>×</button></div>
      <p id={`${id}-description`}>Preparan el músculo y la técnica, lejos del fallo. No cuentan como volumen.</p>
      <form id={`${id}-form`} onSubmit={saveChoices}>
        <div className="preparation-sheet-choices" role="group" aria-label={`Cantidad de previas de ${ex.name}`}>
          <button type="button" className="preparation-auto" aria-label={`Previas automáticas de ${ex.name}`} aria-pressed={choice===null} disabled={saving} onClick={()=>setChoice(null)}>Auto <span>Recomendado · {automatic.approaches} previas</span></button>
          <div className="preparation-manual-options">{[0,1,2,3].map(count=><button key={count} type="button" aria-label={`Previas ${count} de ${ex.name}`} aria-pressed={choice===count} disabled={saving} onClick={()=>setChoice(count)}>{count}</button>)}</div>
        </div>
        <div className="preparation-auto-reason"><strong>¿Por qué Auto propone {automatic.approaches}?</strong><p>{automatic.preparationReason}</p></div>
        {previewPlan.preparationWarning&&<p className="error">{previewPlan.preparationWarning}</p>}
        {choice!==null&&<div className="preparation-manual-note"><span>Manual · {previewPlan.approaches} previas{minimum>choice&&previewPlan.approaches>choice?` · mínimo global ${minimum}`:''}</span><button type="button" className="quiet" onClick={()=>setChoice(null)} disabled={saving}>Volver a Auto</button></div>}
        <div className="input-pair"><label>{currentWeight===null?'Ingresa tu peso de trabajo':'Peso de trabajo'} ({unit})<input aria-label={`Peso de trabajo para previas de ${ex.name}`} type="number" min="0" max="1500" step="0.5" inputMode="decimal" value={reference} onChange={event=>onReferenceChange(event.target.value)} placeholder="Ingresa los kg"/></label><label>Reps objetivo<input aria-label={`Reps objetivo para previas de ${ex.name}`} type="number" min="1" max="200" value={target} onChange={event=>onTargetChange(event.target.value)}/></label></div>
        <section className="preparation-live-preview" aria-label={`Vista previa de ${ex.name}`}><h3>Vista previa · {previewPlan.approaches} previas</h3>{currentWeight===null?<p>Ingresa tu peso para ver las cargas calculadas.</p>:preview.length===0?<p>Sin previas. Se conservan las que ya registraste.</p>:<ol>{preview.map(step=><li key={step.step}><strong>{step.weight} <small>{unit}</small> × {step.reps}</strong><span>{step.percent}% · sin fallo</span></li>)}</ol>}<p>Redondeo: {ex.increment} kg. Nunca más del 80%.</p></section>
        {sheetError&&<p className="error" role="alert">{sheetError}</p>}
      </form>
      <div className="preparation-sheet-actions"><button className="primary full" type="submit" form={`${id}-form`} disabled={saving}>Guardar previas</button></div>
    </dialog>
  </div>;
}
export default function PreparationSettings({data,date,exercises,change,saving}){
  const settings=data.preparationSettings,activity=data.preparationActivities[date]??{},press=isPressDay(exercises);
  function setting(patch){return change(state=>({...state,preparationSettings:{...state.preparationSettings,...patch}}));}
  function check(key,value){return change(state=>({...state,preparationActivities:{...state.preparationActivities,[date]:{...state.preparationActivities[date],[key]:value}}}));}
  return <section className="preparation-settings"><details className="program-details"><summary>Preparación: ajustes globales y opcionales</summary><div className="program-form"><label>Mínimo de previas<select aria-label="Mínimo de previas" value={settings.minimum} disabled={saving} onChange={event=>setting({minimum:Number(event.target.value)})}><option value="0">0 · permite ejercicios sin previas</option><option value="1">1 · al menos una en cada ejercicio</option></select></label><p className="field-note">El mínimo global se aplica salvo cuando eliges 0 manual en un compuesto pesado: se permite con aviso. Auto recalcula al cambiar el orden; 0–3 guarda tu elección por ejercicio. No se borran series realizadas.</p><label className="check-label"><input type="checkbox" aria-label="Activar calentamiento general" checked={settings.general} disabled={saving} onChange={event=>setting({general:event.target.checked})}/><span>Calentamiento general opcional · 5–10 min</span></label>{settings.general&&<label>Duración del calentamiento general<select aria-label="Duración del calentamiento general" value={settings.generalMinutes} disabled={saving} onChange={event=>setting({generalMinutes:Number(event.target.value)})}>{[5,6,7,8,9,10].map(value=><option key={value} value={value}>{value} min</option>)}</select></label>}<label className="check-label"><input type="checkbox" aria-label="Activar rotadores antes de press" checked={settings.rotators} disabled={saving} onChange={event=>setting({rotators:event.target.checked})}/><span>Rotadores opcionales antes de press · 2 × 12, sin fallo</span></label></div></details>
    {exercises.length>0&&(settings.general||settings.rotators&&press)&&<div className="optional-preparation"><h3>Antes de las pesas · opcional</h3>{settings.general&&<label className="check-label"><input type="checkbox" aria-label="Calentamiento general realizado" checked={activity.general??false} disabled={saving} onChange={event=>check('general',event.target.checked)}/><span>Calentamiento general · {settings.generalMinutes} min</span></label>}{settings.rotators&&press&&[1,2].map(step=><label className="check-label" key={step}><input type="checkbox" aria-label={`Rotadores serie ${step} realizada`} checked={activity[`rotators${step}`]??false} disabled={saving} onChange={event=>check(`rotators${step}`,event.target.checked)}/><span>Rotadores · serie {step} × 12, sin fallo</span></label>)}<p className="field-note">Se guarda por fecha. No cuenta como volumen ni sustituye las previas del ejercicio.</p></div>}
  </section>;
}
