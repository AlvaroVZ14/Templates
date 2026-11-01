import {weekDates} from './domain.js';
import {dayContext} from './program/nutrition.js';
import {sessionExercise} from './training.js';
export function weeklySessions(state,date){
  const rows=weekDates(date).map(day=>{
    const exercises=dayContext(state,day).exercises.map(ex=>sessionExercise(state,ex,day));
    const effective=state.logs.filter(log=>log.date===day&&log.kind==='effective');
    return {date:day,planned:exercises.length>0,done:exercises.length>0&&effective.length>0&&Boolean(state.sessionMeta?.[day]?.endedAt||exercises.every(ex=>effective.filter(row=>row.exerciseId===ex.id).length>=ex.sets))};
  });
  return {planned:rows.filter(row=>row.planned).length,done:rows.filter(row=>row.done).length};
}
