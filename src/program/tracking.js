import { shiftDate } from '../wellness.js';
import { adherence, dailyTotals, dayContext, goalForDate } from './nutrition.js';
import {cardioSettings} from './cardio.js';

export function weekDays(date){const index=(new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7;return Array.from({length:7},(_,i)=>shiftDate(date,i-index));}
export {cardioRecommendation,cardioWeek} from './cardio.js';
export function markCardio(state,date,status,recommendation){
  if(state.cardioDays[date]?.status===status)return state;
  return {...state,cardioDays:{...state.cardioDays,[date]:{status,recommendation:structuredClone(recommendation),updatedAt:new Date().toISOString()}},cardioEvents:[...state.cardioEvents,{date,status,recommendation:structuredClone(recommendation),at:new Date().toISOString()}]};
}
export function weeklyNutrition(state,date){
  const days=weekDays(date),targets=days.map(day=>goalForDate(state,day));
  return {budget:targets.every(Boolean)?targets.reduce((sum,item)=>sum+item.kcal,0):null,recorded:days.reduce((sum,day)=>sum+dailyTotals(state,day).kcal,0),completeDays:days.filter(day=>state.nutritionDays[day]?.complete).length,adherence:adherence(state,date)};
}
export function recoveryItems(state,date,measureDue=false){
  const steps=cardioSettings(state,date),format=value=>value.toLocaleString('es-CL');
  const items=[['sleep',`Dormir ${state.settings.sleepGoal} horas objetivo`],['steps',`${format(steps.stepsMin)}–${format(steps.stepsMax)} pasos según tolerancia`],['mobility','10–15 min de movilidad suave: hombros, caderas y espalda'],['avoid','Evitar pesas y cardio intenso'],['hydration','Hidratación'],['weigh','Pesarme en ayunas'],['sensations','Registrar sensaciones, fatiga y dolores']];
  if(new Date(`${date}T12:00:00Z`).getUTCDay()===0)items.push(['review','Revisar progreso semanal, peso medio, tendencia y cumplimiento de kcal/proteína']);
  if(measureDue)items.push(['measurements','Registrar medidas: toca control quincenal']);
  return items;
}
