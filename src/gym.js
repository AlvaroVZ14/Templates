import {dayContext} from './program/nutrition.js';
import {localDate} from './domain.js';
import {sessionExercise} from './training.js';

export function weightExercises(data){
  const unique=new Map();
  data.routine.forEach((exercises,day)=>exercises.forEach(ex=>{
    if(!unique.has(ex.profileId))unique.set(ex.profileId,{...ex,days:[]});
    unique.get(ex.profileId).days.push(day);
  }));
  return [...unique.values()];
}
export function applyWorkWeights(state,values,now=new Date().toISOString()){
  const profiles={...state.profiles};
  for(const ex of weightExercises(state)){
    const weight=String(values[`weight:${ex.profileId}`]??profiles[ex.profileId]?.workWeight??'').trim();
    const reps=String(values[`reps:${ex.profileId}`]??profiles[ex.profileId]?.targetReps??8).trim();
    if(weight!==''&&(!Number.isFinite(Number(weight))||Number(weight)<0||Number(weight)>1500))throw new Error(`${ex.name}: ingresa de 0 a 1500 kg, o déjalo pendiente.`);
    if(reps===''||!Number.isInteger(Number(reps))||Number(reps)<1||Number(reps)>200)throw new Error(`${ex.name}: las reps objetivo deben ser de 1 a 200.`);
    profiles[ex.profileId]={notes:'',...profiles[ex.profileId],workWeight:weight===''?null:Number(weight),targetReps:Number(reps)};
  }
  return {...state,profiles,weightSetup:{...state.weightSetup,reviewedAt:now}};
}
export function openGymSession(data){
  const session=data?.gymSession;
  return session&&data.sessionMeta?.[session.date]?.startedAt&&!data.sessionMeta[session.date].endedAt?session:null;
}
export function startGymSession(state,date,now=new Date().toISOString()){
  const open=openGymSession(state);if(open)return state;
  if(date!==localDate(new Date(now)))throw new Error('Abre la fecha de hoy para empezar una sesión.');
  const exercises=dayContext(state,date).exercises.map(ex=>sessionExercise(state,ex,date));if(!exercises.length)throw new Error('Este día no tiene ejercicios configurados.');
  const meta=state.sessionMeta?.[date]??{};
  if(meta.endedAt)throw new Error('La sesión de esta fecha ya está terminada.');
  const current=exercises.find(ex=>state.logs.filter(log=>log.date===date&&log.exerciseId===ex.id&&log.kind==='effective').length<ex.sets)??exercises[0];
  return {...state,gymSession:{date,currentExerciseId:current.id},navigationSettings:{...state.navigationSettings,lastSession:date},sessionMeta:{...state.sessionMeta,[date]:{...meta,startedAt:meta.startedAt??now,endedAt:null,durationSeconds:null}}};
}
export function gymSummary(state,date,endedAt=new Date().toISOString()){
  const effective=state.logs.filter(log=>log.date===date&&log.kind==='effective'),records=[];
  const groups=new Map();
  for(const log of effective){const key=`${log.profileId??log.exerciseId}::${log.equipment??''}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(log);}
  for(const logs of groups.values()){
    const ex=logs[0],earlier=state.logs.filter(log=>log.date<date&&log.kind==='effective'&&(log.profileId??log.exerciseId)===(ex.profileId??ex.exerciseId)&&log.equipment===ex.equipment);
    const previousDate=earlier.map(log=>log.date).sort().at(-1);if(!previousDate)continue;
    const previous=earlier.filter(log=>log.date===previousDate),weight=Math.max(...logs.map(log=>log.weight)),reps=Math.max(...logs.map(log=>log.reps)),previousWeight=Math.max(...previous.map(log=>log.weight)),previousReps=Math.max(...previous.map(log=>log.reps));
    if(weight>previousWeight||reps>previousReps)records.push({profileId:ex.profileId??ex.exerciseId,name:ex.exerciseName??'Ejercicio',equipment:ex.equipment??null,previousDate,weight:weight>previousWeight?weight:null,reps:reps>previousReps?reps:null,previousWeight,previousReps});
  }
  const started=Date.parse(state.sessionMeta?.[date]?.startedAt),end=Date.parse(endedAt);
  return {durationSeconds:Number.isFinite(started)&&Number.isFinite(end)?Math.max(0,Math.round((end-started)/1000)):0,effectiveSets:effective.length,records,message:effective.length?'Trabajo guardado. Ahora toca recuperar.':'Sesión cerrada. Tu próximo intento cuenta.'};
}
export function finishGymSession(state,now=new Date().toISOString()){
  const open=openGymSession(state);if(!open)return state;
  const summary=gymSummary(state,open.date,now);
  return {...state,gymSession:null,timer:null,sessionMeta:{...state.sessionMeta,[open.date]:{...state.sessionMeta[open.date],endedAt:now,durationSeconds:summary.durationSeconds,gymSummary:summary}}};
}
