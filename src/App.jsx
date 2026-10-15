import { useEffect, useRef, useState } from 'react';
import { APPROACHES, DAYS, EXTENSIONS, KINDS, MUSCLES, TITLES, dayIndex, formatSeconds, initialState, localDate, makeExercise, removeLog, restFor, validateLog, validateRoutine, weekDates, weeklyVolume } from './domain.js';
import { loadState, saveState, updateState } from './db.js';

function Icon({ name, size = 22 }) {
  const paths = {
    bar: <><path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" /></>,
    today: <><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4m8-4v4M4 11h16m-11 5 2 2 4-4" /></>,
    edit: <><path d="m15 4 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14z" /></>,
    chart: <><path d="M4 20h17M7 16v-5m5 5V4m5 12V8" /></>,
    arrow: <path d="m9 5 7 7-7 7" />,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></>,
    leaf: <><path d="M20 4c0 12-3 16-9 16a7 7 0 0 1 0-14zM4 20 15 9" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.bar}</svg>;
}

function usePwa() {
  const [online, setOnline] = useState(navigator.onLine);
  const [ready, setReady] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const capture = event => { event.preventDefault(); setPrompt(event); };
    const installed = () => setPrompt(null);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    window.addEventListener('beforeinstallprompt', capture); window.addEventListener('appinstalled', installed);
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(() => navigator.serviceWorker.ready).then(() => setReady(true)).catch(() => setError('No se pudo preparar el modo offline. Recarga con conexión.'));
    }
    return () => {
      window.removeEventListener('online', update); window.removeEventListener('offline', update);
      window.removeEventListener('beforeinstallprompt', capture); window.removeEventListener('appinstalled', installed);
    };
  }, []);
  async function install() { if (prompt) { await prompt.prompt(); await prompt.userChoice; setPrompt(null); } }
  return { online, ready, prompt, error, install };
}

export default function App() {
  const [data, setData] = useState(null);
  const locked = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState('today');
  const [date, setDate] = useState(localDate());
  const pwa = usePwa();
  async function boot() {
    setError('');
    try {
      const existing = await loadState();
      const state = existing ?? initialState();
      if (!existing) await saveState(state);
      setData(state);
    } catch { setError('No se pudo abrir IndexedDB. Permite el almacenamiento del navegador y vuelve a intentar.'); }
  }
  useEffect(() => { boot(); }, []);
  async function change(updater) {
    if (locked.current) return false;
    locked.current = true; setSaving(true); setError('');
    try {
      const next = await updateState(updater);
      setData(next);
      return true;
    } catch { setError('No se pudo guardar. Tu cambio sigue en pantalla: libera espacio o permite el almacenamiento y vuelve a intentar.'); return false; }
    finally { locked.current = false; setSaving(false); }
  }
  async function startTimer(seconds, label) { return change(state => ({ ...state, timer: { end: Date.now() + seconds * 1000, duration: seconds, label } })); }
  const [installHelp, setInstallHelp] = useState(false);
  return <div className="app-shell">
    <header className="masthead">
      <a className="brand" href="#today" onClick={event => { event.preventDefault(); setPage('today'); }} aria-label="Heavy Duty, ir a Hoy">
        <span className="brand-symbol"><Icon name="bar" size={29} /></span><span>HEAVY<span className="brand-light">DUTY</span><small>PERSONAL TRAINING LOG</small></span>
      </a>
      <div className="header-actions"><span className={`connection ${!pwa.online ? 'offline' : ''}`}><i />{!pwa.online ? 'Sin conexión' : pwa.ready ? 'Offline listo' : 'Local · privado'}</span>
        <button className="icon-button install-button" aria-label="Instalar aplicación" onClick={() => pwa.prompt ? pwa.install() : setInstallHelp(!installHelp)}><Icon name="download" /></button></div>
    </header>
    {installHelp && <aside className="install-help"><strong>Instala Heavy Duty</strong><p>En Android o escritorio: menú del navegador → Instalar aplicación. En iPhone: Safari → Compartir → Añadir a pantalla de inicio.</p><p>{pwa.ready ? 'La app está preparada para abrir sin conexión.' : 'La instalación y el modo offline se preparan en la versión de producción, con HTTPS o localhost.'}</p><button className="quiet" onClick={() => setInstallHelp(false)}>Entendido</button></aside>}
    {(error || pwa.error) && <div className="error global-error" role="alert">{error || pwa.error}{!data && <button className="quiet" onClick={boot}>Reintentar</button>}</div>}
    {!data ? <main className="loading" aria-live="polite">{error ? 'Tus datos no se han modificado.' : 'Preparando tu entrenamiento…'}</main> : <>
      <main id="main-content">
        {page === 'today' && <Today data={data} date={date} setDate={setDate} change={change} saving={saving} startTimer={startTimer} />}
        <div hidden={page !== 'routine'}><Routine data={data} change={change} saving={saving} /></div>
        {page === 'volume' && <Volume data={data} date={date} setDate={setDate} />}
      </main>
      {data.timer && <Timer timer={data.timer} onClose={() => change(state => ({ ...state, timer: null }))} />}
    </>}
    <nav className="bottom-nav" aria-label="Navegación principal">
      {[['today', 'today', 'Hoy'], ['routine', 'edit', 'Rutina'], ['volume', 'chart', 'Volumen']].map(([id, icon, label]) => <button key={id} className={page === id ? 'active' : ''} aria-current={page === id ? 'page' : undefined} onClick={() => setPage(id)}><Icon name={icon} /><span>{label}</span>{page === id && <i />}</button>)}
    </nav>
  </div>;
}

function WeekStrip({ date, setDate }) {
  return <div className="week-strip" aria-label="Días de la semana">{weekDates(date).map((value, index) => <button key={value} onClick={() => setDate(value)} className={`${value === date ? 'selected' : ''} ${value === localDate() ? 'is-today' : ''}`} aria-pressed={value === date} aria-label={`${DAYS[index]} ${value}`}><span>{DAYS[index].slice(0, 3)}</span><strong>{Number(value.slice(-2))}</strong><i className={[2, 6].includes(index) ? 'rest-dot' : ''} /></button>)}</div>;
}

function Today({ data, date, setDate, change, saving, startTimer }) {
  const day = dayIndex(date);
  const exercises = data.routine[day];
  const [open, setOpen] = useState(null);
  const logs = data.logs.filter(log => log.date === date);
  const planned = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const done = logs.filter(log => log.kind === 'effective').length;
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const activeId = open === null ? exercises[0]?.id : open;
  return <>
    <div className="page-heading"><div><p className="eyebrow">TU ÚNICA COMPETENCIA ERES TÚ</p><h1>A entrenar<span className="accent">.</span></h1></div><label className="date-picker"><span>{date === localDate() ? 'Hoy' : 'Fecha'}<Icon name="today" size={17} /></span><input aria-label="Fecha de entrenamiento" type="date" value={date} onChange={event => event.target.value && setDate(event.target.value)} /></label></div>
    <WeekStrip date={date} setDate={value => { setOpen(null); setDate(value); }} />
    <section className="session-hero">
      <div className="hero-copy"><span className="pill">{exercises.length ? 'HEAVY DUTY / BLOOD & GUTS' : 'RECUPERACIÓN'}</span><p className="hero-date">{dateLabel}</p><h2>{exercises.length ? [2, 6].includes(day) ? 'Sesión personalizada' : TITLES[day] : 'Día de descanso'}</h2><p className="hero-caption">{exercises.length ? 'Poco volumen. Máxima intención.' : 'El descanso también construye.'}</p><div className="hero-stats"><span><b>{exercises.length}</b> ejercicios</span><span><b>{planned}</b> series efectivas</span></div></div>
      <div className="progress-ring" style={{ '--progress': `${planned ? Math.min(done / planned, 1) * 100 : 0}%` }}><div><strong>{done}<small>/{planned}</small></strong><span>COMPLETADAS</span></div></div>
      <span className="hero-watermark" aria-hidden="true">HD</span>
    </section>
    <div className="training-note"><Icon name="leaf" size={18} /><span>Natural. Ejecución controlada. Series efectivas al fallo técnico.</span></div>
    <section className="session-list"><div className="section-heading"><h2>{exercises.length ? 'Tu sesión' : 'Recupera para la próxima'}</h2><span>{exercises.length ? `${done} de ${planned} efectivas` : DAYS[day]}</span></div>
      {exercises.length === 0 ? <div className="rest-card"><Icon name="leaf" size={42} /><h3>Hoy toca descansar.</h3><p>Tu rutina vuelve {day === 2 ? 'el jueves' : 'el lunes'}. Puedes consultar otro día en la semana de arriba.</p></div> : exercises.map((exercise, index) => <ExerciseCard key={`${date}-${exercise.id}`} exercise={exercise} index={index} date={date} logs={logs.filter(log => log.exerciseId === exercise.id)} expanded={activeId === exercise.id} toggle={() => setOpen(activeId === exercise.id ? '' : exercise.id)} change={change} saving={saving} startTimer={startTimer} />)}
    </section>
    <p className="local-footnote"><span className="tiny-dot" /> Guardado en este dispositivo · Sin cuenta ni servidor</p>
  </>;
}

function ExerciseCard({ exercise: ex, index, date, logs, expanded, toggle, change, saving, startTimer }) {
  const count = logs.filter(log => log.kind === 'effective').length;
  const [kind, setKind] = useState('effective');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [reference, setReference] = useState('');
  const [failure, setFailure] = useState(true);
  const [parent, setParent] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const effective = logs.filter(log => log.kind === 'effective');
  const preparation = logs.filter(log => ['warmup', 'approach'].includes(log.kind));
  const extensions = logs.filter(log => EXTENSIONS.includes(log.kind));
  const approachCount = logs.filter(log => log.kind === 'approach').length;
  const approach = APPROACHES[Math.min(approachCount, 2)];
  const allowed = Object.entries(KINDS).filter(([value]) => !['forced', 'negative'].includes(value) || ex[value]);
  useEffect(() => { if (['forced', 'negative'].includes(kind) && !ex[kind]) setKind('effective'); }, [ex.forced, ex.negative, kind]);
  async function record(event) {
    event.preventDefault(); setFormError(''); setMessage('');
    if (weight.trim() === '' || reps.trim() === '') { setFormError('Completa la carga y las repeticiones. Usa 0 kg si no hay carga externa.'); return; }
    const log = { id: crypto.randomUUID(), exerciseId: ex.id, exerciseName: ex.name, muscle: ex.muscle, date, kind, weight: Number(weight), reps: Number(reps), failure: ['warmup', 'approach'].includes(kind) ? false : failure, parentId: EXTENSIONS.includes(kind) ? parent || effective.at(-1)?.id : null, createdAt: new Date().toISOString() };
    const invalid = validateLog(log, ex, logs);
    if (invalid) { setFormError(invalid); return; }
    const seconds = restFor(ex, kind, approachCount + (kind === 'approach' ? 1 : 0));
    const success = await change(state => ({ ...state, logs: [...state.logs, log], timer: { end: Date.now() + seconds * 1000, duration: seconds, label: ex.name } }));
    if (success) { setReps(''); setMessage(`${KINDS[kind]} guardada · ${log.weight} kg × ${log.reps}`); }
  }
  function suggest() {
    if (!reference || Number(reference) <= 0) { setFormError('Indica la carga de tu serie efectiva para calcular la aproximación.'); return; }
    setKind('approach'); setWeight(String(Math.round(Number(reference) * approach.percent / 100 * 2) / 2)); setReps(String(approach.reps)); setFailure(false); setFormError('');
  }
  const rows = (items, title) => items.length > 0 && <div className="log-group"><h4>{title}</h4>{items.map(log => <div className="log-row" key={log.id}><span className={log.kind === 'effective' ? 'log-mark effective-mark' : 'log-mark'}><Icon name={log.kind === 'effective' ? 'check' : 'bar'} size={15} /></span><div><strong>{KINDS[log.kind]}{log.parentId ? ` · de E${effective.findIndex(item => item.id === log.parentId) + 1}` : ''}</strong><small>{log.failure ? 'Al fallo técnico' : ['warmup', 'approach'].includes(log.kind) ? 'Sin fallo · no suma volumen' : 'Sin fallo'}</small></div><b>{log.weight}<small> kg</small> × {log.reps}</b><button className="icon-button" aria-label={`Eliminar ${KINDS[log.kind]} de ${ex.name}`} disabled={saving} onClick={() => setDeleting(log.id)}><Icon name="close" size={16} /></button></div>)}</div>;
  return <article className={`exercise-card ${expanded ? 'expanded' : ''}`}>
    <button className="exercise-summary" onClick={toggle} aria-expanded={expanded} aria-controls={`exercise-${ex.id}`}><span className={`exercise-number ${count >= ex.sets ? 'complete' : ''}`}>{count >= ex.sets ? <Icon name="check" size={19} /> : String(index + 1).padStart(2, '0')}</span><span className="exercise-title"><span className="muscle-label">{ex.muscle}</span><strong>{ex.name}</strong><small>{ex.sets} {ex.sets === 1 ? 'efectiva' : 'efectivas'}{ex.technique ? ` + ${KINDS[ex.technique]}` : ''}<span className="summary-rest"> · {formatSeconds(ex.rests.effective)} descanso</span></small></span><span className="exercise-count">{count}<small>/{ex.sets}</small></span><span className="chevron"><Icon name="arrow" size={17} /></span></button>
    {expanded && <div className="exercise-body" id={`exercise-${ex.id}`}>
      {ex.approaches > 0 && <div className="approach-panel"><div><span className="eyebrow">PREPARACIÓN · {Math.min(approachCount, ex.approaches)}/{ex.approaches}</span><p>{approachCount < ex.approaches ? `${approach.range} · sin fallo` : 'Aproximaciones completadas'}</p></div>{approachCount < ex.approaches && <div className="approach-controls"><label>Carga efectiva (kg)<input aria-label={`Carga de referencia de ${ex.name}`} type="number" inputMode="decimal" min="0.5" max="1500" step="0.5" placeholder="Ej. 60" value={reference} onChange={event => setReference(event.target.value)} /></label><button className="secondary" onClick={suggest}>Usar sugerencia</button></div>}</div>}
      {rows(preparation, 'Calentamiento y aproximación')}{rows(effective, 'Series efectivas')}{rows(extensions, 'Extensiones · sin sumar otra serie')}
      {deleting && <div className="delete-confirm" role="alert"><p>¿Eliminar esta serie{effective.some(log => log.id === deleting) ? ' y sus extensiones' : ''}?</p><button className="danger" disabled={saving} onClick={async () => { if (await change(state => ({ ...state, logs: removeLog(state.logs, deleting) }))) { setDeleting(null); setMessage('Serie eliminada.'); } }}>Eliminar</button><button className="quiet" onClick={() => setDeleting(null)}>Cancelar</button></div>}
      <form onSubmit={record} className="set-form">
        <div className="section-heading small"><h3>Registrar serie</h3><span>{['warmup', 'approach'].includes(kind) ? 'Preparación' : EXTENSIONS.includes(kind) ? 'Extensión' : 'Trabajo efectivo'}</span></div>
        <label>Tipo de serie<select value={kind} onChange={event => { setKind(event.target.value); setFailure(!['warmup', 'approach'].includes(event.target.value)); setMessage(''); }}>{allowed.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {EXTENSIONS.includes(kind) && <label>Vinculada a<select value={parent || effective.at(-1)?.id || ''} onChange={event => setParent(event.target.value)} required><option value="">Selecciona una efectiva</option>{effective.map((log, i) => <option key={log.id} value={log.id}>E{i + 1} · {log.weight} kg × {log.reps}</option>)}</select></label>}
        <div className="input-pair"><label>Carga (kg)<input aria-label={`Carga de ${ex.name}`} type="number" min="0" max="1500" step="0.5" inputMode="decimal" placeholder="0" value={weight} onChange={event => setWeight(event.target.value)} required /></label><label>Repeticiones<input aria-label={`Repeticiones de ${ex.name}`} type="number" min="1" max="200" inputMode="numeric" placeholder="0" value={reps} onChange={event => setReps(event.target.value)} required /></label></div>
        {!['warmup', 'approach'].includes(kind) ? <label className="check-label"><input type="checkbox" checked={failure} onChange={event => setFailure(event.target.checked)} /><span>Al fallo técnico<small>Última repetición con ejecución controlada</small></span></label> : <p className="muted small-text">Sin fallo. Esta serie se guarda aparte y no suma volumen.</p>}
        {formError && <p className="error" role="alert">{formError}</p>}{message && <p className="success" role="status">{message}</p>}
        <button className="primary full" type="submit" disabled={saving}><Icon name="plus" size={20} />{saving ? 'Guardando…' : 'Guardar serie'}<span>+ descanso</span></button>
      </form>
      <div className="rest-shortcuts"><span><Icon name="clock" size={15} /> Descansos</span>{[['warmup', 'Calent.'], ['effective', 'Efectiva'], ...(ex.technique ? [[ex.technique, KINDS[ex.technique]]] : [])].map(([type, label]) => <button key={type} disabled={saving} onClick={() => startTimer(ex.rests[type], `${label} · ${ex.name}`)}>{label} <b>{formatSeconds(ex.rests[type])}</b></button>)}</div>
      {!ex.forced && !ex.negative && <p className="technique-note">Forzadas y negativas desactivadas. Se habilitan por ejercicio en Rutina.</p>}
    </div>}
  </article>;
}

function Routine({ data, change, saving }) {
  const [draft, setDraft] = useState(() => structuredClone(data.routine));
  const [day, setDay] = useState(dayIndex(localDate()));
  const [open, setOpen] = useState('');
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteId, setDeleteId] = useState('');
  function update(id, patch) { setDraft(current => current.map((list, i) => i === day ? list.map(ex => ex.id === id ? { ...ex, ...patch } : ex) : list)); setDirty(true); setMessage(''); }
  async function save(event) {
    event.preventDefault();
    const invalid = validateRoutine(draft);
    if (invalid) { setMessage(invalid); return; }
    if (await change(state => ({ ...state, routine: draft.map(list => list.map(ex => ({ ...ex, name: ex.name.trim() }))) }))) { setDirty(false); setMessage('Rutina guardada en este dispositivo.'); }
  }
  function move(index, delta) {
    setDraft(current => current.map((list, i) => { if (i !== day) return list; const moved = [...list]; [moved[index], moved[index + delta]] = [moved[index + delta], moved[index]]; return moved; })); setDirty(true);
  }
  function add() {
    const muscle = 'Pecho';
    const ex = makeExercise('Nuevo ejercicio', muscle, 1, '', 'free', false, draft[day].some(item => item.muscle === muscle) ? 0 : 3);
    setDraft(current => current.map((list, i) => i === day ? [...list, ex] : list)); setOpen(ex.id); setDirty(true);
  }
  return <><div className="page-heading"><div><p className="eyebrow">LA ESTRUCTURA DE TU TRABAJO</p><h1>Tu rutina<span className="accent">.</span></h1></div><span className="outlined-tag">7 DÍAS</span></div><p className="page-intro">Ajusta las series, las técnicas y el descanso a tu entrenamiento.</p>
    <form onSubmit={save}><div className="editor-toolbar"><span aria-live="polite">{dirty ? 'Cambios sin guardar' : message || 'Rutina personalizada · Heavy Duty'}</span><button className="primary" type="submit" disabled={saving || !dirty}><Icon name="check" size={18} />{saving ? 'Guardando…' : 'Guardar cambios'}</button></div>
      <div className="day-tabs" aria-label="Día a editar">{DAYS.map((name, index) => <button key={name} type="button" className={index === day ? 'selected' : ''} aria-pressed={index === day} onClick={() => { setDay(index); setOpen(''); }}>{name.slice(0, 3)}</button>)}</div>
      <div className="section-heading"><h2>{DAYS[day]}</h2><span>{draft[day].length} ejercicios · {draft[day].reduce((sum, ex) => sum + ex.sets, 0)} efectivas</span></div>
      {message && <p role="status" className="success">{message}</p>}
      {!draft[day].length && <div className="rest-card"><Icon name="leaf" size={36} /><h3>Día de descanso</h3><p>Puedes mantenerlo libre o añadir ejercicios.</p></div>}
      {draft[day].map((ex, index) => <article className="exercise-card editor-card" key={ex.id}>
        <button className="exercise-summary" type="button" onClick={() => setOpen(open === ex.id ? '' : ex.id)} aria-expanded={open === ex.id}><span className="exercise-number">{String(index + 1).padStart(2, '0')}</span><span className="exercise-title"><span className="muscle-label">{ex.muscle}</span><strong>{ex.name || 'Sin nombre'}</strong><small>{ex.sets} efectivas{ex.technique ? ` + ${KINDS[ex.technique]}` : ''}</small></span><Icon name="edit" size={19} /></button>
        {open === ex.id && <div className="exercise-body editor-fields"><label>Nombre del ejercicio<input required maxLength="90" value={ex.name} onChange={event => update(ex.id, { name: event.target.value })} /></label>
          <div className="input-pair"><label>Músculo principal<select value={ex.muscle} onChange={event => update(ex.id, { muscle: event.target.value, approaches: draft[day].some(item => item.id !== ex.id && item.muscle === event.target.value) ? 0 : ex.equipment === 'free' ? 3 : 1 })}>{MUSCLES.map(name => <option key={name}>{name}</option>)}</select></label><label>Series efectivas<input type="number" min="1" max="20" required value={ex.sets || ''} onChange={event => update(ex.id, { sets: Number(event.target.value) })} /></label></div>
          <div className="input-pair"><label>Equipo<select value={ex.equipment} onChange={event => { const equipment = event.target.value; const first = draft[day].find(item => item.muscle === ex.muscle)?.id === ex.id; update(ex.id, { equipment, approaches: first ? equipment === 'free' ? 3 : 1 : 0 }); }}><option value="free">Peso libre</option><option value="machine">Máquina</option><option value="cable">Polea</option></select></label><label>Tipo de ejercicio<select value={ex.compound ? 'compound' : 'isolation'} onChange={event => { const compound = event.target.value === 'compound'; update(ex.id, { compound, rests: { ...ex.rests, effective: compound ? 210 : 150 } }); }}><option value="compound">Compuesto</option><option value="isolation">Aislamiento</option></select></label></div>
          <div className="input-pair"><label>Extensión planeada<select value={ex.technique} onChange={event => update(ex.id, { technique: event.target.value })}><option value="">Ninguna</option><option value="drop">Drop set</option><option value="rp">Rest-pause</option></select></label><label>Aproximaciones<input type="number" min="0" max="3" required value={ex.approaches} onChange={event => update(ex.id, { approaches: Number(event.target.value) })} /></label></div>
          <p className="field-note">Primer ejercicio por músculo: 3 aproximaciones en peso libre; 1 en máquina o polea. Puedes ajustarlo de 0 a 3. Las aproximaciones nunca van al fallo.</p>
          <h3 className="editor-subtitle">Descansos <span>segundos</span></h3><div className="input-pair">{[['warmup', 'Entre calentamientos / aproximaciones'], ['effective', 'Antes de la efectiva'], ['rp', 'Rest-pause · entre mini-series'], ['drop', 'Drop set · cambio de carga']].map(([key, label]) => <label key={key}>{label}<input type="number" inputMode="numeric" min="1" max="900" required value={ex.rests[key] || ''} onChange={event => update(ex.id, { rests: { ...ex.rests, [key]: Number(event.target.value) } })} /></label>)}</div>
          <h3 className="editor-subtitle">Técnicas opcionales</h3><label className="check-label"><input type="checkbox" checked={ex.forced} onChange={event => update(ex.id, { forced: event.target.checked })} /><span>Permitir forzadas<small>Desactivadas por defecto</small></span></label><label className="check-label"><input type="checkbox" checked={ex.negative} onChange={event => update(ex.id, { negative: event.target.checked })} /><span>Permitir negativas<small>Desactivadas por defecto</small></span></label>
          <div className="editor-bottom"><div><button className="secondary" type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Subir ${ex.name}`}>↑ Subir</button><button className="secondary" type="button" disabled={index === draft[day].length - 1} onClick={() => move(index, 1)} aria-label={`Bajar ${ex.name}`}>↓ Bajar</button></div><button className="danger" type="button" onClick={() => setDeleteId(ex.id)}>Quitar</button></div>
          {deleteId === ex.id && <div className="delete-confirm"><p>Se quitará de la rutina. Las series registradas se conservan en el volumen semanal.</p><button type="button" className="danger" onClick={() => { setDraft(current => current.map((list, i) => i === day ? list.filter(item => item.id !== ex.id) : list)); setDirty(true); setDeleteId(''); }}>Confirmar</button><button type="button" className="quiet" onClick={() => setDeleteId('')}>Cancelar</button></div>}
        </div>}
      </article>)}
      <button className="add-exercise" type="button" onClick={add}><Icon name="plus" />Añadir ejercicio</button>
      <p className="field-note">Los cambios se aplican al plan semanal. Tu historial conserva el músculo y el nombre originales.</p>
    </form></>;
}

function Volume({ data, date, setDate }) {
  const dates = weekDates(date);
  const rows = weeklyVolume(data, date);
  const total = rows.reduce((sum, row) => sum + row.done, 0);
  const planned = rows.reduce((sum, row) => sum + row.planned, 0);
  const preparations = data.logs.filter(log => dates.includes(log.date) && ['warmup', 'approach'].includes(log.kind)).length;
  const extensions = data.logs.filter(log => dates.includes(log.date) && EXTENSIONS.includes(log.kind)).length;
  const label = d => new Date(`${d}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  function shift(delta) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + delta); setDate(localDate(d)); }
  return <><div className="page-heading"><div><p className="eyebrow">CADA SERIE TIENE UN PROPÓSITO</p><h1>Tu volumen<span className="accent">.</span></h1></div><span className="outlined-tag">SEMANAL</span></div>
    <div className="week-selector"><button className="icon-button" aria-label="Semana anterior" onClick={() => shift(-7)}>←</button><span>{label(dates[0])} — {label(dates[6])} <small>{dates[0].slice(0, 4)}</small></span><button className="icon-button" aria-label="Semana siguiente" onClick={() => shift(7)}>→</button></div>
    <div className="volume-summary"><div><span className="eyebrow">SERIES EFECTIVAS</span><strong>{total}<small> / {planned}</small></strong><p>realizadas / planeadas</p></div><div className="summary-divider" /><div><span className="eyebrow">PREPARACIÓN</span><strong>{preparations}</strong><p>guardadas aparte</p></div><div className="summary-divider" /><div><span className="eyebrow">EXTENSIONES</span><strong>{extensions}</strong><p>drop, RP y opcionales</p></div></div>
    <div className="section-heading"><h2>Series por músculo</h2><span className="legend"><i /> Realizado <i /> Planeado</span></div>
    <div className="volume-table"><div className="volume-table-head"><span>Músculo</span><span>Meta</span><span>Plan</span><span>Hecho</span></div>{rows.map(row => <div className="volume-row" key={row.muscle}><div className="volume-row-top"><strong>{row.muscle}</strong><span>{row.target}</span><span>{row.planned}</span><b>{row.done}</b></div><div className="volume-track" role="img" aria-label={`${row.muscle}: ${row.done} realizadas, ${row.planned} planeadas, meta ${row.target}`}><div className="planned-track" style={{ width: `${row.planned / Math.max(row.target, row.planned, row.done, 1) * 100}%` }} /><div className="done-track" style={{ width: `${row.done / Math.max(row.target, row.planned, row.done, 1) * 100}%` }} /><i style={{ left: `${Math.min(99.5, row.target / Math.max(row.target, row.planned, row.done, 1) * 100)}%` }} /></div></div>)}</div>
    <div className="volume-explainer"><Icon name="chart" /><div><h3>Cuenta el trabajo efectivo.</h3><p>1 serie efectiva = 1 serie de volumen para su músculo principal. Drop set, rest-pause, forzadas y negativas se vinculan como extensiones y no añaden otra serie. Calentamiento y aproximación quedan fuera.</p><p>La meta es tu referencia original. El plan suma tu rutina actual; por eso puede diferir de la meta. El realizado corresponde a la semana elegida, de lunes a domingo.</p></div></div>
  </>;
}

function Timer({ timer, onClose }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);
  const remaining = Math.max(0, Math.ceil((timer.end - now) / 1000));
  const notified = useRef(null);
  useEffect(() => { if (remaining === 0 && notified.current !== timer.end) { notified.current = timer.end; navigator.vibrate?.([150, 80, 150]); } }, [remaining, timer.end]);
  return <aside className={`timer-bar ${remaining === 0 ? 'finished' : ''}`} aria-label="Temporizador de descanso"><Icon name="clock" /><div><strong>{remaining > 0 ? 'Recupera. La siguiente cuenta.' : 'Descanso terminado'}</strong><span>{timer.label}</span></div><b role="timer" aria-label={`${remaining} segundos restantes`}>{formatSeconds(remaining)}</b><button className="icon-button" aria-label="Cerrar temporizador" onClick={onClose}><Icon name="close" size={20} /></button></aside>;
}
