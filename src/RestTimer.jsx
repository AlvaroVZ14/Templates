import {useEffect,useRef,useState} from 'react';
import {formatSeconds} from './domain.js';
import {restTimerLabel} from './restTimer.js';
export default function RestTimer({timer,data,onClose,onAdjust,onFinish,busy=false}){
 const [now,setNow]=useState(Date.now()),end=timer?.end;
 const notified=useRef(end&&end<=Date.now()?end:null);
 useEffect(()=>{
  setNow(Date.now());if(!end)return;
  const tick=()=>setNow(Date.now()),id=setInterval(tick,250);
  document.addEventListener('visibilitychange',tick);
  return()=>{clearInterval(id);document.removeEventListener('visibilitychange',tick);};
 },[end]);
 const remaining=Math.max(0,Math.ceil(((end??now)-now)/1000));
 useEffect(()=>{if(end&&remaining===0&&notified.current!==end){notified.current=end;try{navigator.vibrate?.(80);}catch{/* Optional. */}onFinish?.();}},[remaining,end]);
 const fraction=timer?Math.min(1,Math.max(0,(end-now)/(Math.max(1,Number(timer.duration)||1)*1000))):0;
 return <aside className={`rest-timer ${!timer?'idle':remaining===0?'finished':'running'}`} aria-label="Temporizador de descanso">
  <div className="rest-dial">
   <svg viewBox="0 0 88 88" aria-hidden="true"><circle className="rest-dial-track" cx="44" cy="44" r="39"/><circle className="rest-dial-progress" cx="44" cy="44" r="39" pathLength="1" strokeDasharray="1" strokeDashoffset={1-fraction}/></svg>
   <strong role="timer" aria-label={`${remaining} segundos restantes`}>{formatSeconds(remaining)}</strong>
  </div>
  <div className="rest-copy"><strong>{timer?restTimerLabel(data,timer):'Descanso listo'}</strong><p>{timer?.label??'Confirma una serie para iniciar'}</p>{timer&&remaining===0&&<span className="rest-done" role="status">✓ Descanso terminado</span>}
   {timer&&<div className="rest-actions"><button type="button" disabled={busy||remaining===0} onClick={()=>onAdjust(-15)} aria-label="Restar 15 segundos">−15 s</button><button type="button" disabled={busy} onClick={()=>onAdjust(15)} aria-label="Sumar 15 segundos">+15 s</button><button type="button" disabled={busy} onClick={onClose} aria-label="Saltar descanso">Saltar</button></div>}
  </div>
 </aside>;
}
