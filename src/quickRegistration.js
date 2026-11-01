import {recordSet,roundWeight,localDate} from './domain.js';
import {progressionSet,progressionSuggestion} from './doubleProgression.js';
import {startGymSession,openGymSession,finishGymSession,gymSummary} from './gym.js';

export function previousEffectiveSession(state,ex,date){
  const rows=state.logs.filter(log=>log.kind==='effective'&&log.date<date&&(log.profileId??log.exerciseId)===ex.profileId&&(!log.equipment||log.equipment===ex.equipment));
  const lastDate=rows.map(row=>row.date).sort().at(-1);
  return rows.filter(row=>row.date===lastDate).sort((a,b)=>(a.createdAt??'').localeCompare(b.createdAt??''));
}
export function quickSetValues(state,ex,date,index,logs=[]){
  const prior=previousEffectiveSession(state,ex,date)[index];
  return {...progressionSet(state,ex,date,index,logs),prior:prior??null};
}
export function quickRestSeconds(ex){return Math.max(1,Math.min(900,ex.rests?.effective??(ex.compound?150:105)));}
export function dropWeight(ex,weight,index=0){return weight==null?null:roundWeight(weight*Math.pow(.7,index+1),ex.increment??1);}
function measuredRest(state,date,now){
  const timer=state.quickRest??state.timer;
  if(!timer?.sourceLogId||timer.date!==date||!Number.isFinite(timer.startedAt))return state.logs;
  const seconds=Math.max(0,Math.min(86400,Math.round((now-timer.startedAt)/1000)));
  return state.logs.map(log=>log.id===timer.sourceLogId?{...log,restRealSeconds:seconds,restMeasurement:'between-confirmations'}:log);
}
export function confirmQuickSet(state,ex,date,index,values,now=Date.now()){
  const today=localDate(new Date(now)),meta=state.sessionMeta?.[date];
  if(meta?.endedAt)throw new Error('Esta sesión ya está terminada.');
  const effective=state.logs.filter(row=>row.date===date&&row.exerciseId===ex.id&&row.kind==='effective');
  if(index!==effective.length)throw new Error('Confirma las series en orden.');
  if(values.weight==null||values.weight===''||values.reps==null||values.reps==='')throw new Error('Elige el peso y las repeticiones.');
  const suggestion=progressionSuggestion(state,ex,date);
  let next={...state,logs:measuredRest(state,date,now)};
  if(!(next.progressionDecisions??[]).some(row=>row.date===date&&row.exerciseId===ex.id&&row.type==='used'))next={...next,progressionDecisions:[...(next.progressionDecisions??[]),{...suggestion,id:crypto.randomUUID(),type:'used',createdAt:new Date(now).toISOString()}]};
  if(date===today&&!openGymSession(next))next=startGymSession(next,date,new Date(now).toISOString());
  if(!next.sessionMeta?.[date]?.startedAt)next={...next,sessionMeta:{...next.sessionMeta,[date]:{...meta,startedAt:new Date(now).toISOString()}}};
  const parentId=crypto.randomUUID(),common={exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,exerciseName:ex.name,muscle:ex.muscle,date,rpe:null,failure:null,createdAt:new Date(now).toISOString(),restRealSeconds:null};
  next=recordSet(next,ex,{...common,id:parentId,kind:'effective',progressionDecisionId:next.progressionDecisions.findLast(row=>row.date===date&&row.exerciseId===ex.id&&row.type==='used')?.id,weight:Number(values.weight),reps:Number(values.reps)});
  if(values.technique){
    const kind=values.technique;
    if(ex.deload||index!==ex.sets-1||kind!==ex.technique||!['drop','rp'].includes(kind))throw new Error('La técnica corresponde solo a la última efectiva, fuera de descarga.');
    const count=kind==='drop'?(ex.dropCount??1):(ex.rpCount??2);
    if(!Array.isArray(values.extensions)||values.extensions.length!==count)throw new Error('Completa la técnica antes de confirmar.');
    for(const [step,extension] of values.extensions.entries()){
      if(extension.weight==null||extension.weight===''||extension.reps==null||extension.reps==='')throw new Error('Completa peso y reps de la técnica.');
      next=recordSet(next,ex,{...common,id:crypto.randomUUID(),kind,parentId,step:step+1,weight:Number(extension.weight),reps:Number(extension.reps)});
    }
  }
  const seconds=quickRestSeconds(ex);
  return {...next,gymSession:next.gymSession?.date===date?{...next.gymSession,currentExerciseId:ex.id}:next.gymSession,quickRest:{startedAt:now,sourceLogId:parentId,date},timer:{end:now+seconds*1000,duration:seconds,startedAt:now,sourceLogId:parentId,date,label:ex.name}};
}
export function finishQuickSession(state,date,now=Date.now()){
  if(openGymSession(state)?.date===date)return {...finishGymSession(state,new Date(now).toISOString()),quickRest:state.quickRest?.date===date?null:state.quickRest};
  const summary=gymSummary(state,date,new Date(now).toISOString());
  return {...state,quickRest:state.quickRest?.date===date?null:state.quickRest,timer:state.timer?.date===date?null:state.timer,sessionMeta:{...state.sessionMeta,[date]:{...state.sessionMeta?.[date],endedAt:new Date(now).toISOString(),durationSeconds:summary.durationSeconds,gymSummary:summary}}};
}
