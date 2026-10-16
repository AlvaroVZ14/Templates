import {useEffect,useState} from 'react';
import {formatSeconds} from './domain.js';

const wakeText={held:'Pantalla encendida',requesting:'Solicitando pantalla encendida…',released:'Pantalla libre: el sistema puede apagarla',denied:'El navegador no permitió mantener la pantalla encendida',unsupported:'Pantalla encendida no disponible en este navegador',idle:'Pantalla libre'};
export default function GymPanel({meta,current,next,index,count,saving,wake,audio,sound,onSound,onFinish}){
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[]);
  const seconds=Math.max(0,Math.round((now-Date.parse(meta.startedAt))/1000));
  return <section className="gym-panel" aria-label="Modo gimnasio">
    <div className="gym-panel-top"><span className="pill">MODO GIMNASIO</span><b aria-label="Duración en curso">{formatSeconds(seconds)}</b></div>
    <p className="eyebrow">EJERCICIO {index+1} DE {count}</p><h1>{current?.name??'Selecciona un ejercicio'}</h1>
    <p className="gym-next">Siguiente: <strong>{next?.name??'Último ejercicio de la sesión'}</strong></p>
    <p className="gym-wake" role="status">{wakeText[wake.status]}{['denied','released'].includes(wake.status)&&<button type="button" className="quiet" onClick={wake.retry}>Reintentar pantalla encendida</button>}</p>
    <label className="check-label"><input aria-label="Aviso sonoro de descanso" type="checkbox" checked={sound} disabled={saving||!audio.supported} onChange={event=>onSound(event.target.checked)}/><span>Aviso sonoro de descanso<small>{!audio.supported?'Sonido no disponible; el aviso visual sigue activo.':sound&&!audio.armed?'Toca Habilitar sonido para permitirlo en esta apertura.':'Opcional y suave. Apagado por defecto.'}</small></span></label>
    {sound&&!audio.armed&&audio.supported&&<button className="secondary" onClick={audio.arm}>Habilitar sonido</button>}
    <p className="field-note">Cada serie se guarda al tocar Guardar. Los campos pendientes se recuperan como borradores. Efectos reducidos mientras entrenas.</p>
    <button className="primary full" disabled={saving} onClick={onFinish}>Terminar sesión</button>
  </section>;
}
export function GymSummary({summary,onClose}){
  return <section className="gym-summary wellness-card" aria-label="Resumen de la sesión" role="status"><p className="eyebrow">SESIÓN GUARDADA</p><h2>Trabajo hecho.</h2><div className="gym-summary-numbers"><div><strong>{formatSeconds(summary.durationSeconds)}</strong><span>duración total</span></div><div><strong>{summary.effectiveSets}</strong><span>series efectivas</span></div><div><strong>{summary.records.length}</strong><span>ejercicios con mejora</span></div></div><h3>Mejoras frente a la sesión anterior</h3>{summary.records.length?<ul>{summary.records.map(record=><li key={`${record.profileId}:${record.equipment}`}><strong>{record.name}</strong>: {[record.weight!==null?`${record.previousWeight} → ${record.weight} ${record.equipment==='dumbbell'?'kg por mano':'kg'}`:null,record.reps!==null?`${record.previousReps} → ${record.reps} reps`:null].filter(Boolean).join(' · ')}</li>)}</ul>:<p>Sin récords nuevos comparables. La primera sesión establece tu referencia.</p>}<p>{summary.message}</p><button className="secondary" onClick={onClose}>Cerrar resumen</button></section>;
}
