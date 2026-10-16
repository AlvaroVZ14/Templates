import {sessionName} from './calendarText.js';
export const SERIES_TYPES={warmup:'Previa · calentamiento',approach:'Previa · aproximación',effective:'Efectiva',drop:'Caída de drop set',rp:'Mini-serie de rest-pause',forced:'Forzada',negative:'Negativa'};
const clone=value=>structuredClone(value);
const weekday=date=>(new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7;
const phaseAt=(state,date)=>(state.phases??[]).filter(phase=>!phase.cancelled&&phase.startDate<=date&&(!phase.actualEnd||phase.actualEnd>=date)).sort((a,b)=>a.startDate.localeCompare(b.startDate)).at(-1)??null;
export const exerciseKey=ex=>`${ex.profileId??ex.exerciseId??ex.id}::${ex.equipment??'unknown'}`;
export function projectCollections(state,previous=[]){
  const old=new Map(previous.map(row=>[row.date,row])),groups=new Map();
  (state.logs??[]).forEach((log,order)=>{const date=log.date??'sin-fecha';if(!groups.has(date))groups.set(date,[]);groups.get(date).push({log,order});});
  const dates=[...new Set([...groups.keys(),...Object.keys(state.sessionMeta??{}),...old.keys()])].sort();
  const sessions=dates.map(date=>{
    const prior=old.get(date),meta=state.sessionMeta?.[date]??{},day=state.calendar?.[date]?.routineDay??weekday(date),phase=phaseAt(state,date),exercises=[];
    for(const {log,order} of groups.get(date)??[]){
      const key=exerciseKey(log),instance=`${log.exerciseId??key}::${key}`;
      let ex=exercises.find(ex=>ex.instance===instance);
      if(!ex){const existing=prior?.exercises.find(ex=>ex.instance===instance),routine=state.routine?.flat().find(ex=>ex.id===log.exerciseId);ex={instance,key,id:log.exerciseId??key,profileId:log.profileId??log.exerciseId,name:existing?.name??log.exerciseName??routine?.name??'Ejercicio sin nombre',equipment:log.equipment??null,muscle:log.muscle??null,notes:existing?.notes??log.exerciseNotes??null,sets:[]};exercises.push(ex);}
      ex.sets.push({id:log.id??`legacy-${date}-${order}`,type:['warmup','approach'].includes(log.kind)?'preparation':log.kind,preparationKind:['warmup','approach'].includes(log.kind)?log.kind:null,weight:log.weight,reps:log.reps,rpe:log.rpe??null,failure:log.failure??null,restRealSeconds:log.restRealSeconds??null,order,source:clone(log)});
    }
    const value=(key,fallback)=>Object.hasOwn(meta,key)?meta[key]:fallback;
    return {id:prior?.id??`session-${date}`,date,month:date.slice(0,7),year:date.slice(0,4),routineDay:prior?.routineDay??day,routineTitle:prior?.routineTitle??sessionName(exercises.length?exercises:state.routine?.[day]??[])??'Día sin dato',phase:prior?prior.phase:clone(phase),durationSeconds:value('durationSeconds',prior?.durationSeconds??null),notes:value('notes',prior?.notes??''),startedAt:value('startedAt',prior?.startedAt??null),endedAt:value('endedAt',prior?.endedAt??null),exerciseKeys:[...new Set(exercises.map(ex=>ex.key))],exercises};
  });
  const dated=(data,id,date,order)=>({id,date,month:date?.slice(0,7)??'sin-fecha',order,data:clone(data)});
  return {sessions,
    cardio:(state.cardio??[]).map((item,i)=>dated(item,item.id??`cardio-${i}`,item.date,i)),
    journal:Object.entries(state.journal??{}).map(([date,item],i)=>dated(item,date,date,i)),
    measurements:(state.measurements??[]).map((item,i)=>dated(item,item.id??`measure-${i}`,item.date,i)),
    phases:[...(state.phases??[]).map((item,i)=>({...dated(item,`phase:${item.id??i}`,item.startDate,i),kind:'phase'})),...(state.phaseHistory??[]).map((item,i)=>({...dated(item,`history:${i}:${item.id}`,item.startDate,i),kind:'history'})),...(state.goalRevisions??[]).map((item,i)=>({...dated(item,`goal:${item.id??i}`,item.effectiveDate,i),kind:'goal'}))],
  };
}
export function hydrateCollections(cache,rows){
  if(!cache)return cache;
  const source=name=>[...rows[name]].sort((a,b)=>a.order-b.order).map(item=>clone(item.data));
  const phases=kind=>rows.phases.filter(item=>item.kind===kind).sort((a,b)=>a.order-b.order).map(item=>clone(item.data));
  const logs=rows.sessions.flatMap(session=>session.exercises.flatMap(ex=>ex.sets)).sort((a,b)=>a.order-b.order).map(set=>clone(set.source));
  return {...cache,logs,cardio:source('cardio'),journal:Object.fromEntries(rows.journal.map(item=>[item.date,clone(item.data)])),measurements:source('measurements'),phases:phases('phase'),phaseHistory:phases('history'),goalRevisions:phases('goal'),sessions:rows.sessions};
}
export function preservationCounts(state){return {series:state.logs?.length??0,sessions:new Set((state.logs??[]).map(log=>log.date)).size,cardio:state.cardio?.length??0,journal:Object.keys(state.journal??{}).length,measurements:state.measurements?.length??0,phases:state.phases?.length??0,phaseHistory:state.phaseHistory?.length??0};}
export function verifyProjection(state,rows){
  for(const [name,items] of Object.entries(rows))if(new Set(items.map(item=>item.id)).size!==items.length)throw new Error(`Claves duplicadas en ${name}; se conserva la base anterior.`);
  const restored=hydrateCollections(state,rows);
  for(const key of ['logs','cardio','journal','measurements','phases','phaseHistory','goalRevisions'])if(state[key]!==undefined&&JSON.stringify(state[key])!==JSON.stringify(restored[key]))throw new Error(`La migración no conservó ${key}.`);
  return true;
}
export function historySummary(sessions){const dates=sessions.map(item=>item.date).sort();return {count:sessions.length,first:dates[0]??null,last:dates.at(-1)??null,series:sessions.reduce((sum,item)=>sum+item.exercises.reduce((n,ex)=>n+ex.sets.length,0),0)};}
export function previousSession(sessions,current){return sessions.filter(item=>item.date<current.date&&item.routineDay===current.routineDay).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)??null;}
export function comparison(current,previous){
  return current.exercises.map(ex=>{const prior=previous?.exercises.find(item=>item.key===ex.key),best=sets=>sets.filter(set=>set.type==='effective').sort((a,b)=>b.weight-a.weight||b.reps-a.reps)[0]??null,now=best(ex.sets),before=best(prior?.sets??[]);return {key:ex.instance,name:ex.name,now,before,weightChange:now&&before?now.weight-before.weight:null,repsChange:now&&before?now.reps-before.reps:null};});
}
export function monthsBefore(date,months){const value=new Date(`${date}T12:00:00Z`),day=value.getUTCDate();value.setUTCDate(1);value.setUTCMonth(value.getUTCMonth()-months);const end=new Date(Date.UTC(value.getUTCFullYear(),value.getUTCMonth()+1,0)).getUTCDate();value.setUTCDate(Math.min(day,end));return value.toISOString().slice(0,10);}
export function exerciseEvolution(sessions,key,range,asOf){
  const from=range==='all'?null:monthsBefore(asOf,Number(range));
  return sessions.filter(item=>item.date<=asOf&&(!from||item.date>=from)).sort((a,b)=>a.date.localeCompare(b.date)).flatMap(item=>{const sets=item.exercises.filter(ex=>ex.key===key).flatMap(ex=>ex.sets).filter(set=>set.type==='effective');if(!sets.length)return [];const best=sets.sort((a,b)=>b.weight-a.weight||b.reps-a.reps)[0];return [{date:item.date,...best}];});
}
