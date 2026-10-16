import { measurementReminder } from '../measurements.js';
import { adherence, dayContext } from './nutrition.js';
import { phaseReport } from './phases.js';
import { recoveryItems, weeklyNutrition } from './tracking.js';
import {localDate} from '../domain.js';

export default function Recovery({data,date,change,saving,onDiary,onMeasures}){
  if(dayContext(data,date).type!=='rest')return null;
  const checked=data.recovery[date]??{},due=measurementReminder(data.measurements,date).due,items=recoveryItems(data,date,due),report=phaseReport(data,date),weekly=weeklyNutrition(data,date),compliance=adherence(data,date);
  function toggle(key,value){return change(state=>({...state,recovery:{...state.recovery,[date]:{...state.recovery[date],[key]:value}}}));}
  return <section className="wellness-card recovery-panel"><div className="section-heading"><h2>{date===localDate()?'Recuperación de hoy':'Recuperación del día'}</h2><span>Sin compensaciones</span></div><p className="field-note">Mantén tus cuatro comidas y la proteína. Las actividades opcionales se adaptan a tu tolerancia.</p>{items.map(([key,label])=><label className="check-label" key={key}><input type="checkbox" aria-label={label} checked={checked[key]??false} disabled={saving} onChange={event=>toggle(key,event.target.checked)} /><span>{label}</span></label>)}
    <p className="field-note">Fatiga: {data.journal[date]?.fatigue??'sin registro'} · Sueño: {data.journal[date]?.sleepHours??'sin registro'} h · Dolor: {data.journal[date]?.pain||'sin registro'}.</p><div className="program-actions">{onDiary&&<button className="secondary" onClick={onDiary}>Registrar sensaciones en Diario</button>}{due&&onMeasures&&<button className="secondary" onClick={onMeasures}>Ir a Medidas</button>}</div>
    {new Date(`${date}T12:00:00`).getDay()===0&&<div className="notice"><strong>Revisión semanal</strong><p>Peso medio: {report?.average?.toFixed(2)??'sin datos'} kg. Cambio semanal: {report?.weekly?.toFixed(2)??'datos insuficientes'} kg. {weekly.completeDays}/7 días completos esta semana. En los últimos 14 días: {compliance.fulfilled}/{compliance.days} registros completos cerca de sus metas de kcal/proteína.</p></div>}
    <label className="check-label rest-complete"><input aria-label="Descanso cumplido" type="checkbox" checked={checked.complete??false} disabled={saving} onChange={event=>toggle('complete',event.target.checked)} /><span>Descanso cumplido<small>Puedes marcarlo sin completar lo opcional.</small></span></label>
  </section>;
}
