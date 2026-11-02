import FriendsRoutine from './FriendsRoutine.jsx';
import About,{Feedback} from './About.jsx';
import GrungeAtmosphere,{Cracks} from './Grunge.jsx';
import Brand from './Brand.jsx';
import {useVisualEnvironment} from './VisualEffects.jsx';
import usePwa from './usePwa.js';
import PwaSettings from './PwaSettings.jsx';
import {parseRoutineDraft} from './routineDraft.js';
import {shiftDate} from './wellness.js';
import BackupPanel from './BackupPanel.jsx';
import {AppearanceSettings, ShadowBackground, appearanceFor} from './Appearance.jsx';
import {MotivationSettings} from './Motivation.jsx';
import ParticleBackground from './VisualEffects.jsx';
import SideDecor from './SideDecor.jsx';
const WeightSetup=lazy(()=>import('./WeightSetup.jsx'));
import CardioSettings from './CardioSettings.jsx';
import PainPage from './Pain.jsx';
import SimpleHome from './SimpleHome.jsx';
import WorkoutDeck from './WorkoutDeck.jsx';
import WorkoutSummary,{CompletionStamp} from './WorkoutSummary.jsx';
import ProfilePage,{ProfileWizard,ProfileSleep} from './Profile.jsx';
import RestTimer from './RestTimer.jsx';
import {adjustRestTimer} from './restTimer.js';
import {startGymSession,openGymSession} from './gym.js';
import {finishQuickSession} from './quickRegistration.js';
import useWakeLock from './useWakeLock.js';
import useRestAudio from './useRestAudio.js';
import {restMessage,sessionName} from './calendarText.js';
import {LOAD_TYPES,PATTERNS,classifyExercise} from './classification.js';
const Progress=lazy(()=>import('./Progress.jsx'));
import {captureMonthlyReviews} from './progress.js';
import { lazy, Suspense, memo, useCallback, useEffect, useRef, useState } from 'react';
import { EQUIPMENT, INCREMENTS, DAYS, EXTENSIONS, KINDS, MUSCLES, dayIndex, initialState, migrateState, localDate, makeExercise, removeLog, restFor, validateLog, validateRoutine, weekDates, weeklyVolume } from './domain.js';
import useSeriesQueue from './useSeriesQueue.js';
import {warmTrainingPersistence,persistTrainingMetadata,stopTrainingPersistence} from './trainingPersistence.js';
import { updateState, loadState,eraseDeviceRecords } from './db.js';
import {DraftProvider,useDrafts,useFormDraft} from './drafts.jsx';
import {incompleteSession} from './navigation.js';
import {Drawer,EdgeSwipe,NavigationSettings} from './Navigation.jsx';
import ExerciseCard,{equalExerciseView} from './ExerciseCard.jsx';
const Diary=lazy(()=>import('./Diary.jsx'));
const Measurements=lazy(()=>import('./Measurements.jsx'));
const WaistNotice=lazy(()=>import('./Measurements.jsx').then(module=>({default:module.WaistNotice})));
import { measurementReminder } from './measurements.js';
import { advancePhases, captureAnchors } from './program/phases.js';
import { dayContext } from './program/nutrition.js';
const FoodPage=lazy(()=>import('./program/FoodPage.jsx'));
import { sessionExercise } from './training.js';
import {sessionPreview} from './sessionPreview.js';
import { contextualPreparation } from './preparation.js';
const History=lazy(()=>import('./History.jsx'));
const MonthlyCheck=lazy(()=>import('./MonthlyCheck.jsx'));
const DayOptions=lazy(()=>import('./DayOptions.jsx'));
const Method=lazy(()=>import('./Method.jsx'));
import {StorageNotice,requestPersistentStorage} from './SessionRecord.jsx';

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

export default function App() {
  const [data, setData] = useState(null);
  const locked = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState('today');
  const [date, setDate] = useState(localDate());
  const pwa = usePwa();
  const [clockDay,setClockDay]=useState(localDate());
  const [menuOpen,setMenuOpen]=useState(false);
  const drafts=useDrafts(data,setData,setError);
  const seriesQueue=useSeriesQueue(data,setData,setError);
  useEffect(()=>{const exported=event=>setData(current=>current?{...current,backupSettings:event.detail}:current);window.addEventListener('olympia-friends-backup-exported',exported);return()=>window.removeEventListener('olympia-friends-backup-exported',exported);},[]);
  const navigating=useRef(false);
  async function navigate(target,nextDate=target==='today'?localDate():date){
    if(navigating.current)return;
    if(target===page&&nextDate===date){setMenuOpen(false);return;}
    navigating.current=true;
    try{
      if(!window.dispatchEvent(new Event('heavy-duty-before-navigate',{cancelable:true})))return;
      await seriesQueue.flush();
      await drafts.flush();
      setError('');
      if(page==='workout'&&data&&incompleteSession(data,date,drafts.entries())&&!window.confirm('Hay una sesión o un registro a medio completar. Tu borrador está guardado y lo recuperarás al volver. ¿Quieres cambiar de pantalla o sesión?'))return;
      if(target==='workout'){const next=await updateState(state=>({...state,navigationSettings:{...state.navigationSettings,lastSession:nextDate}}));setData(next);}
      setDate(nextDate);setPage(target);setMenuOpen(false);
    }catch{/* Keep the form visible when a draft cannot be saved. */}
    finally{navigating.current=false;}
  }
  const drawerSide=data?.navigationSettings?.drawerSide??'right';
  const configuredAppearance=appearanceFor(data),gymOpen=openGymSession(data);
  const gymActive=Boolean(gymOpen&&page==='workout'&&date===gymOpen.date);
  const appearance=['workout','onboarding'].includes(page)?{...configuredAppearance,motion:false,effects:'off'}:page==='today'?{...configuredAppearance,effects:configuredAppearance.effects==='off'?'off':'reduced'}:configuredAppearance;
  const visual=useVisualEnvironment(appearance);
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
      const existing=await loadState();
      let reset=false;try{reset=localStorage.getItem('olympia-friends-empty-reset')==='1';}catch{}
      const state=captureMonthlyReviews(captureAnchors(advancePhases(existing?migrateState(existing):{...initialState(),phases:[],phaseHistory:[],...(reset?{measurements:[],routineMigrationBackups:[]}:{}),onboarding:{status:'pending'}},localDate())),localDate());
      if(state!==existing)await updateState(()=>state);
      const open=openGymSession(state);
      seriesQueue.initialize(state);setDate(open?.date??localDate());
      setPage(state.onboarding?.status==='pending'?'onboarding':open?'workout':'today');
      warmTrainingPersistence();
      const preload=()=>{sessionPreview(state,open?.date??localDate());};
      if('requestIdleCallback' in window)requestIdleCallback(preload,{timeout:1000});else setTimeout(preload,200);
    } catch { setError('No se pudo abrir IndexedDB. Permite el almacenamiento del navegador y vuelve a intentar.'); }
  }
  useEffect(() => { boot(); }, []);
  useEffect(()=>{const listener=event=>{if(event.key!=='olympia-friends-privacy')return;if(event.newValue?.startsWith('prepare')){locked.current=true;stopTrainingPersistence();setData(null);}else if(event.newValue?.startsWith('done'))location.reload();};window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener);},[]);
  useEffect(()=>{let day=localDate();const check=()=>{const next=localDate();setClockDay(next);if(next!==day)change(state=>state).then(saved=>{if(saved)day=next;});};const timer=setInterval(check,60000);document.addEventListener('visibilitychange',check);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',check);};},[]);
  async function change(updater,photos=[]) {
    try{await seriesQueue.flush();}catch{return false;}
    if (locked.current) return false;
    locked.current = true; setSaving(true); setError('');
    try {
      const next = await updateState(state => captureMonthlyReviews(captureAnchors(advancePhases(updater(state),localDate())),localDate()),photos);
      setData(next);
      return true;
    } catch { setError('No se pudo guardar. Tu cambio sigue en pantalla: libera espacio o permite el almacenamiento y vuelve a intentar.'); return false; }
    finally { locked.current = false; setSaving(false); }
  }
  async function beginWorkout(){
    const pending=openGymSession(data),target=pending?.date??localDate();
    try{if(!pending&&!data.sessionMeta?.[target]?.endedAt)seriesQueue.begin(target);}catch(error){setError(error.message);return;}
    if(data.gymSettings?.sound)audio.arm();
    setDate(target);setPage('workout');
  }
  async function finishGym(dateToFinish=date){
    try{await seriesQueue.flush();await drafts.flush();}catch{return;}
    await change(state=>finishQuickSession(state,dateToFinish));
  }
  async function gymSound(enabled){
    if(enabled)audio.arm();
    await change(state=>({...state,gymSettings:{...state.gymSettings,sound:enabled}}));
  }
  async function erasePersonal(){
    let erased=false;
    try{await seriesQueue.flush();await drafts.flush();locked.current=true;try{localStorage.setItem('olympia-friends-empty-reset','1');localStorage.setItem('olympia-friends-privacy',`prepare-${Date.now()}`);}catch{}stopTrainingPersistence();await eraseDeviceRecords({...initialState(),measurements:[],phases:[],phaseHistory:[],routineMigrationBackups:[],onboarding:{status:'pending'}});erased=true;try{for(const key of Object.keys(localStorage))if(/^olympia-friends-/.test(key))localStorage.removeItem(key);localStorage.setItem('olympia-friends-privacy',`done-${Date.now()}`);}catch{}location.reload();}
    catch{if(erased){location.reload();return;}locked.current=false;try{localStorage.setItem('olympia-friends-privacy',`done-${Date.now()}`);}catch{}setError('No se pudo borrar el almacenamiento local. Los registros se conservan; vuelve a intentar.');}
  }
  const [installHelp, setInstallHelp] = useState(false);
  const measureReminder = data ? measurementReminder(data.measurements, localDate()) : null;
  return <DraftProvider value={drafts}><div className={`app-shell menu-${drawerSide} ${page==='workout'&&(data?.timer||gymActive)?'timer-visible':''} ${gymActive?'gym-active':''} ${impact?'screen-impact':''}`} data-page={page} data-effects={appearance.effects} data-grunge={visual.mode} data-visible={visual.visible} style={{'--section-index':`"${({today:'01',history:'02',measurements:'03',diary:'04',food:'05',volume:'06',method:'07',settings:'08',routine:'09',weights:'10',pain:'11',overview:'02','monthly-check':'12',workout:'01','day-options':'13'})[page]}"`}} onChangeCapture={failureImpact}>
    <GrungeAtmosphere ready={!!data&&page!=='today'&&page!=='workout'&&page!=='onboarding'} day={clockDay} scene={page} mode={visual.mode} visible={visual.visible} gym={gymActive} name={appearance.name}/>
    {page!=='today'&&page!=='workout'&&page!=='onboarding'&&<ShadowBackground appearance={appearance} ambient/>}
    <ParticleBackground appearance={appearance} page={page}/>
    <SideDecor appearance={appearance}/>
    <header className="masthead"><Cracks header/>
      <div className="brand" aria-label={appearance.name}>
        <Brand name={appearance.name}/>
      </div>
      <div className="header-actions"><button className="menu-button" aria-label="Abrir menú" aria-expanded={menuOpen} aria-haspopup="dialog" onClick={()=>setMenuOpen(true)}><Icon name="menu" size={22}/><span className="menu-word">Menú</span></button><span className={`connection ${!pwa.online ? 'offline' : ''}`}><i />{!pwa.online ? 'Sin conexión' : pwa.ready ? 'Offline listo' : 'Local · privado'}</span>
</div>
    </header>
    {pwa.available&&page!=='today'&&<aside className="notice pwa-update" role="status"><button className="primary" disabled={saving||pwa.updating||pwa.checking||!data} onClick={()=>pwa.update(async()=>{if(locked.current)return false;await seriesQueue.flush();await drafts.flush();return true;})}>{pwa.updating?'Guardando y actualizando…':'Hay una versión nueva, tocar para actualizar'}</button><p className="field-note">Conserva tus registros y borradores en este dispositivo.</p></aside>}
    {installHelp && <aside className="install-help"><strong>Instala {appearance.name}</strong><p>En Android o escritorio: menú del navegador → Instalar aplicación. En iPhone: Safari → Compartir → Añadir a pantalla de inicio.</p><p>{pwa.ready ? 'La app está preparada para abrir sin conexión.' : 'La instalación y el modo offline se preparan en la versión de producción, con HTTPS o localhost.'}</p><button className="quiet" onClick={() => setInstallHelp(false)}>Entendido</button></aside>}
    {(error || pwa.error) && <div className="error global-error" role="alert">{error || pwa.error}{!data && <button className="quiet" onClick={boot}>Reintentar</button>}</div>}
    {!data ? <main className="loading" aria-live="polite"><Brand name={appearance.name} full loading/><span>{error ? 'Tus datos no se han modificado.' : 'Preparando tu entrenamiento…'}</span></main> : <>
      <main id="main-content"><Suspense fallback={<div className="page-skeleton" role="status">Abriendo sección local…</div>}>
        {page==='workout'&&date!==clockDay&&<aside className="notice"><p>Estás viendo la sesión del {date}. Hoy en Chile: {clockDay}.</p><button className="secondary" onClick={()=>navigate('today',clockDay)}>Ir a hoy</button></aside>}
        {gymOpen&&!gymActive&&page!=='today'&&<aside className="notice gym-recovery"><p>Sesión abierta del {gymOpen.date}. Tus series están guardadas.</p><button className="secondary" onClick={()=>navigate('workout',gymOpen.date)}>Volver a la sesión abierta</button></aside>}
        {page !== 'today' && page !== 'workout' && page !== 'measurements' && page !== 'monthly-check' && page!=='onboarding' && page!=='profile' && measureReminder?.due && <aside className="notice measurement-reminder" aria-label="Recordatorio de medidas"><div><strong>Tu control de medidas está pendiente.</strong><p>Desde {measureReminder.date} · En ayunas y mismas condiciones; bíceps en pose y resto relajado.</p></div><button className="secondary" onClick={() => { navigate('measurements',localDate()); }}>Ir a Medidas</button></aside>}
        {page==='today'&&<SimpleHome data={data} date={clockDay} onStart={beginWorkout} saving={saving} change={change}/>}
        {page==='onboarding'&&<ProfileWizard onboarding data={data} change={change} saving={saving} onDone={()=>setPage('today')}/>}
        {page==='profile'&&<ProfilePage data={data} change={change} saving={saving} onErase={erasePersonal}/>}
        {page==='settings'&&<button className="secondary profile-settings-link" onClick={()=>navigate('profile')}>Perfil · datos y objetivos</button>}
        {page === 'workout' && <Workout key={date} data={data} date={date} change={change} saving={saving} onFood={()=>navigate('food')} onDiary={()=>navigate('diary')} onMeasures={()=>navigate('measurements')} gymActive={gymActive} finishGym={finishGym} wake={wake} audio={audio} gymSound={gymSound} onPain={()=>navigate('pain')} onConfirm={seriesQueue.confirm} onDone={()=>navigate('today',clockDay)} restTimer={<RestTimer timer={data.timer} data={data} busy={saving} onAdjust={delta=>change(state=>adjustRestTimer(state,delta))} onFinish={()=>{if(gymActive&&data.gymSettings?.sound)audio.play();}} onClose={()=>change(state=>({...state,timer:null}))}/>} />}
        {page==='weights'&&<WeightSetup data={data} change={change} saving={saving} onDone={()=>{setPage('today');setMenuOpen(false);}}/>}
        {page==='pain'&&<PainPage data={data} date={localDate()} onDiary={value=>navigate('diary',value)}/>}
        {page==='routine'&&<FriendsRoutine data={data} change={change} saving={saving}/>}
        {page === 'overview'&&<><Progress data={data}><Volume data={data} date={date} setDate={setDate}/></Progress><details className="overview-history"><summary>Historial de sesiones</summary><History embedded data={data} change={change} saving={saving} storage={storage}/></details></>}
        {page === 'volume' && <Progress data={data}><Volume data={data} date={date} setDate={setDate}/></Progress>}
        {page === 'diary' && <><ProfileSleep data={data}/><Diary key={date} data={data} date={date} setDate={setDate} change={change} saving={saving} /></>}
        {page === 'measurements' && <Measurements key={date} data={data} date={date} setDate={setDate} change={change} saving={saving} />}
        {page === 'food' && <FoodPage key={date} data={data} date={date} setDate={setDate} change={change} saving={saving} onDiary={()=>navigate('diary')} onProfile={()=>navigate('profile')} />}
        {page==='settings'&&<><label className="check-label settings-audio"><input type="checkbox" checked={data.gymSettings?.sound===true} onChange={event=>gymSound(event.target.checked)}/>Aviso sonoro de descanso</label><div className="settings-shortcuts">{[['weights','Configurar pesos'],['routine','Rutina'],['day-options','Cardio y recuperación'],['pain','Zonas con molestias']].map(([id,label])=><button className="secondary" key={id} onClick={()=>navigate(id)}>{label}</button>)}</div><NavigationSettings data={data} change={change} saving={saving}/><PwaSettings pwa={pwa} saving={saving} onUpdate={()=>pwa.update(async()=>{if(locked.current)return false;await seriesQueue.flush();await drafts.flush();return true;})}/><CardioSettings data={data} change={change} saving={saving}/><AppearanceSettings data={data} change={change} saving={saving}/><MotivationSettings data={data} change={change} saving={saving}/><button className="secondary" onClick={()=>pwa.prompt?pwa.install():setInstallHelp(true)}>Instalar app</button><BackupPanel/><button className="danger" onClick={()=>{if(confirm("Borrar todos los datos de esta edicion, incluidas fotos y respaldos internos? Exporta primero si quieres conservarlos."))erasePersonal();}}>Borrar todo</button><Feedback/><StorageNotice status={storage} retry={()=>requestStorage(true)} busy={storageBusy}/></>}
        {page==='method'&&<Method/>}{page==='about'&&<About/>}
        {page === 'history' && <History data={data} change={change} saving={saving} storage={storage}/>}
        {page==='day-options'&&<DayOptions data={data} date={date} change={change} saving={saving} onFood={()=>navigate('food')} onDiary={()=>navigate('diary')} onMeasures={()=>navigate('measurements')} onPain={()=>navigate('pain')} gymActive={Boolean(gymOpen)} wake={wake} audio={audio} gymSound={gymSound}/>}
        {page==='monthly-check'&&<MonthlyCheck data={data} change={change} saving={saving}/>}
      </Suspense></main>
    </>}
    {data&&<><EdgeSwipe side={drawerSide} onOpen={()=>setMenuOpen(true)}/><Drawer open={menuOpen} onClose={()=>setMenuOpen(false)} side={drawerSide} data={data} date={date} page={page} navigate={navigate}/></>}
  </div></DraftProvider>;
}

function Workout({ data, date, change, saving, onFood, onDiary, onMeasures, gymActive, finishGym, wake, audio, gymSound, onPain, onConfirm, restTimer,onDone }) {
  const {context,exercises}=sessionPreview(data,date);
  const logs=data.logs.filter(log=>log.date===date),planned=exercises.reduce((sum,ex)=>sum+ex.sets,0);
  const done=exercises.reduce((sum,ex)=>sum+logs.filter(log=>log.exerciseId===ex.id&&log.kind==='effective').length,0);
  const complete=exercises.length>0&&exercises.every(ex=>logs.filter(log=>log.exerciseId===ex.id&&log.kind==='effective').length>=ex.sets);
  const finished=Boolean(data.sessionMeta?.[date]?.endedAt),rest=exercises.length?null:restMessage(data,date,localDate());
  const dateLabel=new Date(`${date}T12:00:00Z`).toLocaleDateString('es-CL',{weekday:'long',timeZone:'UTC'});
  const [current,setCurrent]=useState(data.gymSession?.date===date?data.gymSession.currentExerciseId:exercises.find(ex=>logs.filter(log=>log.exerciseId===ex.id&&log.kind==='effective').length<ex.sets)?.id??exercises[0]?.id);
  async function selectExercise(id){setCurrent(id);if(data.gymSession?.date===date)try{await persistTrainingMetadata({selection:{date,id}});}catch{/* The last confirmed exercise remains recoverable. */}}
  const selectRef=useRef(selectExercise);selectRef.current=selectExercise;
  const selectPanel=useCallback(id=>selectRef.current(id),[]);
  const [review,setReview]=useState(false),[closing,setClosing]=useState(false);
  async function closeWorkout(){setReview(true);setClosing(true);try{await finishGym(date);}finally{setClosing(false);}}
  if(review)return <div className="fast-session"><WorkoutSummary data={data} date={date} planned={planned} pending={closing||saving} finished={finished} onFinish={()=>finished?onDone():closeWorkout()}/><button className="quiet recap-back" onClick={()=>setReview(false)}>Revisar ejercicios</button></div>;
  return <div className="fast-session">
    <div className="fast-session-heading"><div><p>{dateLabel}</p><h1>{exercises.length?sessionName(exercises):'Descanso'}</h1></div><CompletionStamp complete={complete} done={done} planned={planned}/></div>
    {planned>0&&<div className="session-segments" role="progressbar" aria-label="Series completadas" aria-valuemin={0} aria-valuemax={planned} aria-valuenow={done}>{exercises.flatMap(ex=>Array.from({length:ex.sets},(_,row)=><i key={`${ex.id}-${row}`} className={logs.filter(log=>log.exerciseId===ex.id&&log.kind==='effective').length>row?'complete':''}/>))}</div>}
    {data.routineActivatedOn>localDate()&&<p className="notice">La sesión anterior sigue disponible. La nueva rutina se activa el {data.routineActivatedOn}.</p>}
    {context.calendarNeedsReview&&<p className="notice">Este día tenía un ajuste del calendario anterior. Puedes revisarlo en las opciones del día.</p>}
    {exercises.length?<WorkoutDeck exercises={exercises} current={current} onSelect={selectPanel} data={data} date={date} logs={logs} restTimer={restTimer}>
      {exercises.map((ex,index)=><ExercisePanel key={`${date}-${ex.id}`} exercise={ex} index={index} date={date} data={data} logs={logs.filter(log=>log.exerciseId===ex.id)} change={change} saving={saving} onConfirm={onConfirm} open={current===ex.id} onSelect={selectPanel}/>)}
    </WorkoutDeck>:<div className="rest-card" data-testid="rest-card"><h3>{rest.title}</h3><p>{rest.text}</p></div>}
    {complete&&!finished&&<button type="button" className="primary session-finish" disabled={saving} onClick={closeWorkout}>Terminar sesión</button>}
    {finished&&<button type="button" className="secondary session-finish" onClick={()=>setReview(true)}>Ver resumen</button>}
    {finished&&<p className="fast-finished" role="status">✓ Sesión terminada · todo guardado.</p>}

  </div>;
}

const ExercisePanel=memo(function ExercisePanel(props){
 const {exercise:ex,logs,open,onSelect}=props,count=logs.filter(log=>log.kind==='effective').length;
 globalThis.__BG_PERF__?.panelRender?.(ex.id);
 return <details className="workout-exercise" open data-active={open} inert={!open} aria-hidden={!open}><summary onClick={event=>{event.preventDefault();onSelect(ex.id);}}><span>{ex.name}</span><b>{count}/{ex.sets}</b></summary><ExerciseCard {...props}/></details>;
},(a,b)=>a.open===b.open&&equalExerciseView(a,b));


function Volume({ data, date, setDate }) {
  const dates = weekDates(date);
  const rows = weeklyVolume(data, date);
  const total = rows.reduce((sum, row) => sum + row.done, 0);
  const planned = rows.reduce((sum, row) => sum + row.planned, 0);
  const preparations = data.logs.filter(log => dates.includes(log.date) && ['warmup', 'approach'].includes(log.kind)).length;
  const extensions = data.logs.filter(log => dates.includes(log.date) && EXTENSIONS.includes(log.kind)).length;
  const label = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  function shift(delta) { setDate(shiftDate(date,delta)); }
  return <><div className="page-heading"><div><p className="eyebrow">CADA SERIE TIENE UN PROPÓSITO</p><h2>Tu volumen<span className="accent">.</span></h2></div><span className="outlined-tag">SEMANAL</span></div>
    <div className="week-selector"><button className="icon-button" aria-label="Semana anterior" onClick={() => shift(-7)}>←</button><span>{label(dates[0])} — {label(dates[6])} <small>{dates[0].slice(0, 4)}</small></span><button className="icon-button" aria-label="Semana siguiente" onClick={() => shift(7)}>→</button></div>
    <WaistNotice records={data.measurements} date={date} />
    <div className="volume-summary"><div><span className="eyebrow">SERIES EFECTIVAS</span><strong>{total}<small> / {planned}</small></strong><p>realizadas / planeadas</p></div><div className="summary-divider" /><div><span className="eyebrow">PREPARACIÓN</span><strong>{preparations}</strong><p>guardadas aparte</p></div><div className="summary-divider" /><div><span className="eyebrow">EXTENSIONES</span><strong>{extensions}</strong><p>drop, RP y opcionales</p></div></div>
    <div className="section-heading"><h2>Series por músculo</h2><span className="legend"><i /> Realizado <i /> Planeado</span></div>
    <div className="volume-table"><div className="volume-table-head"><span>Músculo</span><span>Meta</span><span>Plan</span><span>Hecho</span></div>{rows.map(row => <div className="volume-row" key={row.muscle}><div className="volume-row-top"><strong>{row.muscle}</strong><span>{row.target}</span><span>{row.planned}</span><b>{row.done}</b></div><div className="volume-track" role="img" aria-label={`${row.muscle}: ${row.done} realizadas, ${row.planned} planeadas, meta ${row.target}`}><div className="planned-track" style={{ width: `${row.planned / Math.max(row.target, row.planned, row.done, 1) * 100}%` }} /><div className="done-track" style={{ width: `${row.done / Math.max(row.target, row.planned, row.done, 1) * 100}%` }} /><i style={{ left: `${Math.min(99.5, row.target / Math.max(row.target, row.planned, row.done, 1) * 100)}%` }} /></div></div>)}</div>
    <div className="volume-explainer"><Icon name="chart" /><div><h3>Cuenta el trabajo efectivo.</h3><p>1 serie efectiva = 1 serie de volumen para su músculo principal. Top, Back-off, pesadas y ligeras cuentan una cada una. Drop set, rest-pause, forzadas y negativas se vinculan como extensiones y no añaden otra serie. Calentamiento y aproximación quedan fuera.</p><p>La meta es tu referencia de volumen. El plan suma tu rutina para las fechas elegidas; por eso puede diferir de la meta. El realizado conserva el músculo original de cada registro.</p></div></div>
  </>;
}

