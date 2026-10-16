import BackupPanel from './BackupPanel.jsx';
import {AppearanceSettings, ShadowBackground, appearanceFor} from './Appearance.jsx';
import {MotivationHeading, MotivationSettings} from './Motivation.jsx';
import ParticleBackground from './VisualEffects.jsx';
import ShadowStage from './ShadowStage.jsx';
import SideDecor from './SideDecor.jsx';
import WeightSetup from './WeightSetup.jsx';
import CardioToday from './CardioToday.jsx';
import CardioSettings from './CardioSettings.jsx';
import PainPage,{PainOverview} from './Pain.jsx';
import GymPanel,{GymSummary} from './GymPanel.jsx';
import {finishGymSession,openGymSession,startGymSession} from './gym.js';
import useWakeLock from './useWakeLock.js';
import useRestAudio from './useRestAudio.js';
import {restMessage} from './calendarText.js';
import {LOAD_TYPES,PATTERNS,classifyExercise} from './classification.js';
import Progress from './Progress.jsx';
import {captureMonthlyReviews} from './progress.js';
import { useEffect, useRef, useState } from 'react';
import { EQUIPMENT, INCREMENTS, DAYS, EXTENSIONS, KINDS, MUSCLES, TITLES, dayIndex, formatSeconds, initialState, migrateState, localDate, makeExercise, removeLog, restFor, validateLog, validateRoutine, weekDates, weeklyVolume } from './domain.js';
import { updateState } from './db.js';
import {DraftProvider,useDrafts} from './drafts.jsx';
import {incompleteSession} from './navigation.js';
import {Drawer,EdgeSwipe,NavigationSettings,Method} from './Navigation.jsx';
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
import History from './History.jsx';
import {SessionEditor,StorageNotice,requestPersistentStorage} from './SessionRecord.jsx';

function Icon({ name, size = 22 }) {
  const paths = {
    bar: <><path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" /></>,
    today: <><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4m8-4v4M4 11h16m-11 5 2 2 4-4" /></>,
    edit: <><path d="m15 4 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14z" /></>,
    chart: <><path d="M4 20h17M7 16v-5m5 5V4m5 12V8" /></>,
    arrow: <path d="m9 5 7 7-7 7" />,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
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
  const [menuOpen,setMenuOpen]=useState(false);
  const [summaryOpen,setSummaryOpen]=useState(false);
  const drafts=useDrafts(data,setData,setError);
  useEffect(()=>{const exported=event=>setData(current=>current?{...current,backupSettings:event.detail}:current);window.addEventListener('heavy-duty-backup-exported',exported);return()=>window.removeEventListener('heavy-duty-backup-exported',exported);},[]);
  const navigating=useRef(false);
  async function navigate(target,nextDate=target==='today'?(data?.navigationSettings?.lastSession??date):date){
    if(navigating.current)return;
    if(target===page&&nextDate===date){setMenuOpen(false);return;}
    navigating.current=true;
    try{
      await drafts.flush();
      setError('');
      if(page==='today'&&data&&incompleteSession(data,date,drafts.entries())&&!window.confirm('Hay una sesión o un registro a medio completar. Tu borrador está guardado y lo recuperarás al volver. ¿Quieres cambiar de pantalla o sesión?'))return;
      if(target==='today'){const next=await updateState(state=>({...state,navigationSettings:{...state.navigationSettings,lastSession:nextDate}}));setData(next);}
      setDate(nextDate);setPage(target);setMenuOpen(false);setSummaryOpen(false);
    }catch{/* Keep the form visible when a draft cannot be saved. */}
    finally{navigating.current=false;}
  }
  const drawerSide=data?.navigationSettings?.drawerSide??'right';
  const configuredAppearance=appearanceFor(data),gymOpen=openGymSession(data);
  const gymActive=Boolean(gymOpen&&page==='today'&&date===gymOpen.date);
  const appearance=gymActive?{...configuredAppearance,motion:false,effects:configuredAppearance.effects==='off'?'off':'reduced'}:configuredAppearance;
  const wake=useWakeLock(gymActive),audio=useRestAudio(gymActive);
  useEffect(()=>{document.title=appearance.name;},[appearance.name]);
  const [impact,setImpact]=useState(false),impactTimer=useRef(null);
  useEffect(()=>()=>clearTimeout(impactTimer.current),[]);
  function failureImpact(event){
    if(event.target.matches('input[type="checkbox"]')&&event.target.checked&&event.target.closest('label')?.textContent.includes('Llegué al fallo')){
      clearTimeout(impactTimer.current);setImpact(true);impactTimer.current=setTimeout(()=>setImpact(false),190);
    }
  }
  const [storage,setStorage]=useState(null);
  const [storageBusy,setStorageBusy]=useState(false),storageRequest=useRef(false);
  const requestStorage=async(manual=false)=>{if(storageRequest.current)return;storageRequest.current=true;setStorageBusy(true);try{const result=await requestPersistentStorage();setStorage(previous=>({...result,attempt:(previous?.attempt??0)+(manual?1:0)}));}finally{storageRequest.current=false;setStorageBusy(false);}};
  useEffect(()=>{requestStorage();},[]);
  async function boot() {
    setError('');
    try {
      const state = await updateState(existing => captureMonthlyReviews(captureAnchors(advancePhases(existing ? migrateState(existing) : initialState(),localDate())),localDate()));
      const open=openGymSession(state);
      setData(state);setDate(open?.date??state.navigationSettings?.lastSession??localDate());
      setPage(open||state.weightSetup?.reviewedAt?'today':'weights');
    } catch { setError('No se pudo abrir IndexedDB. Permite el almacenamiento del navegador y vuelve a intentar.'); }
  }
  useEffect(() => { boot(); }, []);
  useEffect(()=>{let day=localDate();const check=()=>{const next=localDate();if(next!==day)change(state=>state).then(saved=>{if(saved)day=next;});};const timer=setInterval(check,60000);document.addEventListener('visibilitychange',check);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',check);};},[]);
  async function change(updater) {
    if (locked.current) return false;
    locked.current = true; setSaving(true); setError('');
    try {
      const next = await updateState(state => captureMonthlyReviews(captureAnchors(advancePhases(updater(state),localDate())),localDate()));
      setData(next);
      return true;
    } catch { setError('No se pudo guardar. Tu cambio sigue en pantalla: libera espacio o permite el almacenamiento y vuelve a intentar.'); return false; }
    finally { locked.current = false; setSaving(false); }
  }
  async function startTimer(seconds, label) { return change(state => ({ ...state, timer: { end: Date.now() + seconds * 1000, duration: seconds, label } })); }
  async function beginGym(){
    if(data.gymSettings?.sound)audio.arm();
    if(await change(state=>startGymSession(state,date)))setSummaryOpen(false);
  }
  async function finishGym(){
    try{await drafts.flush();}catch{return;}
    if(Object.entries(drafts.entries()).some(([key,draft])=>key!=='weights:setup'&&draft.date===date)&&!window.confirm('Hay campos sin registrar. Sus borradores están guardados, pero no cuentan como series. ¿Terminar la sesión?'))return;
    if(await change(state=>finishGymSession(state)))setSummaryOpen(true);
  }
  async function gymSound(enabled){
    if(enabled)audio.arm();
    await change(state=>({...state,gymSettings:{...state.gymSettings,sound:enabled}}));
  }
  const [installHelp, setInstallHelp] = useState(false);
  const measureReminder = data ? measurementReminder(data.measurements, localDate()) : null;
  return <DraftProvider value={drafts}><div className={`app-shell menu-${drawerSide} ${data?.timer||gymActive?'timer-visible':''} ${gymActive?'gym-active':''} ${impact?'screen-impact':''}`} data-page={page} data-effects={appearance.effects} style={{'--section-index':`"${({today:'01',history:'02',measurements:'03',diary:'04',food:'05',volume:'06',method:'07',settings:'08',routine:'09',weights:'10',pain:'11'})[page]}"`}} onChangeCapture={failureImpact}>
    <ShadowBackground appearance={appearance} ambient/>
    <ParticleBackground appearance={appearance} page={page}/>
    <SideDecor appearance={appearance}/>
    <header className="masthead">
      <div className="brand" aria-label={appearance.name}>
        <span className="brand-symbol"><Icon name="bar" size={29} /></span><span className="brand-name">{appearance.name}<small>DIARIO DE ENTRENAMIENTO · NATURAL</small></span>
      </div>
      <div className="header-actions"><button className="menu-button" aria-label="Abrir menú" aria-expanded={menuOpen} aria-haspopup="dialog" onClick={()=>setMenuOpen(true)}><Icon name="menu" size={22}/><span className="menu-word">Menú</span></button><span className={`connection ${!pwa.online ? 'offline' : ''}`}><i />{!pwa.online ? 'Sin conexión' : pwa.ready ? 'Offline listo' : 'Local · privado'}</span>
</div>
    </header>
    {installHelp && <aside className="install-help"><strong>Instala {appearance.name}</strong><p>En Android o escritorio: menú del navegador → Instalar aplicación. En iPhone: Safari → Compartir → Añadir a pantalla de inicio.</p><p>{pwa.ready ? 'La app está preparada para abrir sin conexión.' : 'La instalación y el modo offline se preparan en la versión de producción, con HTTPS o localhost.'}</p><button className="quiet" onClick={() => setInstallHelp(false)}>Entendido</button></aside>}
    {(error || pwa.error) && <div className="error global-error" role="alert">{error || pwa.error}{!data && <button className="quiet" onClick={boot}>Reintentar</button>}</div>}
    {!data ? <main className="loading" aria-live="polite"><span className="loading-mark" aria-hidden="true">B&amp;G</span><strong>{appearance.name}</strong><span>{error ? 'Tus datos no se han modificado.' : 'Preparando tu entrenamiento…'}</span></main> : <>
      <main id="main-content">
        {gymOpen&&!gymActive&&<aside className="notice gym-recovery"><p>Sesión abierta del {gymOpen.date}. Tus series están guardadas.</p><button className="secondary" onClick={()=>navigate('today',gymOpen.date)}>Volver a la sesión abierta</button></aside>}
        {page !== 'today' && page !== 'measurements' && measureReminder?.due && <aside className="notice measurement-reminder" aria-label="Recordatorio de medidas"><div><strong>Tu control de medidas está pendiente.</strong><p>Desde {measureReminder.date} · En ayunas y mismas condiciones; bíceps en pose y resto relajado.</p></div><button className="secondary" onClick={() => { navigate('measurements',localDate()); }}>Ir a Medidas</button></aside>}
        {page === 'today' && <Today data={data} date={date} setDate={value=>navigate('today',value)} change={change} saving={saving} startTimer={startTimer} onFood={()=>navigate('food')} onDiary={()=>navigate('diary')} onMeasures={()=>navigate('measurements')} appearance={appearance} gymActive={gymActive} gymOpen={gymOpen} beginGym={beginGym} finishGym={finishGym} wake={wake} audio={audio} gymSound={gymSound} onPain={()=>navigate('pain')} summaryOpen={summaryOpen} closeSummary={()=>setSummaryOpen(false)} />}
        {page==='weights'&&<WeightSetup data={data} change={change} saving={saving} onDone={()=>{setPage('today');setMenuOpen(false);}}/>}
        {page==='pain'&&<PainPage data={data} date={localDate()} onDiary={value=>navigate('diary',value)}/>}
        <div hidden={page !== 'routine'}><Routine data={data} change={change} saving={saving} /></div>
        {page === 'volume' && <Progress data={data}><Volume data={data} date={date} setDate={setDate}/></Progress>}
        {page === 'diary' && <Diary key={date} data={data} date={date} setDate={setDate} change={change} saving={saving} />}
        {page === 'measurements' && <Measurements key={date} data={data} date={date} setDate={setDate} change={change} saving={saving} />}
        {page === 'food' && <FoodPage key={date} data={data} date={date} setDate={setDate} change={change} saving={saving} onDiary={()=>navigate('diary')} />}
        {page==='settings'&&<><NavigationSettings data={data} change={change} saving={saving}/><CardioSettings data={data} change={change} saving={saving}/><AppearanceSettings data={data} change={change} saving={saving}/><MotivationSettings data={data} change={change} saving={saving}/><button className="secondary" onClick={()=>pwa.prompt?pwa.install():setInstallHelp(true)}>Instalar app</button><BackupPanel/><StorageNotice status={storage} retry={()=>requestStorage(true)} busy={storageBusy}/></>}
        {page==='method'&&<Method/>}
        {page === 'history' && <History data={data} change={change} saving={saving} storage={storage}/>}
      </main>
      {(data.timer||gymActive) && <Timer timer={data.timer} gym={gymActive} onFinish={()=>{if(gymActive&&data.gymSettings?.sound)audio.play();}} onClose={() => change(state => ({ ...state, timer: null }))} />}
    </>}
    {data&&<><EdgeSwipe side={drawerSide} onOpen={()=>setMenuOpen(true)}/><Drawer open={menuOpen} onClose={()=>setMenuOpen(false)} side={drawerSide} data={data} date={date} page={page} navigate={navigate}/></>}
  </div></DraftProvider>;
}

function Today({ data, date, setDate, change, saving, startTimer, onFood, onDiary, onMeasures,appearance,gymActive,gymOpen,beginGym,finishGym,wake,audio,gymSound,onPain,summaryOpen,closeSummary }) {
  const context = dayContext(data,date), day = context.routineDay;
  const rest=context.exercises.length?null:restMessage(data,date,localDate());
  const exercises = context.exercises.map(ex=>sessionExercise(data,ex,date));
  const [open, setOpen] = useState(null);
  useEffect(()=>setOpen(null),[date]);
  const logs = data.logs.filter(log => log.date === date);
  const planned = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const done = logs.filter(log => log.kind === 'effective').length;
  const [completeFlash,setCompleteFlash]=useState(false),previousCompletion=useRef({date,done}),completionTimer=useRef(null);
  useEffect(()=>{
    const previous=previousCompletion.current;
    if(previous.date!==date){setCompleteFlash(false);clearTimeout(completionTimer.current);}
    else if(planned>0&&done>=planned&&previous.done<planned){setCompleteFlash(true);clearTimeout(completionTimer.current);completionTimer.current=setTimeout(()=>setCompleteFlash(false),900);}
    previousCompletion.current={date,done};
  },[date,done,planned]);
  useEffect(()=>()=>clearTimeout(completionTimer.current),[]);
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const activeId = gymActive?(exercises.find(ex=>ex.id===gymOpen.currentExerciseId)?.id??exercises[0]?.id):open === null ? exercises[0]?.id : open;
  const currentIndex=Math.max(0,exercises.findIndex(ex=>ex.id===activeId));
  function selectExercise(id){if(gymActive)change(state=>({...state,gymSession:{...state.gymSession,currentExerciseId:id}}));else setOpen(activeId===id?'':id);}
  return <>
    {gymActive?<GymPanel meta={data.sessionMeta[date]} current={exercises[currentIndex]} next={exercises[currentIndex+1]} index={currentIndex} count={exercises.length} saving={saving} wake={wake} audio={audio} sound={data.gymSettings?.sound===true} onSound={gymSound} onFinish={finishGym}/>:<>
    <MotivationHeading data={data} date={date} motto={appearanceFor(data).motto}/>
    <details className="today-extra"><summary>Fase y ajustes del día</summary><PhasePanel key={`phase-${date}`} data={data} date={date} change={change} saving={saving} compact /></details>
    <ShadowStage appearance={appearance} data={data} date={date} className={planned>0&&done>=planned?'session-complete':''}>
      <ShadowBackground appearance={appearance}/>
      <div className="hero-copy"><span className="pill">{exercises.length ? appearanceFor(data).name : 'RECUPERACIÓN'}</span><p className="hero-date">{dateLabel}</p><h2>{exercises.length ? [2, 6].includes(day) ? 'Sesión personalizada' : TITLES[day] : 'Día de descanso'}</h2><p className="hero-caption">{exercises.length ? 'Poco volumen. Máxima intención.' : 'El descanso también construye.'}</p><div className="hero-stats"><span><b>{exercises.length}</b> ejercicios</span><span><b>{planned}</b> series efectivas</span></div></div>
      <div className={`progress-ring ${completeFlash?'completion-pop':''}`} style={{ '--progress': `${planned ? Math.min(done / planned, 1) * 100 : 0}%` }}><div><strong>{done}<small>/{planned}</small></strong><span>COMPLETADAS</span></div></div>
    </ShadowStage>
    <div className="training-note"><Icon name="leaf" size={18} /><span>{exercises.some(ex=>ex.deload)?'Descarga: ejecución controlada, sin fallo y sin técnicas.':'Natural. Ejecución controlada. Series efectivas al fallo técnico.'}</span></div>
    {exercises.length>0&&date===localDate()&&!gymOpen&&!data.sessionMeta?.[date]?.endedAt&&<button className="primary full start-gym" disabled={saving} onClick={beginGym}>Empezar sesión<span>Modo gimnasio · pantalla encendida si es compatible</span></button>}
    {summaryOpen&&data.sessionMeta?.[date]?.gymSummary&&<GymSummary summary={data.sessionMeta[date].gymSummary} onClose={closeSummary}/>}
    <PreparationSettings data={data} date={date} exercises={exercises} change={change} saving={saving} />
    <SessionEditor key={`session-${date}`} data={data} date={date} change={change} saving={saving}/>
    <TrainingRecovery key={`recovery-${date}`} data={data} date={date} exercises={exercises} change={change} saving={saving} />
    </>}
    <PainOverview data={data} date={date} onOpen={onPain}/>
    <section className="session-list"><div className="section-heading"><h2>{exercises.length ? 'Tu sesión' : 'Recupera para la próxima'}</h2><span>{exercises.length ? `${done} de ${planned} efectivas` : DAYS[day]}</span></div>
      {exercises.length === 0 ? <div className="rest-card" data-testid="rest-card"><Icon name="leaf" size={42} /><h3>{rest.title}</h3><p>{rest.text}</p><p>Puedes consultar otra fecha desde el menú.</p></div> : exercises.map((exercise, index) => <ExerciseCard key={`${date}-${exercise.id}`} exercise={exercise} index={index} date={date} data={data} logs={logs.filter(log => log.exerciseId === exercise.id)} expanded={activeId === exercise.id} toggle={() => selectExercise(exercise.id)} change={change} saving={saving} startTimer={startTimer} gym={gymActive} current={gymActive&&activeId===exercise.id} next={gymActive&&index===currentIndex+1} />)}
    </section>
    <CardioToday key={`cardio-today-${date}`} data={data} date={date} change={change} saving={saving}/>
    {!gymActive&&<details className="today-extra"><summary>Alimentación y recuperación del día</summary><TodayPlan key={`plan-${date}`} data={data} date={date} change={change} saving={saving} onFood={undefined} />
    <Cardio key={date} data={data} date={date} change={change} saving={saving} />
    <Recovery data={data} date={date} change={change} saving={saving} onDiary={undefined} onMeasures={undefined} /></details>}
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
          <div className="input-pair"><label>Equipo<select value={ex.equipment} onChange={event => { const equipment = event.target.value; update(ex.id, { equipment, increment: INCREMENTS[equipment] }); }}>{Object.entries(EQUIPMENT).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Tipo de carga<select value={classifyExercise(ex).loadType} onChange={event => { const loadType=event.target.value,compound=loadType!=='isolation'; update(ex.id, { loadType,compound, rests: { ...ex.rests, effective: compound ? 210 : 150 } }); }}>{Object.entries(LOAD_TYPES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div>
          <label>Patrón de movimiento<select value={classifyExercise(ex).movementPattern} onChange={event=>update(ex.id,{movementPattern:event.target.value})}>{Object.entries(PATTERNS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
          <div className="input-pair"><label>Extensión planeada<select value={ex.technique} onChange={event => update(ex.id, { technique: event.target.value })}><option value="">Ninguna</option><option value="drop">Drop set</option><option value="rp">Rest-pause</option></select></label><label>Series de preparación<input type="number" min="0" max="3" required value={contextualPreparation(ex,draft[day],data.preparationSettings.minimum).approaches} onChange={event => update(ex.id, { approaches: Number(event.target.value), preparationOverride: Number(event.target.value) })} /></label></div>
          <div className="input-pair"><label>Redondeo de sugerencias (kg)<input type="number" min="0.5" max="100" step="0.5" required value={ex.increment || ''} onChange={event => update(ex.id, { increment: Number(event.target.value) })} /></label><label>Caídas de drop set<input type="number" min="1" max="3" required value={ex.dropCount} onChange={event => update(ex.id, { dropCount: Number(event.target.value) })} /></label><label>Mini-series rest-pause<input type="number" min="1" max="10" required value={ex.rpCount} onChange={event => update(ex.id, { rpCount: Number(event.target.value) })} /></label></div>
          <p className="field-note">Auto combina orden y tipo de carga: pesado mínimo 2; liviano mínimo 1; aislamiento primero 2, después 1 ligera y siguientes 0. Aquí se estima la secuencia. En Hoy, un pesado del mismo patrón ya registrado permite 1 previa de 60% × 6. Manual 0–3, sin fallo y hasta el 80%.</p>
          <h3 className="editor-subtitle">Descansos <span>segundos</span></h3><div className="input-pair">{[['warmup', 'Entre calentamientos / aproximaciones'], ['effective', 'Antes de la efectiva'], ['rp', 'Rest-pause · entre mini-series'], ['drop', 'Drop set · cambio de carga']].map(([key, label]) => <label key={key}>{label}<input type="number" inputMode="numeric" min="1" max="900" required value={ex.rests[key] || ''} onChange={event => update(ex.id, { rests: { ...ex.rests, [key]: Number(event.target.value) } })} /></label>)}</div>
          <p className="field-note">{contextualPreparation(ex,draft[day],data.preparationSettings.minimum).preparationReason}</p><button className="secondary" type="button" onClick={()=>update(ex.id,{preparationOverride:null})}>Usar previas automáticas</button>
          {contextualPreparation(ex,draft[day],data.preparationSettings.minimum).preparationWarning&&<p className="error">Compuesto pesado sin calentar</p>}
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
  return <><div className="page-heading"><div><p className="eyebrow">CADA SERIE TIENE UN PROPÓSITO</p><h2>Tu volumen<span className="accent">.</span></h2></div><span className="outlined-tag">SEMANAL</span></div>
    <div className="week-selector"><button className="icon-button" aria-label="Semana anterior" onClick={() => shift(-7)}>←</button><span>{label(dates[0])} — {label(dates[6])} <small>{dates[0].slice(0, 4)}</small></span><button className="icon-button" aria-label="Semana siguiente" onClick={() => shift(7)}>→</button></div>
    <WaistNotice records={data.measurements} date={date} />
    <div className="volume-summary"><div><span className="eyebrow">SERIES EFECTIVAS</span><strong>{total}<small> / {planned}</small></strong><p>realizadas / planeadas</p></div><div className="summary-divider" /><div><span className="eyebrow">PREPARACIÓN</span><strong>{preparations}</strong><p>guardadas aparte</p></div><div className="summary-divider" /><div><span className="eyebrow">EXTENSIONES</span><strong>{extensions}</strong><p>drop, RP y opcionales</p></div></div>
    <div className="section-heading"><h2>Series por músculo</h2><span className="legend"><i /> Realizado <i /> Planeado</span></div>
    <div className="volume-table"><div className="volume-table-head"><span>Músculo</span><span>Meta</span><span>Plan</span><span>Hecho</span></div>{rows.map(row => <div className="volume-row" key={row.muscle}><div className="volume-row-top"><strong>{row.muscle}</strong><span>{row.target}</span><span>{row.planned}</span><b>{row.done}</b></div><div className="volume-track" role="img" aria-label={`${row.muscle}: ${row.done} realizadas, ${row.planned} planeadas, meta ${row.target}`}><div className="planned-track" style={{ width: `${row.planned / Math.max(row.target, row.planned, row.done, 1) * 100}%` }} /><div className="done-track" style={{ width: `${row.done / Math.max(row.target, row.planned, row.done, 1) * 100}%` }} /><i style={{ left: `${Math.min(99.5, row.target / Math.max(row.target, row.planned, row.done, 1) * 100)}%` }} /></div></div>)}</div>
    <div className="volume-explainer"><Icon name="chart" /><div><h3>Cuenta el trabajo efectivo.</h3><p>1 serie efectiva = 1 serie de volumen para su músculo principal. Drop set, rest-pause, forzadas y negativas se vinculan como extensiones y no añaden otra serie. Calentamiento y aproximación quedan fuera.</p><p>La meta es tu referencia original. El plan suma tu rutina actual; por eso puede diferir de la meta. El realizado corresponde a la semana elegida en el calendario.</p></div></div>
  </>;
}

function Timer({ timer, onClose,gym=false,onFinish }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);
  const end=timer?.end,remaining = Math.max(0, Math.ceil(((end??now) - now) / 1000));
  const notified = useRef(end&&end<=Date.now()?end:null);
  useEffect(() => { if (end&&remaining === 0 && notified.current !== end) { notified.current = end; navigator.vibrate?.([120]);onFinish?.(); } }, [remaining, end]);
  const fraction=timer?Math.min(1,Math.max(0,(end-now)/(Math.max(1,timer.duration)*1000))):0;
  return <aside className={`timer-bar ${remaining === 0&&timer ? 'finished' : ''} ${gym?'gym-timer':''}`} aria-label="Temporizador de descanso"><div className="rest-ring" aria-hidden="true"><svg viewBox="0 0 48 48"><circle className="rest-track" cx="24" cy="24" r="20"/><circle className="rest-countdown" cx="24" cy="24" r="20" pathLength="1" strokeDasharray="1" strokeDashoffset={1-fraction}/></svg><Icon name="clock" size={18}/></div><div><strong>{!timer?'Descanso listo':remaining > 0 ? 'Recupera. La siguiente cuenta.' : 'Descanso terminado'}</strong><span>{timer?.label??'Guarda una serie para iniciar'}</span></div><b role="timer" aria-label={`${remaining} segundos restantes`}>{formatSeconds(remaining)}</b>{timer&&<button className="icon-button" aria-label={gym?'Finalizar descanso':'Cerrar temporizador'} onClick={onClose}><Icon name="close" size={20} /></button>}</aside>;
}
