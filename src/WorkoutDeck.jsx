import {useEffect,useRef} from 'react';
import {previousEffectiveSession,quickSetValues} from './quickRegistration.js';

const number=value=>value==null?'—':Number(value).toLocaleString('es-CL');
export default function WorkoutDeck({exercises,current,onSelect,data,date,logs,restTimer,children}){
 const track=useRef(null),pending=useRef(null),latest=useRef({current,onSelect,exercises});
 latest.current={current,onSelect,exercises};
 const index=Math.max(0,exercises.findIndex(ex=>ex.id===current)),active=exercises[index];
 const previous=previousEffectiveSession(data,active,date)[0],suggestion=quickSetValues(data,active,date,0,logs.filter(row=>row.exerciseId===active.id));
 const count=ex=>logs.filter(row=>row.exerciseId===ex.id&&row.kind==='effective').length;
 function jump(next){
  const ex=exercises[next];if(!ex)return;
  clearTimeout(pending.current);onSelect(ex.id);
  track.current?.scrollTo({left:next*track.current.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 useEffect(()=>{
  const el=track.current;
  const align=()=>{const {exercises,current}=latest.current;el.scrollTo({left:Math.max(0,exercises.findIndex(ex=>ex.id===current))*el.clientWidth,behavior:'instant'});};
  const observer=new ResizeObserver(align);observer.observe(el);align();
  return()=>{observer.disconnect();clearTimeout(pending.current);};
 },[]);
 function scroll(){
  if(matchMedia('(min-width: 1000px)').matches)return;
  clearTimeout(pending.current);
  pending.current=setTimeout(()=>{const el=track.current,{exercises,current,onSelect}=latest.current;if(!el?.clientWidth)return;const ex=exercises[Math.round(el.scrollLeft/el.clientWidth)];if(ex&&ex.id!==current)onSelect(ex.id);},100);
 }
 return <div className="workout-layout">
  <nav className="exercise-rail" aria-label="Ejercicios de la sesión">
   <p>Tu sesión <span>{exercises.length} ejercicios</span></p>
   {exercises.map((ex,i)=><button key={ex.id} aria-current={current===ex.id?'step':undefined} onClick={()=>jump(i)}><span className={`rail-index ${count(ex)>=ex.sets?'done':''}`}>{count(ex)>=ex.sets?'✓':String(i+1).padStart(2,'0')}</span><span>{ex.name}<small>{count(ex)}/{ex.sets} series</small></span></button>)}
  </nav>
  <div className="workout-focus">
   <header className="exercise-focus-heading"><span>Ejercicio {index+1} / {exercises.length}</span><div><button aria-label="Ejercicio anterior" disabled={index===0} onClick={()=>jump(index-1)}>‹</button><h2>{active.name}</h2><button aria-label="Ejercicio siguiente" disabled={index===exercises.length-1} onClick={()=>jump(index+1)}>›</button></div></header>
   <nav className="exercise-pills" aria-label="Elegir ejercicio">{exercises.map((ex,i)=><button key={ex.id} aria-label={`Ir a ${ex.name}`} aria-current={ex.id===current?'step':undefined} className={count(ex)>=ex.sets?'done':''} onClick={()=>jump(i)}>{count(ex)>=ex.sets?'✓':String(i+1).padStart(2,'0')}</button>)}</nav>
   <section ref={track} className="session-list exercise-track" aria-label="Registrar pesos" onScroll={scroll}>{children}</section>
   <p className="exercise-swipe-hint">‹ Desliza para cambiar de ejercicio ›</p>
  </div>
  <aside className="workout-insights" aria-label="Referencia del ejercicio">
   <div className="workout-rest">{restTimer}</div>
   <section><span>Última marca</span><strong>{previous?`${number(previous.weight)} × ${previous.reps}`:'Sin historial'}</strong><small>{previous?`${previous.date.split('-').reverse().join('/')} · ${active.equipment==='dumbbell'?'kg por mano':'kg'}`:'Confirma tu primera serie para empezar.'}</small></section>
   <section className="workout-prescription"><span>Sugerencia de hoy</span><strong>{number(suggestion.weight)} <small>kg</small></strong><p>{suggestion.repMin}–{suggestion.repMax} reps · {active.deload?'Descarga':'0–2 RIR'}</p><small>{active.name}</small></section>
  </aside>
 </div>;
}
