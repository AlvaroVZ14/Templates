import {shiftDate,validDate} from '../wellness.js';
import {daysBetween,phaseForDate,trend} from './phases.js';
import {dayContext} from './nutrition.js';

export const CARDIO_RANGES={bulk:[10,15],cut:[20,30],maintain:[15,20]};
export const CARDIO_MODES=['Caminata inclinada','Bicicleta suave','Trote suave'];
export const DEFAULT_CARDIO_SETTINGS={age:23,showHeartRate:false,stepsMin:8000,stepsMax:10000,phases:{bulk:{minutes:12,type:'Caminata inclinada',days:null,restDays:null},cut:{minutes:25,type:'Caminata inclinada',days:null,restDays:null},maintain:{minutes:15,type:'Caminata inclinada',days:null,restDays:null}}};
export function cardioSettings(state,date){
  const historical=(state.cardioSettingsHistory??[]).filter(row=>row.date<=date).sort((a,b)=>a.date.localeCompare(b.date)||(a.at??'').localeCompare(b.at??'')).at(-1);
  const source=historical?.settings??state.cardioSettings??{},defaults=DEFAULT_CARDIO_SETTINGS;
  return {...defaults,...source,phases:Object.fromEntries(Object.keys(defaults.phases).map(kind=>[kind,{...defaults.phases[kind],...source.phases?.[kind]}]))};
}
export function validateCardioSettings(settings){
  if(!settings||!Number.isInteger(settings.age)||settings.age<10||settings.age>100||typeof settings.showHeartRate!=='boolean')return 'Edad de 10 a 100 años; revisa la opción de pulsaciones.';
  if(![settings.stepsMin,settings.stepsMax].every(Number.isInteger)||settings.stepsMin<0||settings.stepsMax<settings.stepsMin||settings.stepsMax>100000)return 'Revisa el rango de pasos diarios.';
  for(const [kind,range] of Object.entries(CARDIO_RANGES)){
    const phase=settings.phases?.[kind];if(!phase||!Number.isInteger(phase.minutes)||phase.minutes<range[0]||phase.minutes>range[1]||!CARDIO_MODES.includes(phase.type))return `Revisa minutos y tipo de cardio en ${kind}: ${range.join('–')} min.`;
    if(phase.extraMinutes!==undefined&&(!Number.isInteger(phase.extraMinutes)||phase.extraMinutes<0||phase.extraMinutes>60))return 'Los minutos adicionales deben estar entre 0 y 60, confirmados manualmente.';
    if(kind!=='cut'&&Array.isArray(phase.restDays)&&phase.restDays.length)return 'En volumen y mantención, los descansos quedan solo para pasos.';
    for(const key of ['days','restDays'])if(phase[key]!==null&&(!Array.isArray(phase[key])||new Set(phase[key]).size!==phase[key].length||phase[key].some(day=>!Number.isInteger(day)||day<0||day>6)))return 'Los días de cardio deben ser únicos, de lunes a domingo, o Auto.';
  }
  return null;
}
export function saveCardioSettings(state,settings,date,at=new Date().toISOString()){
  const error=validateCardioSettings(settings);if(error||!validDate(date))throw new Error(error??'Fecha de configuración no válida.');
  const history=state.cardioSettingsHistory?.length?state.cardioSettingsHistory:[{id:crypto.randomUUID(),date:'0001-01-01',at,settings:structuredClone(cardioSettings(state,date))}];
  return {...state,cardioSettings:structuredClone(settings),cardioSettingsHistory:[...history,{id:crypto.randomUUID(),date,at,settings:structuredClone(settings)}]};
}
export function cardioWeekDates(date){const index=(new Date(`${date}T12:00:00`).getDay()+6)%7;return Array.from({length:7},(_,i)=>shiftDate(date,i-index));}
export function cardioSchedule(state,date,kind,settings=cardioSettings(state,date)){
  const available=state.routine.map((exercises,day)=>({exercises,day})).filter(row=>row.exercises.length&&!row.exercises.some(ex=>ex.muscle==='Cuádriceps')).map(row=>row.day);
  const automatic=kind==='maintain'?[...new Set([available[0],available[Math.floor(available.length/2)],available.at(-1)].filter(day=>day!==undefined))]:available.slice(0,4);
  const rest=cardioWeekDates(date).map((day,index)=>({index,context:dayContext(state,day)})).filter(row=>row.context.type==='rest').map(row=>row.index);
  const config=settings.phases[kind];return {days:config.days??automatic,restDays:config.restDays??(kind==='cut'&&rest.length?[rest.at(-1)]:[])};
}
export function calculateCardio(state,date){
  const phase=phaseForDate(state,date),context=dayContext(state,date),kind=phase?.kind??'maintain',settings=cardioSettings(state,date),config=settings.phases[kind],schedule=cardioSchedule(state,date,kind,settings);
  const index=(new Date(`${date}T12:00:00`).getDay()+6)%7,legs=context.type==='legs'||context.exercises.some(ex=>ex.muscle==='Cuádriceps'),rest=context.type==='rest';
  const scheduled=!legs&&(rest?kind==='cut'&&schedule.restDays.includes(index):context.exercises.length>0&&schedule.days.includes(context.routineDay));
  const entries=[shiftDate(date,-1),date].map(day=>state.journal[day]),threshold=state.programSettings?.fatigueThreshold??8;
  const tired=row=>typeof row?.fatigue==='number'&&row.fatigue>=threshold,low=row=>typeof row?.sleepHours==='number'&&row.sleepHours<7;
  const reduce=entries.every(row=>tired(row)||low(row)),recoveryReason=reduce?entries.every(low)?'Sueño bajo dos noches seguidas':entries.every(tired)?'Fatiga alta dos días seguidos':'Fatiga alta o sueño bajo dos días seguidos':null;
  const extra=config.extraMinutes??state.cardioPreferences?.[phase?.id]?.extraMinutes??0,baseMinutes=scheduled?config.minutes+extra:0,minutes=reduce?baseMinutes/2:baseMinutes;
  const change=trend(state,date),plateau=kind==='cut'&&phase&&daysBetween(phase.startDate,date)>=13&&change.enough&&change.weekly>=0;
  const reason=legs?'Día de pierna: prioriza su recuperación. Solo caminata suave opcional de 5–10 min.':!scheduled?rest?'Día de descanso sin cardio estructurado asignado; conserva solo tu meta de pasos.':'Esta sesión no tiene cardio asignado; no se compensan días omitidos.':`${rest?'Descanso elegido para zona 2 suave':'Sesión asignada de tu calendario'} · ${kind==='bulk'?'Volumen':kind==='cut'?'Mini cut':'Mantención'}${extra?` · +${extra} min confirmados`:''}.${reduce?` ${recoveryReason}: reduce a la mitad o sáltalo, sin compensar.`:''}`;
  return {version:2,date,kind,phaseId:phase?.id??null,minutes,baseMinutes,min:scheduled?(CARDIO_RANGES[kind][0]+extra)*(reduce?.5:1):0,max:scheduled?(CARDIO_RANGES[kind][1]+extra)*(reduce?.5:1):legs?10:0,type:legs?'Caminata suave':config.type,mode:legs?'Solo caminata suave opcional':config.type,intensity:kind==='cut'?'Zona 2 suave: puedes hablar frases completas sin quedarte sin aire.':'Suave: respira cómodo y habla frases completas sin quedarte sin aire.',afterWeights:!rest,scheduled,optional:legs,optionalMinutes:legs?[5,10]:null,reduce,reason,recoveryReason,plateau,frequency:[schedule.days.length+schedule.restDays.length,schedule.days.length+schedule.restDays.length],steps:`${settings.stepsMin.toLocaleString('es-CL')}–${settings.stepsMax.toLocaleString('es-CL')}`,heartRate:settings.showHeartRate?[Math.round((220-settings.age)*.6),Math.round((220-settings.age)*.7)]:null,age:settings.age};
}
export function cardioRecommendation(state,date){const snapshot=state.cardioDays?.[date]?.recommendation;return snapshot?.version===2&&Number.isFinite(snapshot.minutes)?structuredClone(snapshot):calculateCardio(state,date);}
export function validateCardioSnapshot(row){return Boolean(row&&row.version===2&&validDate(row.date)&&['bulk','cut','maintain'].includes(row.kind)&&Number.isFinite(row.minutes)&&row.minutes>=0&&row.minutes<=600&&[...CARDIO_MODES,'Caminata suave'].includes(row.type)&&typeof row.reason==='string'&&typeof row.intensity==='string'&&typeof row.optional==='boolean'&&typeof row.afterWeights==='boolean');}
export function cardioRange(state,dates){
  const rows=dates.map(date=>{const recommendation=cardioRecommendation(state,date),sessions=state.cardio.filter(row=>row.date===date);return {date,recommendation,recommended:recommendation.minutes,minutes:sessions.reduce((sum,row)=>sum+row.minutes,0),sessions,status:state.cardioDays?.[date]?.status??'pending'};});
  return {rows,minutes:rows.reduce((sum,row)=>sum+row.minutes,0),recommended:rows.reduce((sum,row)=>sum+row.recommended,0),performed:rows.filter(row=>row.sessions.length).length,omitted:rows.filter(row=>row.status==='omitted').length};
}
export function cardioWeek(state,date){return cardioRange(state,cardioWeekDates(date));}
export function completePlannedCardio(state,date,minutes,now=new Date().toISOString()){
  if(!Number.isFinite(minutes)||minutes<.5||minutes>600||minutes*2!==Math.round(minutes*2))throw new Error('Registra de 0,5 a 600 minutos, en pasos de medio minuto.');
  const id=`planned-cardio-${date}`,existing=state.cardio.find(row=>row.id===id),recommendation=existing?.recommendation?.version===2?existing.recommendation:calculateCardio(state,date),session={...existing,id,date,type:recommendation.optional?'Caminata suave':recommendation.type,minutes,intensity:!recommendation.optional&&recommendation.kind==='cut'?'Zona 2 suave':'Suave',createdAt:existing?.createdAt??now,updatedAt:now,recommendation:structuredClone(recommendation)};
  return {...state,cardio:existing?state.cardio.map(row=>row.id===id?session:row):[...state.cardio,session],cardioDays:{...state.cardioDays,[date]:{status:'performed',recommendation:structuredClone(recommendation),updatedAt:now}},cardioEvents:[...(state.cardioEvents??[]),{date,status:existing?'edited':'performed',recommendation:structuredClone(recommendation),minutes,at:now}]};
}
