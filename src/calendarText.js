import {dayContext} from './program/nutrition.js';
import {shiftDate,validDate} from './wellness.js';
export const weekdayName=date=>new Intl.DateTimeFormat('es-CL',{weekday:'long',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
export function sessionName(exercises){
  const muscles=[...new Set(exercises.map(ex=>ex.muscle).filter(Boolean))];
  if(!muscles.length)return 'Sesión de entrenamiento';
  if(muscles.length>1&&muscles.every(name=>['Cuádriceps','Femoral','Gemelo','Aductor'].includes(name)))return 'Pierna';
  if(muscles.includes('Hombro')&&muscles.length>1&&muscles.every(name=>['Hombro','Bíceps','Tríceps'].includes(name)))return 'Hombro + Brazo';
  if(muscles.includes('Pecho')&&muscles.includes('Espalda')&&muscles.every(name=>['Pecho','Espalda','Hombro','Bíceps','Tríceps'].includes(name)))return 'Torso';
  return muscles.join(' + ');
}
export function nextTraining(data,date){
  if(!data.routine.some(list=>list.length))return null;
  const exceptions=Object.keys(data.calendar??{}).filter(day=>validDate(day)&&day>date).length;
  // Every blocked recurrence consumes a dated exception; one further week must
  // contain a configured session. This also handles long blocks without a cap.
  for(let offset=1;offset<=7*(exceptions+1);offset++){
    const next=shiftDate(date,offset),context=dayContext(data,next);
    if(context.exercises.length)return {date:next,offset,weekday:weekdayName(next),name:sessionName(context.exercises)};
  }
  return null;
}
export function restMessage(data,date,today){
  const next=nextTraining(data,date),title=date===today?'Hoy toca descansar.':date===shiftDate(today,1)?'Mañana toca descansar.':'Este día es de descanso.';
  return {title,next,text:next?`Tu rutina vuelve ${next.offset===1?`mañana (${next.weekday})`:`el ${next.weekday}`}: ${next.name}.`:'No hay una próxima sesión configurada. Ajusta tu rutina desde el menú.'};
}
