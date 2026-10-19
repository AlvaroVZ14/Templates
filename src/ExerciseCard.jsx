import {Cracks,Stamp} from './Grunge.jsx';
import {useFormDraft,useDraftState} from './drafts.jsx';
import { useEffect, useRef, useState } from 'react';
import { EQUIPMENT, EXTENSIONS, KINDS, exerciseHistory, extensionSuggestions, formatSeconds, preparationSuggestions, recordSet, removeLog, validateLog } from './domain.js';
import ExerciseHistory from './ExerciseHistory.jsx';
import { trainingLogError } from './training.js';
import { ProgressionPanel } from './TrainingPanels.jsx';
import { PreparationCount } from './PreparationControls.jsx';
import './set-animations.css';
import {ExercisePainNotice,FailureSafety} from './Pain.jsx';

export default function ExerciseCard({ exercise: ex, index, date, data, logs, expanded, toggle, change, saving, startTimer,gym=false,current=false,next=false }) {
  const draft=useFormDraft(`exercise:${date}:${ex.id}`,date);
  const profile = data.profiles[ex.profileId] ?? { workWeight: null, targetReps: 8, notes: '' };
  const [reference, setReference] = useDraftState(draft,'reference',profile.workWeight === null ? '' : String(profile.workWeight));
  const [target, setTarget] = useDraftState(draft,'target',String(profile.targetReps));
  const [kind, setKind] = useDraftState(draft,'kind','effective');
  const [weight, setWeight] = useDraftState(draft,'weight',profile.workWeight === null ? '' : String(profile.workWeight));
  const [reps, setReps] = useDraftState(draft,'reps',String(profile.targetReps));
  const [rpe, setRpe] = useDraftState(draft,'rpe','10');
  const [restReal,setRestReal]=useDraftState(draft,'restReal','');
  const [failure, setFailure] = useDraftState(draft,'failure',true);
  const [parent, setParent] = useDraftState(draft,'parent','');
  const [panel, setPanel] = useDraftState(draft,'panel',draft.initial.kind && draft.initial.kind !== 'effective' ? 'manual' : 'effective');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [savedEffective, setSavedEffective] = useState('');
  const [savedSet,setSavedSet]=useState('');
  useEffect(()=>{if(savedSet){const id=setTimeout(()=>setSavedSet(''),350);return()=>clearTimeout(id);}},[savedSet]);
  const [failureMotion, setFailureMotion] = useState(0);
  const preparationSaves=useRef(new Set());
  const observedPreparations=useRef(new Set(logs.filter(log=>log.kind==='approach'&&log.step).map(log=>log.step)));
  const effective = logs.filter(log => log.kind === 'effective');
  const selectedParent = effective.find(log => log.id === parent) ?? effective.at(-1);
  const currentWeight = reference.trim() !== '' && Number.isFinite(Number(reference)) && Number(reference) >= 0 ? Number(reference) : null;
  const linkedLogs = logs.filter(log => log.parentId === selectedParent?.id);
  const history = exerciseHistory(data, ex);
  const previous = history.filter(log => log.date <= date).at(-1);
  const preparations = preparationSuggestions(ex, currentWeight);
  const extensions = extensionSuggestions(ex, selectedParent?.weight ?? currentWeight, ex.technique, linkedLogs);
  const unit = ex.equipment === 'dumbbell' ? 'kg por mano' : 'kg';
  const allowed = Object.entries(KINDS).filter(([value]) => (!ex.deload||!EXTENSIONS.includes(value))&&(!['forced', 'negative'].includes(value) || ex[value]));

  useEffect(()=>draft.remember({reference,target,kind,weight,reps,rpe,restReal,failure,parent,panel}),[reference,target,kind,weight,reps,rpe,restReal,failure,parent,panel]);
  const firstProfile=useRef(true),firstMode=useRef(true);
  useEffect(() => {
    if(firstProfile.current){firstProfile.current=false;if(draft.restored)return;}
    if(draft.dirty.current)return;
    setReference(profile.workWeight === null ? '' : String(profile.workWeight));
    setTarget(String(profile.targetReps));
    if (kind === 'effective') { setWeight(profile.workWeight === null ? '' : String(profile.workWeight)); setReps(String(profile.targetReps)); }
  }, [profile.workWeight, profile.targetReps]);
  useEffect(() => { if (['forced', 'negative'].includes(kind) && !ex[kind]) chooseKind('effective'); }, [ex.forced, ex.negative]);
  useEffect(() => { if(firstMode.current){firstMode.current=false;if(draft.restored&&!ex.deload)return;} setKind('effective'); setFailure(!ex.deload); setRpe(ex.deload?'6':'10'); }, [ex.deload]);
  useEffect(()=>{
    const current=new Set(logs.filter(log=>log.kind==='approach'&&log.step).map(log=>log.step));
    for(const step of observedPreparations.current)if(!current.has(step))preparationSaves.current.delete(step);
    observedPreparations.current=current;
  },[logs]);

  function referenceError() {
    if (currentWeight === null || currentWeight > 1500) return 'Ingresa tu peso de trabajo entre 0 y 1500 kg.';
    if (!Number.isInteger(Number(target)) || Number(target) < 1 || Number(target) > 200) return 'Las reps objetivo deben estar entre 1 y 200.';
    return null;
  }
  async function saveReference(event) {
    event?.preventDefault(); setError(''); setMessage('');
    const invalid = referenceError(); if (invalid) { setError(invalid); return false; }
    if (await change(state => ({ ...state, profiles: { ...state.profiles, [ex.profileId]: { ...profile, ...state.profiles[ex.profileId], workWeight: currentWeight, targetReps: Number(target) } } }))) {
      draft.clear();setWeight(String(currentWeight)); setReps(target); setMessage('Peso de trabajo guardado.');
      return true;
    }
    return false;
  }
  function updateReference(value){draft.touch();setReference(value);if(kind==='effective')setWeight(value);}
  function updateTarget(value){draft.touch();setTarget(value);if(kind==='effective')setReps(value);}
  async function savePreparation(values){
    if(preparationSaves.current.has(values.step)||logs.some(log=>log.kind==='approach'&&log.step===values.step))return false;
    preparationSaves.current.add(values.step);
    try{
      const success=await saveSet(values);
      if(!success)preparationSaves.current.delete(values.step);
      return success;
    }catch(error){preparationSaves.current.delete(values.step);throw error;}
  }
  function chooseKind(value) {
    setKind(value); setMessage(''); setError('');
    const prep = ['warmup', 'approach'].includes(value);
    const nextStep = linkedLogs.filter(log => log.kind === value).length;
    const suggestion = prep ? preparations.find(step => !logs.some(log => log.kind === 'approach' && log.step === step.step)) ?? preparations[0] ?? preparationSuggestions({...ex,approaches:1,preparationSteps:undefined},currentWeight)[0] : extensionSuggestions(ex, selectedParent?.weight ?? currentWeight, value, linkedLogs)[nextStep];
    setWeight(suggestion ? String(suggestion.weight) : currentWeight === null ? '' : String(currentWeight));
    setReps(String(suggestion?.reps ?? (value === 'rp' ? 4 : profile.targetReps)));
    setFailure(!prep&&!ex.deload); setRpe(prep||ex.deload ? '6' : '10');
  }
  async function saveSet(values) {
    setError(''); setMessage('');
    const log = { id: crypto.randomUUID(), exerciseId: ex.id, profileId: ex.profileId, equipment: ex.equipment, exerciseName: ex.name, muscle: ex.muscle, date, kind: values.kind, weight: Number(values.weight), reps: Number(values.reps), rpe: Number(values.rpe), failure: ['warmup', 'approach'].includes(values.kind) ? false : values.failure, restRealSeconds:values.restReal==null||values.restReal===''?null:Number(values.restReal),step: values.step ?? null, parentId: EXTENSIONS.includes(values.kind) ? selectedParent?.id ?? null : null, createdAt: new Date().toISOString() };
    if ([values.weight, values.reps, values.rpe].some(value => String(value).trim() === '')) { setError('Completa el peso, las repeticiones y el RPE.'); return false; }
    const invalid = validateLog(log, ex, data.logs); if (invalid) { setError(invalid); return false; }
    const validationState=referenceError()||ex.deload?data:{...data,profiles:{...data.profiles,[ex.profileId]:{...profile,workWeight:currentWeight}}};
    const trainingError = trainingLogError(validationState,ex,log); if (trainingError) { setError(trainingError); return false; }
    const success = await change(state => {
      const next = referenceError()||ex.deload ? state : { ...state, profiles: { ...state.profiles, [ex.profileId]: { ...profile, ...state.profiles[ex.profileId], workWeight: currentWeight, targetReps: Number(target) } } };
      return recordSet(next, ex, log);
    });
    if (success) {setSavedSet(log.id);if(!values.step)draft.clear();if(log.kind === 'effective')setSavedEffective(log.id);setMessage(`${KINDS[log.kind]} guardada · ${log.weight} ${unit} × ${log.reps} · RPE ${log.rpe}`);}
    return success;
  }
  const rows = (items, title) => items.length > 0 && <div className="log-group"><h4>{title}</h4>{items.map(log => <div className={`log-row ${savedSet===log.id?'fresh-set':''}`} data-kind={log.kind} key={log.id}><span className="log-mark">{log.kind === 'effective' ? '✓' : '·'}</span><div><strong>{KINDS[log.kind]}{log.step ? ` ${log.step}` : ''}{log.parentId ? ` · de E${effective.findIndex(item => item.id === log.parentId) + 1}` : ''}</strong><small>{log.failure ? <><Stamp>FALLO</Stamp>Llegué al fallo</> : 'Sin fallo'} · RPE {log.rpe ?? 'sin dato'}</small></div><b>{log.weight}<small> {unit}</small> × {log.reps}</b><button className="icon-button" aria-label={`Eliminar ${KINDS[log.kind]} de ${ex.name}`} disabled={saving} onClick={() => setDeleting(log.id)}>×</button></div>)}</div>;

  const activePanel = !['preparation','effective','technique','manual'].includes(panel)||panel==='technique'&&!ex.technique ? 'effective' : panel;
  const tabs = [
    {id:'preparation',label:'Previas',detail:currentWeight===null?'Falta peso':preparations.length?preparations.map(step=>`${step.weight}`).join(' / ')+' kg':'Sin previas',count:`${logs.filter(log=>log.kind==='approach'&&log.step).length}/${preparations.length}`},
    {id:'effective',label:'Efectiva',detail:currentWeight===null?'Falta peso':`${currentWeight} kg × ${target}`,count:`${effective.length}/${ex.sets}`},
    ...(ex.technique?[{id:'technique',label:KINDS[ex.technique],detail:currentWeight===null?'Falta peso':extensions.map(step=>step.weight).join(' / ')+' kg',count:`${linkedLogs.filter(log=>log.kind===ex.technique).length}/${extensions.length}`}]:[]),
    {id:'manual',label:'Otras',detail:'Calent. y más'},
  ];
  function openPanel(value){
    setPanel(value);setError('');setMessage('');
    if(value==='effective'&&kind!=='effective')chooseKind('effective');
  }
  const panelId=value=>`quick-${ex.id}-${value}`;
  const prepProps={exercise:ex,data,date,currentWeight,reference,target,preparations,logs,unit,onReferenceChange:updateReference,onTargetChange:updateTarget,onSaveReference:saveReference,onSave:savePreparation,change,saving,expanded};
  return <article className={`exercise-card quick-exercise ${expanded ? 'expanded' : ''} ${current?'gym-current':''} ${next?'gym-next-card':''}`}><Cracks/>
    {savedEffective && <span key={savedEffective} className="effective-save-flash" aria-hidden="true" />}
    <button className="exercise-summary" onClick={toggle} disabled={gym&&saving} aria-expanded={expanded} aria-controls={`exercise-${ex.id}`}><span className={`exercise-number ${effective.length >= ex.sets ? 'complete' : ''}`}>{effective.length >= ex.sets ? '✓' : String(index + 1).padStart(2, '0')}</span><span className="exercise-title"><span className="muscle-label">{current?'ACTUAL · ':next?'SIGUIENTE · ':''}{ex.muscle}</span><strong>{ex.name}</strong><small>{ex.sets} efectivas{ex.technique ? ` + ${KINDS[ex.technique]}` : ''}</small></span><span className="exercise-count">{effective.length}<small>/{ex.sets}</small></span><span className="chevron">›</span></button>
    <ExercisePainNotice data={data} exercise={ex} date={date}/>
    {(!gym||expanded)&&<PreparationCount {...prepProps}/>}
    {expanded && <div className="exercise-body quick-register" id={`exercise-${ex.id}`}>
      <details className="quick-reference" open={profile.workWeight===null?true:undefined}>
        <summary>{profile.workWeight===null?'Configurar peso de trabajo':`Referencia · ${profile.workWeight} ${unit} × ${profile.targetReps}`}<span>Editar</span></summary>
        <form onChangeCapture={draft.touch} className="work-reference" onSubmit={saveReference}>
          <h3>{profile.workWeight === null ? 'Ingresa tu peso de trabajo' : 'Tu peso de trabajo'}</h3>
          <p>{EQUIPMENT[ex.equipment]} · {ex.equipment === 'dumbbell' ? 'Peso por mano.' : 'Carga total.'} Redondeo: {ex.increment} kg.</p>
          <div className="input-pair"><label>Peso ({unit})<input aria-label={`Peso de trabajo de ${ex.name}`} type="number" min="0" max="1500" step="0.5" inputMode="decimal" placeholder="Ingresa los kg" value={reference} onChange={event=>updateReference(event.target.value)} required /></label><label>Reps objetivo<input aria-label={`Reps objetivo de ${ex.name}`} type="number" min="1" max="200" inputMode="numeric" value={target} onChange={event=>updateTarget(event.target.value)} required /></label></div>
          <button type="submit" className="secondary" disabled={saving}>Guardar peso de trabajo</button>
        </form>
      </details>
      <div className="quick-tabs" role="tablist" aria-label={`Registro de ${ex.name}`} onKeyDown={event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const index=tabs.findIndex(tab=>tab.id===activePanel);
        const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
        openPanel(tabs[next].id);document.getElementById(`${panelId(tabs[next].id)}-tab`)?.focus();
      }}>{tabs.map(tab=><button type="button" role="tab" key={tab.id} id={`${panelId(tab.id)}-tab`} aria-controls={panelId(['effective','manual'].includes(tab.id)?'entry':tab.id)} aria-selected={activePanel===tab.id} tabIndex={activePanel===tab.id?0:-1} onClick={()=>openPanel(tab.id)}><span>{tab.label}{tab.count&&<small>{tab.count}</small>}</span><b>{tab.detail}</b></button>)}</div>
      {unit==='kg por mano'&&<p className="quick-unit">Mancuernas: todos los kg son por mano.</p>}
        <div className="previous-set" aria-label="Serie anterior"><span>ANTERIOR · MISMO EJERCICIO</span>{previous?<p>{previous.date} · {KINDS[previous.kind]} · <strong>{previous.weight} {previous.equipment==='dumbbell'?'kg por mano':'kg'} × {previous.reps}</strong> · RPE {previous.rpe??'sin dato'} · {previous.failure?'al fallo':'sin fallo'}</p>:<p>Sin historial. Empieza con tu peso de trabajo.</p>}</div>
      <section className="suggestions quick-suggestions" aria-label={`Sugerencias de ${ex.name}`}>
        <div role="tabpanel" id={panelId('preparation')} aria-labelledby={`${panelId('preparation')}-tab`} hidden={activePanel!=='preparation'}>
          <div className="quick-panel-heading"><h3>Previas</h3><span>Sin fallo · no suman volumen</span></div>
          {currentWeight===null?<p className="suggestion-empty">Ingresa tu peso de trabajo arriba para calcular las previas.</p>:preparations.length===0?<p className="preparation-none">Sin previas para este ejercicio.</p>:preparations.map(step=><SuggestedSet date={date} draftKey={`suggestion:${date}:${ex.id}:${step.kind}:${step.step}`} key={`prep-${step.step}`} suggestion={step} unit={unit} saved={logs.find(log=>log.kind==='approach'&&log.step===step.step)} saving={saving} onSave={savePreparation}/>)}
        </div>
        {ex.technique&&<div role="tabpanel" id={panelId('technique')} aria-labelledby={`${panelId('technique')}-tab`} hidden={activePanel!=='technique'}>
          <div className="quick-panel-heading"><h3>{KINDS[ex.technique]}</h3><span>{ex.technique==='drop'?`${ex.rests.drop} s · cambiar carga`:`${ex.rests.rp} s · meta 3–5 reps`}</span></div>
          {!selectedParent&&<p className="quick-hint">Vista previa. Guarda una efectiva para registrar la técnica.</p>}
          {effective.length>1&&<label>Extensiones de la efectiva<select value={selectedParent?.id??''} onChange={event=>setParent(event.target.value)}>{effective.map((log,i)=><option key={log.id} value={log.id}>E{i+1} · {log.weight} {unit} × {log.reps}</option>)}</select></label>}
          {currentWeight===null&&!selectedParent?<p className="suggestion-empty">Ingresa tu peso de trabajo arriba para calcular {KINDS[ex.technique]}.</p>:extensions.map(step=><SuggestedSet date={date} draftKey={`suggestion:${date}:${ex.id}:${step.kind}:${step.step}:${selectedParent?.id??'preview'}`} fallbackKey={selectedParent?`suggestion:${date}:${ex.id}:${step.kind}:${step.step}:preview`:undefined} key={`${step.kind}-${step.step}-${selectedParent?.id??'preview'}`} suggestion={step} unit={unit} saved={linkedLogs.find(log=>log.kind===step.kind&&log.step===step.step)} saving={saving} blocked={!selectedParent} onSave={saveSet}/>)}
        </div>}
      </section>
      <div role="tabpanel" id={panelId('entry')} aria-labelledby={`${panelId(activePanel==='manual'?'manual':'effective')}-tab`} hidden={!['effective','manual'].includes(activePanel)}>

        <form onChangeCapture={draft.touch} className="set-form quick-set-form" data-kind={kind} onSubmit={event=>{event.preventDefault();saveSet({kind,weight,reps,rpe,failure,restReal});}}>
          <div className="quick-panel-heading"><h3>{activePanel==='manual'?'Registrar otra serie':effective.length>=ex.sets?'Efectivas completas':`Efectiva ${effective.length+1} de ${ex.sets}`}</h3><span>{formatSeconds(ex.rests[kind]??ex.rests.effective)} descanso</span></div>
          <label hidden={activePanel!=='manual'}>Tipo de serie<select value={kind} onChange={event=>chooseKind(event.target.value)}>{allowed.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          {EXTENSIONS.includes(kind)&&<label>Vinculada a<select value={selectedParent?.id??''} onChange={event=>setParent(event.target.value)} required><option value="">Selecciona una efectiva</option>{effective.map((log,i)=><option key={log.id} value={log.id}>E{i+1} · {log.weight} kg × {log.reps}</option>)}</select></label>}
          <div className="quick-values"><label>Carga ({unit})<input aria-label={`Carga de ${ex.name}`} type="number" min="0" max="1500" step="0.5" inputMode="decimal" value={weight} onChange={event=>setWeight(event.target.value)} required /></label><label>Reps<input aria-label={`Repeticiones de ${ex.name}`} type="number" min="1" max="200" inputMode="numeric" value={reps} onChange={event=>setReps(event.target.value)} required /></label><label>RPE<input aria-label={`RPE de ${ex.name}`} type="number" min="0" max="10" step="0.5" inputMode="decimal" value={rpe} onChange={event=>setRpe(event.target.value)} required /></label></div>
          <div className="quick-set-footer"><label className="check-label"><input type="checkbox" checked={failure} disabled={['warmup','approach'].includes(kind)} onChange={event=>{setFailure(event.target.checked);if(event.target.checked)setFailureMotion(value=>value+1);}}/><span key={failureMotion} className={failureMotion?'failure-shake':undefined}>Llegué al fallo</span></label><details className="quick-rest"><summary>Descanso real{restReal!==''?` · ${restReal} s`:''}</summary><label>Antes de la serie (s)<input aria-label={`Descanso real de ${ex.name}`} type="number" min="0" max="86400" inputMode="numeric" value={restReal} onChange={event=>setRestReal(event.target.value)}/></label></details></div>
          <FailureSafety data={data} exercise={ex} enabled={failure&&!['warmup','approach'].includes(kind)} change={change} saving={saving} compact/>
          <button className="primary full" type="submit" disabled={saving}>Guardar serie<span>+ descanso</span></button>
        </form>
      </div>
      {error&&<p className="error" role="alert">{error}</p>}{message&&<p className="success" role="status">{message}</p>}
      {effective.length>0&&ex.technique&&activePanel==='effective'&&<button type="button" className="quick-next secondary full" onClick={()=>openPanel('technique')}>Registrar {KINDS[ex.technique]} →</button>}
      <details className="quick-details quick-records"><summary>Series guardadas <span>{logs.length}</span></summary>{rows(logs.filter(log=>['warmup','approach'].includes(log.kind)),'Preparación · no suma volumen')}{rows(effective,'Series efectivas')}{rows(logs.filter(log=>EXTENSIONS.includes(log.kind)),'Extensiones · no suman otra efectiva')}{logs.length===0&&<p className="field-note">Todavía no hay series guardadas en este ejercicio.</p>}</details>
      {deleting&&<div className="delete-confirm" role="alert"><p>¿Eliminar esta serie{effective.some(log=>log.id===deleting)?' y sus extensiones':''}?</p><button className="danger" disabled={saving} onClick={async()=>{if(await change(state=>({...state,logs:removeLog(state.logs,deleting)})))setDeleting(null);}}>Eliminar</button><button className="quiet" onClick={()=>setDeleting(null)}>Cancelar</button></div>}
      <details className="quick-details"><summary>Progresión, reglas y descansos</summary>
        <ProgressionPanel key={`${ex.profileId}-${date}`} data={data} exercise={ex} date={date} change={change} saving={saving}/>
        <p className="field-note">{ex.preparationReason} Previas sin fallo, máximo 80% del peso de trabajo; no suman volumen. Ejecución controlada en todas las series.</p>
        {ex.technique&&<p className="field-note">{ex.technique==='drop'?`Drop set: −20% por caída, redondeado; ${ex.rests.drop} s solo para cambiar el peso; a fallo.`:`Rest-pause: mismo peso; ${ex.rests.rp} s entre mini-series; a fallo, meta 3–5 reps.`} {selectedParent?`Desde E${effective.indexOf(selectedParent)+1}: ${selectedParent.weight} ${unit}.`:'Primero registra una efectiva para guardar sus extensiones.'}</p>}
        <div className="rest-shortcuts"><span>Iniciar descanso</span>{[['warmup','Calent.'],['effective','Efectiva'],...(ex.technique?[[ex.technique,KINDS[ex.technique]]]:[])].map(([type,label])=><button key={type} disabled={saving} onClick={()=>startTimer(ex.rests[type],`${label} · ${ex.name}`)}>{label} <b>{formatSeconds(ex.rests[type])}</b></button>)}</div>
        {!ex.forced&&!ex.negative&&<p className="technique-note">Forzadas y negativas desactivadas. Se habilitan por ejercicio en Rutina.</p>}
      </details>
      <details className="quick-details quick-history"><summary>Notas e historial</summary><ExerciseHistory date={date} exercise={ex} history={history} profile={profile} change={change} saving={saving}/></details>
    </div>}
  </article>;
}

function SuggestedSet({ suggestion: step, unit, saved, saving, blocked, onSave, draftKey,date,fallbackKey }) {
  const draft=useFormDraft(draftKey,date,fallbackKey);
  const prep = step.kind === 'approach';
  const [weight, setWeight] = useDraftState(draft,'weight',String(step.weight));
  const [reps, setReps] = useDraftState(draft,'reps',step.reps === null ? '' : String(step.reps));
  const [rpe, setRpe] = useDraftState(draft,'rpe',prep ? '6' : '10');
  const [restReal,setRestReal]=useDraftState(draft,'restReal','');
  const [failure, setFailure] = useDraftState(draft,'failure',!prep);
  const [failureMotion, setFailureMotion] = useState(0);
  useEffect(()=>draft.remember({weight,reps,rpe,restReal,failure}),[weight,reps,rpe,restReal,failure]);
  useEffect(() => { if(draft.dirty.current)return;setWeight(String(step.weight)); }, [step.weight]);
  useEffect(() => { if(draft.dirty.current)return;setReps(step.reps===null?'':String(step.reps)); }, [step.reps]);
  const title = prep ? `Aproximación ${step.step}` : step.kind === 'drop' ? `Caída ${step.step}` : `Mini-serie ${step.step}`;
  return <form onChangeCapture={draft.touch} className={`suggested-set ${saved ? 'saved' : ''}`} data-kind={step.kind} aria-label={title} onSubmit={async event => { event.preventDefault(); if(await onSave({ ...step, weight, reps, rpe, failure,restReal }))draft.clear(); }}>
    <div className="suggested-heading"><strong>{title}{saved&&' · ✓ Hecha'}</strong><span>{prep ? `${step.percent}%${step.repRange?` × ${step.repRange}`:''} · sin fallo` : step.kind === 'drop' ? '−20% · a fallo' : 'Mismo peso · a fallo'}</span></div>
    <div className="suggested-inputs"><label>Peso ({unit})<input aria-label={`Peso de ${title}`} type="number" min="0" max="1500" step="0.5" inputMode="decimal" value={saved ? saved.weight : weight} onChange={event => setWeight(event.target.value)} disabled={!!saved} required /></label><label>Reps<input aria-label={`Reps de ${title}`} type="number" min="1" max="200" inputMode="numeric" placeholder={prep ? '' : step.kind === 'rp' ? '3–5' : 'Reales'} value={saved ? saved.reps : reps} onChange={event => setReps(event.target.value)} disabled={!!saved} required /></label><label>RPE<input aria-label={`RPE de ${title}`} type="number" min="0" max="10" step="0.5" inputMode="decimal" value={saved ? saved.rpe ?? '' : rpe} onChange={event => setRpe(event.target.value)} disabled={!!saved} required /></label><button className={saved ? 'secondary' : 'primary'} type="submit" disabled={saving || blocked || !!saved} aria-label={`Guardar ${title}`}><span aria-hidden="true">{saved ? '✓' : blocked ? '—' : '✓'}</span></button></div>
    <div className="suggested-footer">{!prep&&<label className="check-label"><input type="checkbox" checked={saved ? saved.failure : failure} disabled={prep || !!saved} onChange={event => { setFailure(event.target.checked); if(event.target.checked&&!prep)setFailureMotion(value=>value+1); }} /><span key={failureMotion} className={failureMotion&&!prep ? 'failure-shake' : undefined}>{prep ? 'Sin fallo' : 'Llegué al fallo'}</span></label>}
      <details className="quick-rest"><summary>Descanso real{(saved?saved.restRealSeconds:restReal)?` · ${saved?saved.restRealSeconds:restReal} s`:''}</summary><label>Antes de la serie (s)<input aria-label={`Descanso real de ${title}`} type="number" min="0" max="86400" inputMode="numeric" value={saved?saved.restRealSeconds??'':restReal} disabled={!!saved} onChange={event=>setRestReal(event.target.value)}/></label></details></div>
  </form>;
}
