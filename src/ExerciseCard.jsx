import {useFormDraft,useDraftState} from './drafts.jsx';
import { useEffect, useRef, useState } from 'react';
import { EQUIPMENT, EXTENSIONS, KINDS, exerciseHistory, extensionSuggestions, formatSeconds, preparationSuggestions, recordSet, removeLog, validateLog } from './domain.js';
import ExerciseHistory from './ExerciseHistory.jsx';
import { trainingLogError } from './training.js';
import { ProgressionPanel } from './TrainingPanels.jsx';
import { PreparationCount } from './PreparationControls.jsx';
import './set-animations.css';

export default function ExerciseCard({ exercise: ex, index, date, data, logs, expanded, toggle, change, saving, startTimer }) {
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [savedEffective, setSavedEffective] = useState('');
  const [failureMotion, setFailureMotion] = useState(0);
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

  useEffect(()=>draft.remember({reference,target,kind,weight,reps,rpe,restReal,failure,parent}),[reference,target,kind,weight,reps,rpe,restReal,failure,parent]);
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

  function referenceError() {
    if (currentWeight === null || currentWeight > 1500) return 'Ingresa tu peso de trabajo entre 0 y 1500 kg.';
    if (!Number.isInteger(Number(target)) || Number(target) < 1 || Number(target) > 200) return 'Las reps objetivo deben estar entre 1 y 200.';
    return null;
  }
  async function saveReference(event) {
    event.preventDefault(); setError(''); setMessage('');
    const invalid = referenceError(); if (invalid) { setError(invalid); return; }
    if (await change(state => ({ ...state, profiles: { ...state.profiles, [ex.profileId]: { ...profile, ...state.profiles[ex.profileId], workWeight: currentWeight, targetReps: Number(target) } } }))) {
      draft.clear();setWeight(String(currentWeight)); setReps(target); setMessage('Peso de trabajo guardado.');
    }
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
    if (success) {if(!values.step)draft.clear();if(log.kind === 'effective')setSavedEffective(log.id);setMessage(`${KINDS[log.kind]} guardada · ${log.weight} ${unit} × ${log.reps} · RPE ${log.rpe}`);}
    return success;
  }
  const rows = (items, title) => items.length > 0 && <div className="log-group"><h4>{title}</h4>{items.map(log => <div className="log-row" data-kind={log.kind} key={log.id}><span className="log-mark">{log.kind === 'effective' ? '✓' : '·'}</span><div><strong>{KINDS[log.kind]}{log.step ? ` ${log.step}` : ''}{log.parentId ? ` · de E${effective.findIndex(item => item.id === log.parentId) + 1}` : ''}</strong><small>{log.failure ? 'Llegué al fallo' : 'Sin fallo'} · RPE {log.rpe ?? 'sin dato'}</small></div><b>{log.weight}<small> {unit}</small> × {log.reps}</b><button className="icon-button" aria-label={`Eliminar ${KINDS[log.kind]} de ${ex.name}`} disabled={saving} onClick={() => setDeleting(log.id)}>×</button></div>)}</div>;

  return <article className={`exercise-card ${expanded ? 'expanded' : ''}`}>
    {savedEffective && <span key={savedEffective} className="effective-save-flash" aria-hidden="true" />}
    <button className="exercise-summary" onClick={toggle} aria-expanded={expanded} aria-controls={`exercise-${ex.id}`}><span className={`exercise-number ${effective.length >= ex.sets ? 'complete' : ''}`}>{effective.length >= ex.sets ? '✓' : String(index + 1).padStart(2, '0')}</span><span className="exercise-title"><span className="muscle-label">{ex.muscle}</span><strong>{ex.name}</strong><small>{ex.sets} efectivas{ex.technique ? ` + ${KINDS[ex.technique]}` : ''} · series previas: {ex.approaches}</small></span><span className="exercise-count">{effective.length}<small>/{ex.sets}</small></span><span className="chevron">›</span></button>
    <PreparationCount exercise={ex} change={change} saving={saving} />
    {expanded && <div className="exercise-body" id={`exercise-${ex.id}`}>
      <ProgressionPanel key={`${ex.profileId}-${date}`} data={data} exercise={ex} date={date} change={change} saving={saving} />
      <form onChangeCapture={draft.touch} className="work-reference" onSubmit={saveReference}>
        <h3>{profile.workWeight === null ? 'Ingresa tu peso de trabajo' : 'Tu peso de trabajo'}</h3>
        <p>{EQUIPMENT[ex.equipment]} · {ex.equipment === 'dumbbell' ? 'Registra el peso de una mancuerna, por mano.' : 'Carga total de trabajo.'} Redondeo: {ex.increment} kg.</p>
        <div className="input-pair"><label>{profile.workWeight === null ? 'Ingresa tu peso de trabajo' : 'Peso de trabajo'} ({unit})<input aria-label={`Peso de trabajo de ${ex.name}`} type="number" min="0" max="1500" step="0.5" inputMode="decimal" placeholder="Ingresa los kg" value={reference} onChange={event => { setReference(event.target.value); if (kind === 'effective') setWeight(event.target.value); }} required /></label><label>Reps objetivo<input aria-label={`Reps objetivo de ${ex.name}`} type="number" min="1" max="200" value={target} onChange={event => { setTarget(event.target.value); if (kind === 'effective') setReps(event.target.value); }} required /></label></div>
        <button type="submit" className="secondary" disabled={saving}>Guardar peso de trabajo</button>
      </form>
      {currentWeight === null ? <p className="suggestion-empty">Ingresa tu peso de trabajo arriba para ver los pesos sugeridos de preparación{ex.technique ? ` y ${KINDS[ex.technique]}` : ''}.</p> : <section className="suggestions" aria-label={`Sugerencias de ${ex.name}`}>
        <div className="section-heading"><h3>Antes de la efectiva</h3><span>Sin fallo · máximo 80% · no suma volumen</span></div>
        {preparations.length===0&&<p className="field-note">Sin previas sugeridas para este ejercicio según tu contexto y ajustes.</p>}
        {preparations.map(step => <SuggestedSet date={date} draftKey={`suggestion:${date}:${ex.id}:${step.kind}:${step.step}`} key={`prep-${step.step}`} suggestion={step} unit={unit} saved={logs.find(log => log.kind === 'approach' && log.step === step.step)} saving={saving} onSave={saveSet} />)}
        <div className="work-preview" data-kind="effective"><span>Serie efectiva · meta</span><strong>{currentWeight} <small>{unit}</small></strong><b>× {target || '—'} reps</b></div>
        {ex.technique && <><div className="section-heading"><h3>{KINDS[ex.technique]} · después de la efectiva</h3></div><p className="field-note">{ex.technique === 'drop' ? `−20% por caída, redondeado · ${ex.rests.drop} s solo para cambiar la carga · a fallo.` : `Mismo peso · ${ex.rests.rp} s entre mini-series · a fallo, meta 3–5 reps.`} {selectedParent ? `Desde E${effective.indexOf(selectedParent) + 1}: ${selectedParent.weight} ${unit}.` : 'Vista previa. Primero registra una efectiva para guardar sus extensiones.'}</p>
          {effective.length > 1 && <label>Extensiones de la efectiva<select value={selectedParent?.id ?? ''} onChange={event => setParent(event.target.value)}>{effective.map((log, i) => <option key={log.id} value={log.id}>E{i + 1} · {log.weight} {unit} × {log.reps}</option>)}</select></label>}
          {extensions.map(step => <SuggestedSet date={date} draftKey={`suggestion:${date}:${ex.id}:${step.kind}:${step.step}:${selectedParent?.id??"preview"}`} fallbackKey={selectedParent?`suggestion:${date}:${ex.id}:${step.kind}:${step.step}:preview`:undefined} key={`${step.kind}-${step.step}-${selectedParent?.id ?? 'preview'}`} suggestion={step} unit={unit} saved={linkedLogs.find(log => log.kind === step.kind && log.step === step.step)} saving={saving} blocked={!selectedParent} onSave={saveSet} />)}
        </>}
      </section>}
      <div className="previous-set" aria-label="Serie anterior"><span>SERIE ANTERIOR · MISMO EJERCICIO</span>{previous ? <p>{previous.date} · {KINDS[previous.kind]} · <strong>{previous.weight} {previous.equipment === 'dumbbell' ? 'kg por mano' : 'kg'} × {previous.reps}</strong> · RPE {previous.rpe ?? 'sin dato'} · {previous.failure ? 'al fallo' : 'sin fallo'}</p> : <p>Aún sin historial. Tu primera serie quedará aquí.</p>}</div>
      {rows(logs.filter(log => ['warmup', 'approach'].includes(log.kind)), 'Preparación · no suma volumen')}{rows(effective, 'Series efectivas')}{rows(logs.filter(log => EXTENSIONS.includes(log.kind)), 'Extensiones · no suman otra efectiva')}
      {deleting && <div className="delete-confirm" role="alert"><p>¿Eliminar esta serie{effective.some(log => log.id === deleting) ? ' y sus extensiones' : ''}?</p><button className="danger" disabled={saving} onClick={async () => { if (await change(state => ({ ...state, logs: removeLog(state.logs, deleting) }))) setDeleting(null); }}>Eliminar</button><button className="quiet" onClick={() => setDeleting(null)}>Cancelar</button></div>}
      <form onChangeCapture={draft.touch} className="set-form" data-kind={kind} onSubmit={event => { event.preventDefault(); saveSet({ kind, weight, reps, rpe, failure,restReal }); }}>
        <div className="section-heading small"><h3>Registrar serie</h3><span>Datos reales de la serie</span></div>
        <label>Tipo de serie<select value={kind} onChange={event => chooseKind(event.target.value)}>{allowed.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {EXTENSIONS.includes(kind) && <label>Vinculada a<select value={selectedParent?.id ?? ''} onChange={event => setParent(event.target.value)} required><option value="">Selecciona una efectiva</option>{effective.map((log, i) => <option key={log.id} value={log.id}>E{i + 1} · {log.weight} kg × {log.reps}</option>)}</select></label>}
        <div className="input-pair"><label>Carga ({unit})<input aria-label={`Carga de ${ex.name}`} type="number" min="0" max="1500" step="0.5" inputMode="decimal" value={weight} onChange={event => setWeight(event.target.value)} required /></label><label>Repeticiones<input aria-label={`Repeticiones de ${ex.name}`} type="number" min="1" max="200" value={reps} onChange={event => setReps(event.target.value)} required /></label></div>
        <div className="input-pair"><label>RPE (0–10)<input aria-label={`RPE de ${ex.name}`} type="number" min="0" max="10" step="0.5" inputMode="decimal" value={rpe} onChange={event => setRpe(event.target.value)} required /></label><label className="check-label"><input type="checkbox" checked={failure} disabled={['warmup', 'approach'].includes(kind)} onChange={event => { setFailure(event.target.checked); if(event.target.checked)setFailureMotion(value=>value+1); }} /><span key={failureMotion} className={failureMotion ? 'failure-shake' : undefined}>Llegué al fallo<small>Con ejecución controlada</small></span></label></div>
        <label>Descanso real antes (s, opcional)<input aria-label={`Descanso real de ${ex.name}`} type="number" min="0" max="86400" value={restReal} onChange={event=>setRestReal(event.target.value)}/></label>
        <button className="primary full" type="submit" disabled={saving}>Guardar serie<span>+ descanso</span></button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}{message && <p className="success" role="status">{message}</p>}
      <div className="rest-shortcuts"><span>Descansos</span>{[['warmup', 'Calent.'], ['effective', 'Efectiva'], ...(ex.technique ? [[ex.technique, KINDS[ex.technique]]] : [])].map(([type, label]) => <button key={type} disabled={saving} onClick={() => startTimer(ex.rests[type], `${label} · ${ex.name}`)}>{label} <b>{formatSeconds(ex.rests[type])}</b></button>)}</div>
      {!ex.forced && !ex.negative && <p className="technique-note">Forzadas y negativas desactivadas. Se habilitan por ejercicio en Rutina.</p>}
      <ExerciseHistory date={date} exercise={ex} history={history} profile={profile} change={change} saving={saving} />
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
    <div className="suggested-heading"><strong>{title}</strong><span>{prep ? `${step.percent}%${step.repRange?` × ${step.repRange}`:''} · sin fallo` : step.kind === 'drop' ? '−20% · a fallo' : 'Mismo peso · a fallo'}</span></div>
    <div className="suggested-inputs"><label>Peso sugerido ({unit})<input aria-label={`Peso de ${title}`} type="number" min="0" max="1500" step="0.5" inputMode="decimal" value={saved ? saved.weight : weight} onChange={event => setWeight(event.target.value)} disabled={!!saved} required /></label><label>Reps<input aria-label={`Reps de ${title}`} type="number" min="1" max="200" placeholder={prep ? '' : step.kind === 'rp' ? '3–5' : 'Reales'} value={saved ? saved.reps : reps} onChange={event => setReps(event.target.value)} disabled={!!saved} required /></label><label>RPE<input aria-label={`RPE de ${title}`} type="number" min="0" max="10" step="0.5" inputMode="decimal" value={saved ? saved.rpe ?? '' : rpe} onChange={event => setRpe(event.target.value)} disabled={!!saved} required /></label></div>
    <div className="suggested-footer"><label className="check-label"><input type="checkbox" checked={saved ? saved.failure : failure} disabled={prep || !!saved} onChange={event => { setFailure(event.target.checked); if(event.target.checked&&!prep)setFailureMotion(value=>value+1); }} /><span key={failureMotion} className={failureMotion&&!prep ? 'failure-shake' : undefined}>{prep ? 'Sin fallo' : 'Llegué al fallo'}</span></label><button className={saved ? 'secondary' : 'primary'} type="submit" disabled={saving || blocked || !!saved} aria-label={`Guardar ${title}`}>{saved ? '✓ Guardada' : blocked ? 'Falta efectiva' : '✓ Guardar'}</button></div>
    <label>Descanso real antes (s, opcional)<input aria-label={`Descanso real de ${title}`} type="number" min="0" max="86400" value={saved?saved.restRealSeconds??'':restReal} disabled={!!saved} onChange={event=>setRestReal(event.target.value)}/></label>
  </form>;
}
