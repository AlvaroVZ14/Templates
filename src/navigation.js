import {weekDates} from './domain.js';
import {dayContext} from './program/nutrition.js';
import {sessionExercise} from './training.js';

export function sessionNeighbors(data,date){
  const dates=weekDates(date).filter(value=>dayContext(data,value).exercises.length);
  return {previous:dates.filter(value=>value<date).at(-1)??null,next:dates.find(value=>value>date)??null};
}
export function shiftWeek(date){const value=new Date(`${date}T12:00:00Z`);value.setUTCDate(value.getUTCDate()-7);return value.toISOString().slice(0,10);}
export function swipeDirection(start,end){
  const dx=end.x-start.x,dy=end.y-start.y;
  if(end.time-start.time>900||Math.abs(dx)<65||Math.abs(dx)<Math.abs(dy)*1.6)return null;
  return dx>0?'right':'left';
}
export function incompleteSession(data,date,drafts){
  if(Object.entries(drafts).some(([key,draft])=>key!=='weights:setup'&&draft.date===date))return true;
  const meta=data.sessionMeta?.[date];if(meta?.endedAt)return false;if(meta?.startedAt)return true;
  const exercises=dayContext(data,date).exercises.map(ex=>sessionExercise(data,ex,date));
  const logs=data.logs.filter(log=>log.date===date);
  return logs.length>0&&exercises.some(ex=>logs.filter(log=>log.exerciseId===ex.id&&log.kind==='effective').length<ex.sets);
}
