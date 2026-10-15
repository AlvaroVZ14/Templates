import { shiftDate, sleepWarning } from '../wellness.js';
import { daysBetween, phaseForDate, trend } from './phases.js';
import { adherence, dailyTotals, dayContext, goalForDate } from './nutrition.js';

export function weekDays(date){const index=(new Date(`${date}T12:00:00`).getDay()+6)%7;return Array.from({length:7},(_,i)=>shiftDate(date,i-index));}
export function cardioRecommendation(state,date){
  const phase=phaseForDate(state,date),context=dayContext(state,date),kind=phase?.kind??'maintain';
  const defaults=kind==='bulk'?{min:10,max:15,frequency:[3,4],mode:'Caminata inclinada o bici suave',steps:'8.000–10.000'}:kind==='cut'?{min:20,max:30,frequency:[4,5],mode:'Zona 2, intensidad cómoda y controlada',steps:null}:{min:15,max:20,frequency:[3,3],mode:'Cardio suave',steps:null};
  const extra=state.cardioPreferences[phase?.id]?.extraMinutes??0;
  const fatigue=state.journal[date]?.fatigue,lowSleep=sleepWarning(state.journal,date),reduce=(typeof fatigue==='number'&&fatigue>=state.programSettings.fatigueThreshold)||!!lowSleep;
  const change=trend(state,date),plateau=kind==='cut'&&phase&&daysBetween(phase.startDate,date)>=13&&change.enough&&change.weekly>=0;
  return {...defaults,min:context.type==='legs'?0:defaults.min+extra,max:context.type==='legs'?15:defaults.max+extra,mode:context.type==='legs'?'Solo caminata suave opcional':defaults.mode,optional:context.type==='legs'||context.type==='rest',reduce,reason:lowSleep?'Sueño bajo dos noches seguidas':reduce?'Fatiga alta registrada':null,plateau,phaseId:phase?.id??null,afterWeights:context.type!=='rest'};
}
export function cardioWeek(state,date){const days=weekDays(date),sessions=state.cardio.filter(item=>days.includes(item.date));return {minutes:sessions.reduce((sum,item)=>sum+item.minutes,0),performed:new Set(sessions.map(item=>item.date)).size,omitted:days.filter(day=>state.cardioDays[day]?.status==='omitted').length};}
export function markCardio(state,date,status,recommendation){
  if(state.cardioDays[date]?.status===status)return state;
  return {...state,cardioDays:{...state.cardioDays,[date]:{status,recommendation:structuredClone(recommendation),updatedAt:new Date().toISOString()}},cardioEvents:[...state.cardioEvents,{date,status,recommendation:structuredClone(recommendation),at:new Date().toISOString()}]};
}
export function weeklyNutrition(state,date){
  const days=weekDays(date),targets=days.map(day=>goalForDate(state,day));
  return {budget:targets.every(Boolean)?targets.reduce((sum,item)=>sum+item.kcal,0):null,recorded:days.reduce((sum,day)=>sum+dailyTotals(state,day).kcal,0),completeDays:days.filter(day=>state.nutritionDays[day]?.complete).length,adherence:adherence(state,date)};
}
export function recoveryItems(state,date,measureDue=false){
  const items=[['sleep',`Dormir ${state.settings.sleepGoal} horas objetivo`],['steps','8.000–10.000 pasos según tolerancia'],['mobility','10–15 min de movilidad suave: hombros, caderas y espalda'],['avoid','Evitar pesas y cardio intenso'],['hydration','Hidratación'],['weigh','Pesarme en ayunas'],['sensations','Registrar sensaciones, fatiga y dolores']];
  if(new Date(`${date}T12:00:00`).getDay()===0)items.push(['review','Revisar progreso semanal, peso medio, tendencia y cumplimiento de kcal/proteína']);
  if(measureDue)items.push(['measurements','Registrar medidas: toca control quincenal']);
  return items;
}
