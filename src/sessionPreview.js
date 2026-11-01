import {dayContext} from './program/nutrition.js';
import {sessionExercise} from './training.js';
// Immutable UI snapshots only: preload today's calendar and exercise configuration.
const snapshots=new WeakMap();
export function sessionPreview(state,date){
  let dates=snapshots.get(state);if(!dates){dates=new Map();snapshots.set(state,dates);}
  if(!dates.has(date)){const context=dayContext(state,date);dates.set(date,{context,exercises:context.exercises.map(ex=>sessionExercise(state,ex,date))});}
  return dates.get(date);
}
