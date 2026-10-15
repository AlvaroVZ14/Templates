import { shiftDate } from './wellness.js';
import { chileDate } from './program/state.js';
import { contextualPreparation } from './preparation.js';
import { dayContext } from './program/nutrition.js';

const extensions=['drop','rp','forced','negative'];
const days=(a,b)=>Math.round((Date.parse(`${b}T12:00:00Z`)-Date.parse(`${a}T12:00:00Z`))/86400000);
export function migrateTraining(state,date=chileDate()) {
  if(state.schemaVersion>=6)return state;
  return {...state,schemaVersion:6,trainingStarted:date,deloads:[],progressionEvents:[],techniqueTrials:[],profiles:Object.fromEntries(Object.entries(state.profiles).map(([id,p])=>[id,{...p,repMin:p.repMin??Math.min(p.targetReps??8,12),repMax:p.repMax??Math.max(p.targetReps??8,12)}]))};
}
export function activeDeload(state,date){return (state.deloads??[]).find(item=>item.startDate<=date&&date<=(item.actualEnd??item.endDate))??null;}
export function sessionExercise(state,exercise,date){
  const base=state.routine.flat().find(item=>item.id===exercise.id)??exercise;
  const trial=(state.techniqueTrials??[]).find(item=>item.date===date&&item.exerciseId===base.id);
  const deload=activeDeload(state,date);
  const session=dayContext(state,date).exercises;
  const list=session.some(item=>item.id===base.id)?session:state.routine.find(list=>list.some(item=>item.id===base.id))??[base];
  return {...base,...contextualPreparation(base,list,state.preparationSettings?.minimum??0),normalSets:base.sets,sets:deload?Math.ceil(base.sets/2):base.sets,technique:deload?'':trial?.kind??base.technique,forced:!deload&&base.forced,negative:!deload&&base.negative,deload:!!deload};
}
export function sessions(state,ex,date){
  const grouped=new Map();
  for(const log of state.logs.filter(log=>log.kind==='effective'&&(log.profileId??log.exerciseId)===ex.profileId&&(!log.equipment||log.equipment===ex.equipment)&&log.date<=date&&!log.deload).sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt??'').localeCompare(b.createdAt??''))){
    if(!grouped.has(log.date))grouped.set(log.date,log);
  }
  return [...grouped.values()];
}
export function declining(rows){return rows.length>=3&&rows.slice(-2).every((row,i)=>{const prior=rows[rows.length-3+i];return row.weight<prior.weight||row.reps<prior.reps;});}
export function progression(state,ex,date){
  const rows=sessions(state,ex,date),last=rows.at(-1),profile=state.profiles[ex.profileId]??{},max=profile.repMax??12;
  if(activeDeload(state,date))return {type:'deload',reason:'Descarga activa: mantener carga, sin progresión ni técnicas. Las preparaciones se mantienen.'};
  if(!last)return {type:'data',reason:'Sin series efectivas comparables. Se usa la primera efectiva de cada fecha, del mismo ejercicio y equipo; no cuentan preparaciones, extensiones ni descargas.'};
  if(declining(rows))return {type:'review',reason:'Dos sesiones seguidas con menos repeticiones o carga en la primera efectiva. Mantén la referencia y revisa ejecución, descanso y recuperación antes de subir.'};
  const used=(state.progressionEvents??[]).some(event=>event.sourceId===last.id&&event.type==='weight');
  if(last.failure&&last.reps>=max&&!used&&last.weight>0&&days(last.date,date)<=14){
    const step=ex.increment,low=Math.ceil((last.weight*1.025-1e-8)/step)*step,high=last.weight*1.05;
    if(low<=high+1e-8&&low<=1500)return {type:'increase',sourceId:last.id,weight:Number(low.toFixed(3)),reason:`${last.date}: ${last.weight} kg × ${last.reps} al fallo, tope ${max} alcanzado. Regla: subir 2,5–5% con el incremento de ${step} kg; propuesta +${((low/last.weight-1)*100).toFixed(1)}%.`};
    return {type:'rounding',reason:`Tope ${max} alcanzado al fallo, pero el incremento de ${step} kg no permite subir 2,5–5%. Mantén o ajusta el redondeo en Rutina; no se fuerza un salto mayor.`};
  }
  const window=rows.filter(row=>days(row.date,date)<=28),first=window[0];
  const stalled=window.length>=3&&days(first.date,last.date)>=21&&days(last.date,date)<=7&&!window.some(row=>row.weight>first.weight||row.weight===first.weight&&row.reps>first.reps);
  if(stalled)return {type:'technique',reason:'Al menos tres sesiones registradas cubren 21 días sin superar carga ni repeticiones a igual carga respecto de la primera sesión del período (últimos 28 días). Prueba una sola técnica: drop set o rest-pause; revisa primero recuperación y ejecución.'};
  return {type:'maintain',reason:`Doble progresión: mantén la carga y avanza dentro de ${profile.repMin??8}–${max} reps. Solo se propone subir al llegar al tope al fallo. ${used?'La propuesta de la última efectiva ya fue aplicada.':'Faltan condiciones para otra recomendación; días sin registros no prueban estancamiento.'}`};
}
export function applyProgression(state,ex,date){
  const advice=progression(state,ex,date);if(advice.type!=='increase')throw new Error('La recomendación de carga ya no está disponible.');
  const profile=state.profiles[ex.profileId],previousWeight=profile.workWeight;
  if(previousWeight!==null&&previousWeight!==sessions(state,ex,date).at(-1).weight)throw new Error('La referencia cambió desde la última efectiva. Registra otra sesión antes de aplicar la propuesta.');
  return {...state,profiles:{...state.profiles,[ex.profileId]:{...profile,workWeight:advice.weight,targetReps:profile.repMin??8}},progressionEvents:[...state.progressionEvents,{id:crypto.randomUUID(),type:'weight',date,profileId:ex.profileId,sourceId:advice.sourceId,previousWeight,weight:advice.weight,reason:advice.reason,at:new Date().toISOString()}]};
}
export function introduceTechnique(state,ex,date,kind){
  if(activeDeload(state,date)||!['drop','rp'].includes(kind))throw new Error('Solo drop set o rest-pause, fuera de descarga.');
  if(progression(state,ex,date).type!=='technique')throw new Error('No hay estancamiento confirmado para introducir una técnica.');
  if((state.techniqueTrials??[]).some(item=>item.date===date)||state.logs.some(log=>log.date===date&&log.techniqueIntroduced))throw new Error('Ya introdujiste una técnica en esta sesión. Prueba una a la vez.');
  if(ex.technique||state.logs.some(log=>log.date===date&&log.exerciseId===ex.id&&extensions.includes(log.kind)))throw new Error('Este ejercicio ya tiene una técnica; no se añade otra.');
  return {...state,techniqueTrials:[...state.techniqueTrials,{id:crypto.randomUUID(),date,exerciseId:ex.id,kind,at:new Date().toISOString()}]};
}
export function trainingLogError(state,ex,log){
  const current=sessionExercise(state,ex,log.date),same=state.logs.filter(item=>item.date===log.date&&item.exerciseId===ex.id);
  if(['warmup','approach'].includes(log.kind)){
    const reference=state.profiles[ex.profileId]?.workWeight;
    if(!Number.isFinite(reference))return 'Ingresa tu peso de trabajo para registrar las previas.';
    if(log.failure)return 'Las series previas nunca llegan al fallo.';
    if(log.weight>reference*.8+1e-8)return `Las previas no pueden superar el 80% del peso de trabajo (${Number((reference*.8).toFixed(3))} kg).`;
  }
  if(current.deload){
    if(extensions.includes(log.kind))return 'Descarga: sin técnicas de intensidad.';
    if(log.kind==='effective'&&(log.failure||log.rpe>6))return 'Descarga: lejos del fallo, sin fallo y RPE máximo 6.';
    if(log.kind==='effective'&&same.filter(item=>item.kind==='effective').length>=current.sets)return 'Descarga: ya completaste el 50% de series (redondeado hacia arriba).';
  }
  if(extensions.includes(log.kind)&&same.some(item=>extensions.includes(item.kind)&&item.kind!==log.kind))return 'Una sola técnica por ejercicio y sesión. No mezcles técnicas.';
  const newTechnique=['drop','rp'].includes(log.kind)&&current.technique!==log.kind&&!same.some(item=>item.kind===log.kind);
  if(newTechnique&&(state.techniqueTrials.some(item=>item.date===log.date&&item.exerciseId!==ex.id)||state.logs.some(item=>item.date===log.date&&item.techniqueIntroduced&&item.exerciseId!==ex.id)))return 'Ya introdujiste una técnica nueva en esta sesión. Prueba una a la vez.';
  if(['forced','negative'].includes(log.kind)){
    if(!current[log.kind])return 'Activa esta técnica en el editor del ejercicio.';
    const advanced=new Set(state.logs.filter(item=>item.date===log.date&&['forced','negative'].includes(item.kind)).map(item=>item.exerciseId));
    if(!advanced.has(ex.id)&&advanced.size>=2)return 'Forzadas y negativas: máximo 2 ejercicios por sesión entre ambas técnicas.';
  }
  return null;
}
export function deloadAdvice(state,date){
  const baseline=[state.trainingStarted,...state.logs.filter(log=>log.kind==='effective'&&log.date<=date).map(log=>log.date)].filter(Boolean).sort()[0]??date;
  const last=(state.deloads??[]).filter(item=>(item.actualEnd??item.endDate)<date).sort((a,b)=>(a.actualEnd??a.endDate).localeCompare(b.actualEnd??b.endDate)).at(-1);
  const elapsed=days(last?.actualEnd??last?.endDate??baseline,date);
  const recent=Array.from({length:14},(_,i)=>shiftDate(date,i-13));
  const count=list=>list.filter(day=>state.journal[day]?.fatigue>=8&&typeof state.journal[day]?.sleepHours==='number'&&state.journal[day].sleepHours<7).length;
  const lowRecovery=count(recent.slice(0,7))>=4&&count(recent.slice(7))>=4;
  const falling=state.routine.flat().some(ex=>{const rows=sessions(state,ex,date).filter(row=>days(row.date,date)<=14);return declining(rows);});
  const early=lowRecovery&&falling;
  return {due:elapsed>=42||early,elapsed,early,reason:early?'Dos semanas con al menos 4 días por semana de fatiga ≥8 y sueño <7 h, junto con dos sesiones consecutivas a la baja.':elapsed>=42?`${elapsed} días sin descarga registrada: ventana de 6–8 semanas${elapsed>=56?' ya cumplida':''}.`:'Sugerencia desde 6–8 semanas sin descarga, o antes si coinciden dos semanas de mala recuperación y rendimiento a la baja. Sin datos no se presume fatiga.'};
}
export function startDeload(state,date){
  if(activeDeload(state,date))throw new Error('Ya hay una descarga activa.');
  const endDate=shiftDate(date,6);
  if(state.deloads.some(item=>item.startDate<=endDate&&(item.actualEnd??item.endDate)>=date))throw new Error('Este período se cruza con otra descarga registrada.');
  return {...state,deloads:[...state.deloads,{id:crypto.randomUUID(),startDate:date,endDate,createdAt:new Date().toISOString()}]};
}
export function finishDeload(state,date){const current=activeDeload(state,date);if(!current)throw new Error('No hay descarga activa.');return {...state,deloads:state.deloads.map(item=>item.id===current.id?{...item,actualEnd:date,finishedAt:new Date().toISOString()}:item)};}
function chileInstant(date,time){
  const target=Date.parse(`${date}T${time}:00Z`);let result=target;
  for(let i=0;i<2;i++){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(result)).map(item=>[item.type,item.value]));result+=target-Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);}
  return result;
}
export function muscleRecovery(state,muscle,date,now=new Date()){
  const logs=state.logs.filter(log=>log.muscle===muscle&&log.kind==='effective'&&log.date<date).sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt??'').localeCompare(b.createdAt??'')),last=logs.at(-1);
  const today=state.logs.some(log=>log.muscle===muscle&&log.kind==='effective'&&log.date===date);
  if(!last)return {today,last:null,label:today?'Hoy · esta sesión':'Sin estímulo previo registrado',warning:false};
  const elapsed=days(last.date,date),known=last.performedAt&&chileDate(new Date(last.performedAt))===last.date;
  const at=date===chileDate(now)?now.getTime():chileInstant(date,state.calendar?.[date]?.trainingTime??state.programSettings?.trainingTime??'18:00');
  const hours=known?(at-Date.parse(last.performedAt))/3600000:null;
  return {today,last:last.date,days:elapsed,hours,label:`${today?'Hoy · esta sesión. Anterior: ':''}${elapsed} días${hours!==null?` (${Math.max(0,hours).toFixed(1)} h)`:' · hora no registrada'}`,warning:hours!==null?hours<48:elapsed<2,uncertain:hours===null&&elapsed===2};
}
