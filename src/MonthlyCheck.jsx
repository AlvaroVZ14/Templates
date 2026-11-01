import {useEffect,useRef,useState} from 'react';
import {localDate} from './domain.js';
import {MEASURES} from './measurements.js';
import {CHECK_POSES,addMonthlyCheck,checkOrder,checkReminder,comparisonRows,processCheckPhoto} from './monthlyCheck.js';
import {loadCheckPhotos} from './db.js';
import './monthly-check.css';

const fmt=value=>value==null?'—':Number(value).toLocaleString('es-CL',{maximumFractionDigits:2});
export default function MonthlyCheck({data,change,saving}){
  const today=localDate(),checks=checkOrder(data.monthlyChecks??[]),reminder=checkReminder(checks,today);
  const [editing,setEditing]=useState(checks.length===0);
  const [date,setDate]=useState(today),[fields,setFields]=useState({}),[photos,setPhotos]=useState({}),[processing,setProcessing]=useState({}),[dirty,setDirty]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const generations=useRef({}),mounted=useRef(true),flight=useRef(false);
  useEffect(()=>()=>{mounted.current=false;},[]);
  useEffect(()=>{if(!dirty)return;const guard=event=>{if(!window.confirm('Este check aún no está guardado. ¿Salir y descartar los cambios?'))event.preventDefault();};const unload=event=>{event.preventDefault();event.returnValue='';};window.addEventListener('heavy-duty-before-navigate',guard);window.addEventListener('beforeunload',unload);return()=>{window.removeEventListener('heavy-duty-before-navigate',guard);window.removeEventListener('beforeunload',unload);};},[dirty]);
  function edit(key,value){setFields(current=>({...current,[key]:value}));setDirty(true);setMessage('');}
  async function select(pose,event){
    const file=event.target.files?.[0];if(!file)return;
    const generation=(generations.current[pose]??0)+1;generations.current[pose]=generation;setDirty(true);setMessage('');setError('');setProcessing(current=>({...current,[pose]:true}));
    try{const processed=await processCheckPhoto(file);if(mounted.current&&generations.current[pose]===generation)setPhotos(current=>({...current,[pose]:processed}));}
    catch(reason){if(mounted.current)setError(reason.message);}
    finally{if(mounted.current&&generations.current[pose]===generation)setProcessing(current=>({...current,[pose]:false}));event.target.value='';}
  }
  async function save(event){
    event.preventDefault();if(flight.current||Object.values(processing).some(Boolean))return;flight.current=true;setBusy(true);setError('');setMessage('');
    try{
      const converted=Object.entries(photos).map(([pose,photo])=>({...photo,id:crypto.randomUUID(),version:1,pose,month:date.slice(0,7),year:date.slice(0,4)}));
      const value=key=>fields[key]==null||fields[key]===''?null:Number(fields[key]);
      const row={id:crypto.randomUUID(),version:1,date,month:date.slice(0,7),year:date.slice(0,4),createdAt:new Date().toISOString(),weight:value('weight'),values:Object.fromEntries(MEASURES.map(({key})=>[key,value(key)])),photos:Object.fromEntries(converted.map(photo=>[photo.pose,photo.id]))};
      addMonthlyCheck(data,row,today);
      if(await change(state=>addMonthlyCheck(state,row,localDate()),converted)){setDirty(false);setPhotos({});setFields({});setEditing(false);setMessage('Check guardado en este dispositivo.');}
      else setError('No se guardó el check. Tus datos y fotos siguen aquí: vuelve a intentarlo.');
    }catch(reason){setError(reason.message);}
    finally{flight.current=false;setBusy(false);}
  }
  const disabled=saving||busy,working=Object.values(processing).some(Boolean);
  return <div className="monthly-check-page"><div className="page-heading"><div><p className="eyebrow">UNA VEZ AL MES</p><h1>Check mensual</h1></div></div>
    <p className="field-note">{reminder.due?'Check pendiente · cuando tengas un momento.':`Próximo aviso: ${reminder.next}.`} Misma luz, distancia y pose para comparar.</p>
    <details className="wellness-card check-editor" open={editing} onToggle={event=>setEditing(event.currentTarget.open)}><summary>Registrar check</summary><form className="check-form" onSubmit={save}><label>Fecha del check<input type="date" value={date} max={today} required disabled={disabled} onChange={event=>{setDate(event.target.value);setDirty(true);}}/></label>
      <div className="check-values"><label>Peso corporal (kg)<input type="number" inputMode="decimal" min="0.1" max="500" step="any" value={fields.weight??''} onChange={event=>edit('weight',event.target.value)} disabled={disabled}/></label>{MEASURES.map(({key,label})=><label key={key}>{label} (cm)<input type="number" inputMode="decimal" min="0.1" max="500" step="any" value={fields[key]??''} onChange={event=>edit(key,event.target.value)} disabled={disabled}/></label>)}</div>
      <div className="check-photo-inputs">{CHECK_POSES.map(([pose,label])=><div key={pose}><label>Foto {label.toLowerCase()}<input type="file" accept="image/*" disabled={disabled||working} onChange={event=>select(pose,event)}/></label>{processing[pose]&&<small role="status">Procesando en el dispositivo…</small>}{photos[pose]&&<><img loading="lazy" decoding="async" src={photos[pose].dataUrl} alt={`Vista previa ${label.toLowerCase()} en blanco y negro`}/><button type="button" className="secondary" disabled={disabled} onClick={()=>{setPhotos(current=>{const next={...current};delete next[pose];return next;});setDirty(true);}}>Quitar {label.toLowerCase()}</button></>}</div>)}</div>
      <p className="field-note">Fotos opcionales. Se guardan en blanco y negro, con contraste alto y hasta 1200 px; el original no se conserva. Nada se sube. Guarda el check para conservar los cambios.</p>
      <button className="primary" disabled={disabled||working}>{working?'Procesando fotos…':busy?'Guardando…':'Guardar check'}</button>{error&&<p className="error" role="alert">{error}</p>}
    </form></details>{message&&<p className="success" role="status">{message}</p>}
    <CheckComparison checks={checks}/>
    <section className="wellness-card check-timeline"><h2>Línea de tiempo</h2>{!checks.length?<p className="field-note">Tu primer check empieza aquí. No hay fotos ni medidas inventadas.</p>:<ol>{[...checks].reverse().map(row=><li key={row.id}><time dateTime={row.date}>{row.date}</time><span>{row.weight==null?'Sin peso':`${fmt(row.weight)} kg`} · {Object.keys(row.photos).length}/3 fotos · {MEASURES.filter(({key})=>row.values[key]!=null).length}/6 medidas</span></li>)}</ol>}</section>
  </div>;
}
function CheckComparison({checks}){
  const months=[...new Set(checks.map(row=>row.month))],signature=months.join(',');
  const [beforeMonth,setBefore]=useState(months.at(-2)??months.at(-1)??''),[afterMonth,setAfter]=useState(months.at(-1)??''),[pose,setPose]=useState('front'),[mode,setMode]=useState('side'),[position,setPosition]=useState(50),[images,setImages]=useState({}),[error,setError]=useState(''),[loading,setLoading]=useState(false),[visible,setVisible]=useState(false);
  const region=useRef(null);
  useEffect(()=>{if(!('IntersectionObserver' in window)){setVisible(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'200px'});if(region.current)observer.observe(region.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{setBefore(months.at(-2)??months.at(-1)??'');setAfter(months.at(-1)??'');},[signature]);
  const before=checks.findLast(row=>row.month===beforeMonth),after=checks.findLast(row=>row.month===afterMonth),ids=[before?.photos[pose],after?.photos[pose]].filter(Boolean),photoKey=ids.join(',');
  useEffect(()=>{if(!visible)return;let active=true;setImages({});setError('');setLoading(true);loadCheckPhotos(ids).then(rows=>{if(active)setImages(rows);}).catch(()=>{if(active)setError('No se pudieron leer las fotos. Vuelve a abrir esta sección.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[photoKey,visible]);
  const first=images[before?.photos[pose]],last=images[after?.photos[pose]];
  return <section ref={region} className="wellness-card check-comparison"><h2>Comparar meses</h2>{!checks.length?<p className="field-note">Guarda un check para empezar; dos meses permiten comparar cambios.</p>:<>
    {months.length<2&&<p className="field-note">Por ahora hay un solo mes. Guarda otro mes para comparar cambios.</p>}
    <div className="check-values"><label>Primer mes<select aria-label="Primer mes" value={beforeMonth} onChange={event=>setBefore(event.target.value)}>{months.map(month=><option key={month}>{month}</option>)}</select></label><label>Segundo mes<select aria-label="Segundo mes" value={afterMonth} onChange={event=>setAfter(event.target.value)}>{months.map(month=><option key={month}>{month}</option>)}</select></label></div>
    <p className="field-note">Último check de cada mes · {before?.date} → {after?.date}</p>
    <div className="check-values"><label>Pose<select aria-label="Pose" value={pose} onChange={event=>setPose(event.target.value)}>{CHECK_POSES.map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label><label>Vista<select aria-label="Vista" value={mode} onChange={event=>setMode(event.target.value)}><option value="side">Lado a lado</option><option value="slider">Antes / después</option></select></label></div>
    {loading?<p role="status">Leyendo fotos locales…</p>:mode==='slider'&&first&&last?<><div className="check-slider" role="img" aria-label="Comparación antes y después"><img loading="lazy" decoding="async" src={last.dataUrl} alt={`Después: ${after.date}`}/><img loading="lazy" decoding="async" className="check-overlay" style={{clipPath:`inset(0 ${100-position}% 0 0)`}} src={first.dataUrl} alt={`Antes: ${before.date}`}/><i style={{left:`${position}%`}}/></div><label>Deslizar comparación<input type="range" min="0" max="100" value={position} onChange={event=>setPosition(Number(event.target.value))}/></label></>:<div className="check-photo-pair">{[[first,before,'Primero'],[last,after,'Segundo']].map(([photo,check,label])=><figure key={label}>{photo?<img loading="lazy" decoding="async" src={photo.dataUrl} alt={`${label}: ${check.date}`}/>:<div className="check-no-photo">Sin foto {CHECK_POSES.find(([key])=>key===pose)?.[1].toLowerCase()}</div>}<figcaption>{check?.date}</figcaption></figure>)}</div>}
    {mode==='slider'&&(!first||!last)&&!loading&&<p className="field-note">El deslizador necesita una foto de esta pose en ambos meses.</p>}{error&&<p role="alert">{error}</p>}
    <table className="check-deltas"><thead><tr><th>Dato</th><th>Primero</th><th>Segundo</th><th>Cambio</th></tr></thead><tbody>{comparisonRows(before,after).map(row=><tr key={row.key}><th>{row.label} <small>{row.unit}</small></th><td>{fmt(row.before)}</td><td>{fmt(row.after)}</td><td>{row.delta==null?'Sin dato':`${row.delta>0?'↑ +':row.delta<0?'↓ ':'= '}${fmt(row.delta)}`}</td></tr>)}</tbody></table>
  </>}</section>;
}
