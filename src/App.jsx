import { useEffect, useRef, useState } from 'react';
import { EQUIPMENT, INCREMENTS, DAYS, EXTENSIONS, KINDS, MUSCLES, TITLES, dayIndex, formatSeconds, initialState, migrateState, localDate, makeExercise, removeLog, restFor, validateLog, validateRoutine, weekDates, weeklyVolume } from './domain.js';
import { updateState } from './db.js';
import ExerciseCard from './ExerciseCard.jsx';
import Cardio from './Cardio.jsx';
import Diary from './Diary.jsx';
import Measurements, { WaistNotice } from './Measurements.jsx';
import { measurementReminder } from './measurements.js';
import { advancePhases, captureAnchors } from './program/phases.js';
import { dayContext } from './program/nutrition.js';
import PhasePanel from './program/PhasePanel.jsx';
import TodayPlan from './program/TodayPlan.jsx';
import FoodPage from './program/FoodPage.jsx';
import Recovery from './program/Recovery.jsx';
import { sessionExercise } from './training.js';
import { TrainingRecovery } from './TrainingPanels.jsx';
import PreparationSettings from './PreparationControls.jsx';
import { contextualPreparation } from './preparation.js';

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
    diary: <><path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-3-2H4zM13 7a3 3 0 0 1 3-3h5v15h-5a4 4 0 0 0-3 2" /></>,
    ruler: <><path d="m3 16 13-13 5 5L8 21zM7 12l2 2m2-6 2 2m2-6 2 2" /></>,
    food: <><path d="M5 3v7m3-7v7m3-7v7M5 7h6m-3 3v11M19 3c-4 3-4 9 0 9V3zm0 9v9" /></>,
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
      const state = await updateState(existing => captureAnchors(advancePhases(existing ? migrateState(existing) : initialState(),localDate())));
      setData(state);
    } catch { setError('No se pudo abrir IndexedDB. Permite el almacenamiento del navegador y vuelve a intentar.'); }
  }
  useEffect(() => { boot(); }, []);
  async function change(updater) {
    if (locked.current) return false;
    locked.current = true; setSaving(true); setError('');
    try {
      const next = await updateState(state => captureAnchors(advancePhases(updater(state),localDate())));
      setData(next);
      return true;
    } catch { setError('No se pudo guardar. Tu cambio sigue en pantalla: libera espacio o permite el almacenamiento y vuelve a intentar.'); return false; }
    finally { locked.current = false; setSaving(false); }
  }
  async function startTimer(seconds, label) { return change(state => ({ ...state, timer: { end: Date.now() + seconds * 1000, duration: seconds, label } })); }
  const [installHelp, setInstallHelp] = useState(false);
  const measureReminder = data ? measurementReminder(data.measurements, localDate()) : null;
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
        {page !== 'measurements' && measureReminder?.due && <aside className="notice measurement-reminder" aria-label="Recordatorio de medidas"><div><strong>Tu control de medidas está pendiente.</strong><p>Desde {measureReminder.date} · En ayunas y mismas condiciones; bíceps en pose y resto relajado.</p></div><button className="secondary" onClick={() => { setDate(localDate()); setPage('measurements'); }}>Ir a Medidas</button></aside>}
        {page === 'today' && <Today data={data} date={date} setDate={setDate} change={change} saving={saving} startTimer={startTimer} onFood={()=>setPage('food')} onDiary={()=>setPage('diary')} onMeasures={()=>setPage('measurements')} />}
        <div hidden={page !== 'routine'}><Routine data={data} change={change} saving={saving} /></div>
        {page === 'volume' && <Volume data={data} date={date} setDate={setDate} />}
        {page === 'diary' && <Diary key={date} data={data} date={date} setDate={setDate} change={change} saving={saving} />}
        {page === 'measurements' && <Measurements key={date} data={data} date={date} setDate={setDate} change={change} saving={saving} />}
        {page === 'food' && <FoodPage key={date} data={data} date={date} setDate={setDate} change={change} saving={saving} onDiary={()=>setPage('diary')} />}
      </main>
      {data.timer && <Timer timer={data.timer} onClose={() => change(state => ({ ...state, timer: null }))} />}
    </>}
    <nav className="bottom-nav" aria-label="Navegación principal">
      {[['today', 'today', 'Hoy'], ['routine', 'edit', 'Rutina'], ['volume', 'chart', 'Volumen'], ['diary', 'diary', 'Diario'], ['measurements', 'ruler', 'Medidas'], ['food', 'food', 'Comida']].map(([id, icon, label]) => <button key={id} className={page === id ? 'active' : ''} aria-current={page === id ? 'page' : undefined} onClick={() => setPage(id)}><Icon name={icon} /><span>{label}</span>{page === id && <i />}</button>)}
    </nav>
  </div>;
}

function WeekStrip({ date, setDate, data }) {
  return <div className="week-strip" aria-label="Días de la semana">{weekDates(date).map((value, index) => <button key={value} onClick={() => setDate(value)} className={`${value === date ? 'selected' : ''} ${value === localDate() ? 'is-today' : ''}`} aria-pressed={value === date} aria-label={`${DAYS[index]} ${value}`}><span>{DAYS[index].slice(0, 3)}</span><strong>{Number(value.slice(-2))}</strong><i className={dayContext(data,value).type==='rest' ? 'rest-dot' : ''} /></button>)}</div>;
}

function Today({ data, date, setDate, change, saving, startTimer, onFood, onDiary, onMeasures }) {
  const context = dayContext(data,date), day = context.routineDay;
  const exercises = context.exercises.map(ex=>sessionExercise(data,ex,date));
  const [open, setOpen] = useState(null);
  const logs = data.logs.filter(log => log.date === date);
  const planned = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const done = logs.filter(log => log.kind === 'effective').length;
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const activeId = open === null ? exercises[0]?.id : open;
  return <>
    <div className="page-heading"><div><p className="eyebrow">TU ÚNICA COMPETENCIA ERES TÚ</p><h1>A entrenar<span className="accent">.</span></h1></div><label className="date-picker"><span>{date === localDate() ? 'Hoy' : 'Fecha'}<Icon name="today" size={17} /></span><input aria-label="Fecha de entrenamiento" type="date" value={date} onChange={event => event.target.value && setDate(event.target.value)} /></label></div>
    <WeekStrip data={data} date={date} setDate={value => { setOpen(null); setDate(value); }} />
    <PhasePanel key={`phase-${date}`} data={data} date={date} change={change} saving={saving} compact />
    <section className="session-hero">
      <div className="hero-copy"><span className="pill">{exercises.length ? 'HEAVY DUTY / BLOOD & GUTS' : 'RECUPERACIÓN'}</span><p className="hero-date">{dateLabel}</p><h2>{exercises.length ? [2, 6].includes(day) ? 'Sesión personalizada' : TITLES[day] : 'Día de descanso'}</h2><p className="hero-caption">{exercises.length ? 'Poco volumen. Máxima intención.' : 'El descanso también construye.'}</p><div className="hero-stats"><span><b>{exercises.length}</b> ejercicios</span><span><b>{planned}</b> series efectivas</span></div></div>
      <div className="progress-ring" style={{ '--progress': `${planned ? Math.min(done / planned, 1) * 100 : 0}%` }}><div><strong>{done}<small>/{planned}</small></strong><span>COMPLETADAS</span></div></div>
      <span className="hero-watermark" aria-hidden="true">HD</span>
    </section>
    <div className="training-note"><Icon name="leaf" size={18} /><span>{exercises.some(ex=>ex.deload)?'Descarga: ejecución controlada, sin fallo y sin técnicas.':'Natural. Ejecución controlada. Series efectivas al fallo técnico.'}</span></div>
    <PreparationSettings data={data} date={date} exercises={exercises} change={change} saving={saving} />
    <TrainingRecovery key={`recovery-${date}`} data={data} date={date} exercises={exercises} change={change} saving={saving} />
    <section className="session-list"><div className="section-heading"><h2>{exercises.length ? 'Tu sesión' : 'Recupera para la próxima'}</h2><span>{exercises.length ? `${done} de ${planned} efectivas` : DAYS[day]}</span></div>
      {exercises.length === 0 ? <div className="rest-card"><Icon name="leaf" size={42} /><h3>Hoy toca descansar.</h3><p>Tu rutina vuelve {day === 2 ? 'el jueves' : 'el lunes'}. Puedes consultar otro día en la semana de arriba.</p></div> : exercises.map((exercise, index) => <ExerciseCard key={`${date}-${exercise.id}`} exercise={exercise} index={index} date={date} data={data} logs={logs.filter(log => log.exerciseId === exercise.id)} expanded={activeId === exercise.id} toggle={() => setOpen(activeId === exercise.id ? '' : exercise.id)} change={change} saving={saving} startTimer={startTimer} />)}
    </section>
    <TodayPlan key={`plan-${date}`} data={data} date={date} change={change} saving={saving} onFood={onFood} />
    <Cardio key={date} data={data} date={date} change={change} saving={saving} />
    <Recovery data={data} date={date} change={change} saving={saving} onDiary={onDiary} onMeasures={onMeasures} />
    <p className="local-footnote"><span className="tiny-dot" /> Guardado en este dispositivo · Sin cuenta ni servidor</p>
  </>;
}

function Routine({ data, change, saving }) {
  const [draft, setDraft] = useState(() => structuredClone(data.routine));
  const [day, setDay] = useState(dayIndex(localDate()));
  const [open, setOpen] = useState('');
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteId, setDeleteId] = useState('');
  useEffect(()=>{if(!dirty)setDraft(structuredClone(data.routine));},[data.routine,dirty]);
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
    const ex = makeExercise('Nuevo ejercicio', muscle, 1, '', 'barbell', false, draft[day].some(item => item.muscle === muscle) ? 1 : 2);
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
          <div className="input-pair"><label>Músculo principal<select value={ex.muscle} onChange={event => update(ex.id, { muscle: event.target.value, approaches: ex.compound || !draft[day].some(item => item.id !== ex.id && item.muscle === event.target.value) ? 2 : 1 })}>{MUSCLES.map(name => <option key={name}>{name}</option>)}</select></label><label>Series efectivas<input type="number" min="1" max="20" required value={ex.sets || ''} onChange={event => update(ex.id, { sets: Number(event.target.value) })} /></label></div>
          <div className="input-pair"><label>Equipo<select value={ex.equipment} onChange={event => { const equipment = event.target.value; update(ex.id, { equipment, increment: INCREMENTS[equipment] }); }}>{Object.entries(EQUIPMENT).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Tipo de ejercicio<select value={ex.compound ? 'compound' : 'isolation'} onChange={event => { const compound = event.target.value === 'compound'; update(ex.id, { compound, rests: { ...ex.rests, effective: compound ? 210 : 150 } }); }}><option value="compound">Compuesto</option><option value="isolation">Aislamiento</option></select></label></div>
          <div className="input-pair"><label>Extensión planeada<select value={ex.technique} onChange={event => update(ex.id, { technique: event.target.value })}><option value="">Ninguna</option><option value="drop">Drop set</option><option value="rp">Rest-pause</option></select></label><label>Series de preparación<input type="number" min="0" max="3" required value={contextualPreparation(ex,draft[day],data.preparationSettings.minimum).approaches} onChange={event => update(ex.id, { approaches: Number(event.target.value), preparationOverride: Number(event.target.value) })} /></label></div>
          <div className="input-pair"><label>Redondeo de sugerencias (kg)<input type="number" min="0.5" max="100" step="0.5" required value={ex.increment || ''} onChange={event => update(ex.id, { increment: Number(event.target.value) })} /></label><label>Caídas de drop set<input type="number" min="1" max="3" required value={ex.dropCount} onChange={event => update(ex.id, { dropCount: Number(event.target.value) })} /></label><label>Mini-series rest-pause<input type="number" min="1" max="10" required value={ex.rpCount} onChange={event => update(ex.id, { rpCount: Number(event.target.value) })} /></label></div>
          <p className="field-note">Auto usa el orden de la sesión: primero 2; compuesto posterior 1 ligera; primer aislamiento/máquina 1 muy ligera y siguientes 0. Puedes guardar de 0 a 3, siempre sin fallo y hasta el 80% del peso de trabajo.</p>
          <h3 className="editor-subtitle">Descansos <span>segundos</span></h3><div className="input-pair">{[['warmup', 'Entre calentamientos / aproximaciones'], ['effective', 'Antes de la efectiva'], ['rp', 'Rest-pause · entre mini-series'], ['drop', 'Drop set · cambio de carga']].map(([key, label]) => <label key={key}>{label}<input type="number" inputMode="numeric" min="1" max="900" required value={ex.rests[key] || ''} onChange={event => update(ex.id, { rests: { ...ex.rests, [key]: Number(event.target.value) } })} /></label>)}</div>
          <p className="field-note">{contextualPreparation(ex,draft[day],data.preparationSettings.minimum).preparationReason}</p><button className="secondary" type="button" onClick={()=>update(ex.id,{preparationOverride:null})}>Usar previas automáticas</button>
          <label>Zona o articulación de preparación (opcional)<input aria-label="Zona de preparación" maxLength="40" placeholder="Según músculo principal" value={ex.preparationJoint??''} onChange={event=>update(ex.id,{preparationJoint:event.target.value})}/></label><p className="field-note">Por defecto cada músculo inicia su propia preparación: hombro tras pecho cuenta como primero. Una zona distinta dentro del mismo músculo también comienza con dos previas.</p>
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
    <WaistNotice records={data.measurements} date={date} />
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
