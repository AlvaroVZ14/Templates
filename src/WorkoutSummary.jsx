import {useEffect,useRef,useState} from 'react';
import {formatSeconds} from './domain.js';
import {workoutSummary} from './workoutSummary.js';
const number=value=>value.toLocaleString('es-CL',{maximumFractionDigits:1});
export function CompletionStamp({complete,done,planned}){
 const previous=useRef(complete),[pulse,setPulse]=useState(false);
 useEffect(()=>{const arrived=complete&&!previous.current;previous.current=complete;if(!arrived)return;setPulse(true);const id=setTimeout(()=>setPulse(false),200);return()=>clearTimeout(id);},[complete]);
 return complete?<span className={`completion-stamp ${pulse?'stamp-enter':''}`} role="status">✓ {done}/{planned} · COMPLETO</span>:null;
}
export default function WorkoutSummary({data,date,planned,pending,finished,onFinish}){
 const report=workoutSummary(data,date);
 return <section className="session-recap" aria-label="Resumen de entrenamiento">
  <p className="recap-eyebrow">TRABAJO HECHO</p><h2>SESIÓN COMPLETA</h2>
  <p className="recap-message">Guardaste el esfuerzo. Ahora toca recuperar.</p>
  <div className="recap-stats"><div><span>Series completadas</span><strong>{report.effectiveSets}<small> / {planned}</small></strong></div><div><span>Volumen total</span><strong>{number(report.volumeKg)}<small> kg</small></strong></div><div><span>Descanso promedio</span><strong>{report.averageRestSeconds==null?'—':formatSeconds(report.averageRestSeconds)}</strong><small>{report.measuredRests} descansos medidos</small></div></div>
  <details className="recap-volume-note"><summary>Cómo se calcula el volumen</summary><p>Suma de carga registrada × repeticiones, incluidas las técnicas. Previas excluidas. Mancuernas por mano; el peso corporal no se añade al lastre. El descanso promedio usa solo tiempos medidos.</p></details>
  <section className="recap-improvements"><h3>Mejoras de carga</h3>{report.loadImprovements.length?report.loadImprovements.map(row=><div key={`${row.profileId}-${row.equipment}`}><span>{row.name}<small>{row.previousDate.split('-').reverse().join('/')}: {number(row.previousWeight)} kg</small></span><strong>↑ +{number(row.weight-row.previousWeight)} kg</strong></div>):<p>Sin subidas de carga comparables con la última sesión.</p>}</section>
  {finished&&<p className="fast-finished" role="status">✓ Sesión terminada · todo guardado.</p>}
  <button type="button" className="primary recap-finish" disabled={pending} onClick={onFinish}>{pending?'Guardando…':'Terminar'}</button>
 </section>;
}
