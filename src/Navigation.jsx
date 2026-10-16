import {sessionName} from './calendarText.js';
import {useEffect,useRef,useState} from 'react';
import {DAYS,localDate,weekDates} from './domain.js';
import {dayContext} from './program/nutrition.js';
import {sessionNeighbors,shiftWeek,swipeDirection} from './navigation.js';
import {appearanceFor} from './Appearance.jsx';

function useSwipe(action){
  const start=useRef(null);
  return {
    onPointerDown(event){if(event.button!==0||event.target.closest('button,input,select,textarea,a,summary,svg,canvas,[role="img"],[contenteditable]'))return;start.current={x:event.clientX,y:event.clientY,time:Date.now()};event.currentTarget.setPointerCapture(event.pointerId);},
    onPointerCancel(){start.current=null;},
    onPointerUp(event){const first=start.current;start.current=null;if(first){const direction=swipeDirection(first,{x:event.clientX,y:event.clientY,time:Date.now()});if(direction)action(direction);}},
  };
}
export function EdgeSwipe({side,onOpen}){
  const gesture=useSwipe(direction=>{if(direction===(side==='right'?'left':'right'))onOpen();});
  return <div className={`drawer-edge ${side}`} aria-hidden="true" data-testid="drawer-edge" {...gesture}/>;
}
export function Drawer({open,onClose,side,data,date,page,navigate}){
  const dialog=useRef(null);
  const historyTransition=useRef(Promise.resolve());
  useEffect(()=>{
    const el=dialog.current;if(!open){if(el.open)el.close();return;}
    let cancelled=false,cleanup;
    async function show(){
      await historyTransition.current;if(cancelled)return;
      if(!el.open)el.showModal();
      const previous=document.body.style.overflow;document.body.style.overflow='hidden';
      const token=crypto.randomUUID();history.pushState({...history.state,heavyDutyDrawer:token},'');
      const back=()=>onClose();window.addEventListener('popstate',back);
      cleanup=()=>{document.body.style.overflow=previous;window.removeEventListener('popstate',back);if(history.state?.heavyDutyDrawer===token){historyTransition.current=new Promise(resolve=>{window.addEventListener('popstate',resolve,{once:true});history.back();});}};
    }
    show();return()=>{cancelled=true;cleanup?.();};
  },[open]);
  const closeGesture=useSwipe(direction=>{if(direction===side)onClose();});
  return <dialog ref={dialog} className={`nav-drawer ${side}`} aria-label="Menú de navegación" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===dialog.current){const r=dialog.current.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right)onClose();}}}>
    <div className="drawer-heading" {...closeGesture}><div><p className="eyebrow">{appearanceFor(data).name}</p><h2>Tu semana</h2></div><button className="icon-button" aria-label="Cerrar menú" onClick={onClose}>×</button></div>
    <p className="drawer-week">Semana del {weekDates(date)[0].split('-').reverse().join('/')} <span>Desliza el encabezado para cerrar</span></p>
    <nav aria-label="Sesiones de la semana" className="drawer-sessions">{weekDates(date).map((value,index)=>{
      const context=dayContext(data,value),rest=!context.exercises.length,today=value===localDate();
      return <button key={value} className={`${today?'today':''} ${date===value&&page==='today'?'selected':''}`} aria-current={date===value&&page==='today'?'date':undefined} onClick={()=>navigate('today',value)}><span className="drawer-day">{DAYS[index].slice(0,3)}<b>{value.slice(-2)}</b></span><span><strong>{rest?'Descanso':sessionName(context.exercises)}</strong><small>{DAYS[index]}{today?' · Hoy':''}{rest?' · Recuperación':''}</small></span><span aria-hidden="true">{rest?'○':'›'}</span></button>;
    })}</nav>
    <nav className="drawer-links" aria-label="Secciones">{[['today','Hoy','□'],['weights','Configurar pesos','㎏'],['pain','Zonas con molestias','!'],['history','Historial','◷'],['measurements','Medidas','↔'],['diary','Diario','▤'],['volume','Progreso','↗'],['routine','Rutina','✎'],['food','Comida','◉'],['method','Método','◇'],['settings','Ajustes','⚙']].map(([id,label,icon])=><button key={id} aria-current={page===id?'page':undefined} onClick={()=>navigate(id)}><span aria-hidden="true">{icon}</span>{label}<span aria-hidden="true">›</span></button>)}</nav>
    <label>Fecha de entrenamiento<input aria-label="Fecha de entrenamiento" type="date" value={date} onChange={event=>{if(event.target.value)navigate('today',event.target.value);}}/></label><SessionNavigation data={data} date={date} setDate={value=>navigate('today',value)}/>
    <p className="drawer-foot">Solo tú. Tu ritmo. Tu progreso.<br/>Datos privados en este dispositivo.</p>
  </dialog>;
}
export function SessionNavigation({data,date,setDate}){
  const {previous,next}=sessionNeighbors(data,date),[compare,setCompare]=useState(false);
  const gesture=useSwipe(direction=>{const target=direction==='left'?next:previous;if(target)setDate(target);});
  const lastDate=shiftWeek(date),past=data.sessions?.find(session=>session.date===lastDate&&session.routineDay===dayContext(data,date).routineDay);
  useEffect(()=>setCompare(false),[date]);
  return <section className="session-navigation" aria-label="Navegar entre sesiones">
    <div className="session-swipe-surface" {...gesture} data-testid="session-swipe"><button className="icon-button" aria-label="Sesión anterior de la semana" disabled={!previous} onClick={()=>setDate(previous)}>←</button><div><strong>Una sesión a la vez</strong><small>Desliza para cambiar · esta semana</small></div><button className="icon-button" aria-label="Sesión siguiente de la semana" disabled={!next} onClick={()=>setDate(next)}>→</button></div>
    <button className="last-week-button" aria-expanded={compare} onClick={()=>setCompare(!compare)}>◷ Ver la misma sesión de la semana pasada <span>{compare?'−':'+'}</span></button>
    {compare&&<div className="last-week-comparison" aria-label="Comparación con la semana pasada"><h3>{lastDate.split('-').reverse().join('/')} · {sessionName(dayContext(data,date).exercises)}</h3><p className="field-note">Referencia actual frente a las efectivas guardadas la semana pasada. Mancuernas: kg por mano.</p>{past?<><div className="comparison-scroll"><table><thead><tr><th>Ejercicio</th><th>Referencia actual</th><th>Semana pasada</th></tr></thead><tbody>{dayContext(data,date).exercises.map(ex=>{const old=past.exercises.find(item=>item.profileId===ex.profileId&&item.equipment===ex.equipment),sets=old?.sets.filter(item=>item.type==='effective');return <tr key={ex.id}><th>{ex.name}</th><td>{data.profiles[ex.profileId]?.workWeight??'Sin peso'} kg</td><td>{sets?.length?sets.map(item=>`${item.weight} kg × ${item.reps}`).join(' / '):'Sin registro'}</td></tr>;})}</tbody></table></div><button className="secondary" onClick={()=>setDate(lastDate)}>Abrir sesión del {lastDate}</button></>:<p>No hay una sesión guardada ese día. Tus datos actuales siguen intactos.</p>}</div>}
  </section>;
}
export function NavigationSettings({data,change,saving}){
  const side=data.navigationSettings?.drawerSide??'right';
  const [message,setMessage]=useState('');
  return <><div className="page-heading"><div><p className="eyebrow">A TU MANERA</p><h1>Ajustes<span className="accent">.</span></h1></div></div><section className="wellness-card"><h2>Menú al alcance del pulgar</h2><p>Elige el borde desde el que se abre el cajón. También puedes usar el botón Menú.</p><label>Lado del menú<select aria-label="Lado del menú" disabled={saving} value={side} onChange={async event=>{const value=event.target.value;setMessage('');if(await change(state=>({...state,navigationSettings:{...state.navigationSettings,drawerSide:value}})))setMessage('Preferencia guardada.');}}><option value="right">Derecha (por defecto)</option><option value="left">Izquierda</option></select></label>{message&&<p className="success" role="status">{message}</p>}<p className="field-note">Desliza desde el borde elegido hacia dentro. Para pasar entre sesiones, desliza la franja con flechas dentro del cajón. Los gráficos y campos conservan sus gestos.</p></section></>;
}
export {default as Method} from './Method.jsx';
