import {dayContext} from './program/nutrition.js';
import {phaseForDate} from './program/phases.js';
import {sessionExercise,activeDeload} from './training.js';
const shift=(date,n)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const days=(a,b)=>Math.round((Date.parse(`${b}T12:00Z`)-Date.parse(`${a}T12:00Z`))/86400000);
const mean=list=>list.length?list.reduce((a,b)=>a+b,0)/list.length:null;
const numeric=value=>typeof value==='number'&&Number.isFinite(value);
const plain=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const mainExercise=log=>!plain(log.exerciseName).includes('gemel')&&/press banca|press inclinado|jalon|remo|press militar|hack squat|prensa/.test(plain(log.exerciseName));
const key=log=>`${log.profileId??plain(log.exerciseName)}:${log.equipment??'unknown'}`;
const trainingRows=state=>(state.logs??[]).map(log=>log.exerciseName?log:{...log,exerciseName:state.routine?.flat().find(ex=>ex.id===log.exerciseId||ex.profileId===log.profileId)?.name});
function observedWeeks(dates,date){const past=[...new Set(dates.filter(day=>day<=date))].sort();return past.length?Math.min(4,Math.floor((days(past[0],date)+1)/7),new Set(past.map(day=>Math.floor(days(day,date)/7))).size):0;}
function insufficient(weeks,reason){const remaining=Math.max(1,4-weeks);return {status:'insufficient',value:null,text:`Datos insuficientes, vuelve en ${remaining} ${remaining===1?'semana':'semanas'}.`,action:reason};}
function loads(state,start,end){
 const best=new Map();for(const log of trainingRows(state)){if(log.date<start||log.date>end||log.kind!=='effective'||log.deload||!mainExercise(log)||!numeric(log.weight)||!numeric(log.reps)||log.weight<=0||log.reps<=0)continue;const id=`${key(log)}:${log.date}`,score=log.weight*log.reps,old=best.get(id);if(!old||score>old.score)best.set(id,{key:key(log),score,name:log.exerciseName});}
 const groups=new Map();for(const row of best.values()){if(!groups.has(row.key))groups.set(row.key,{name:row.name,values:[]});groups.get(row.key).values.push(row.score);}return new Map([...groups].map(([id,row])=>[id,{name:row.name,average:mean(row.values),sessions:row.values.length}]));
}
export function performance(state,date){
 const dates=trainingRows(state).filter(log=>log.kind==='effective'&&!log.deload&&mainExercise(log)).map(log=>log.date),weeks=observedWeeks(dates,date);
 if(weeks<4)return insufficient(weeks,'Registra tus efectivas principales; un estancamiento de 1–3 semanas no se evalúa como rojo.');
 const current=loads(state,shift(date,-27),date),previous=loads(state,shift(date,-55),shift(date,-28)),older=loads(state,shift(date,-83),shift(date,-56));
 const rows=[...current].filter(([id,row])=>previous.has(id)&&row.sessions>=2&&previous.get(id).sessions>=2).map(([id,row])=>({id,name:row.name,change:(row.average/previous.get(id).average-1)*100,previousChange:older.get(id)?.sessions>=2?(previous.get(id).average/older.get(id).average-1)*100:null}));
 if(!rows.length)return {...insufficient(4,'Falta un bloque anterior comparable de 4 semanas, con al menos dos sesiones del mismo ejercicio y equipo por bloque.'),text:'Datos insuficientes: completa las 4 semanas de comparación anteriores.'};
 const value=mean(rows.map(row=>row.change)),previousChange=rows.every(row=>row.previousChange!==null)?mean(rows.map(row=>row.previousChange)):null;
 const status=value>=1-1e-8?'green':value< -2-1e-8&&previousChange!==null&&previousChange< -2-1e-8?'red':'amber';
 return {status,value,previousChange,rows,text:status==='green'?'Tu rendimiento va subiendo.':status==='red'?'Hay dos periodos seguidos con una bajada superior al 2%.':'Tu rendimiento pide continuidad, sin prisas.',action:status==='red'?'Revisa descanso y ejecución antes de cambiar el plan.':'Mantén el registro y sigue tu progresión; no ajustes por una mala semana.'};
}
function body(state,date,strength){
 const phase=phaseForDate(state,date),entries=Object.entries(state.journal??{}).filter(([day,row])=>day<=date&&day>=(phase?.startDate??'0000')&&numeric(row.weight)&&row.weight>0),weeks=observedWeeks(entries.map(([day])=>day),date);
 if(weeks<4)return insufficient(weeks,'Registra el peso y tus medidas quincenales dentro de la fase actual.');
 const weights=(a,b)=>entries.filter(([day])=>day>=a&&day<=b).map(([,row])=>row.weight),now=weights(shift(date,-6),date),before=weights(shift(date,-13),shift(date,-7));
 if(now.length<4||before.length<4)return {...insufficient(4,'Se necesitan al menos cuatro pesos en cada una de las dos últimas semanas.'),text:'Datos insuficientes en los promedios de 7 días.'};
 const value=mean(now)-mean(before),details={phase:phase?.kind,average:mean(now),count:now.length,previousCount:before.length};
 if(phase?.kind==='cut'){
  if(strength.status==='insufficient')return {...insufficient(4,'Faltan efectivas comparables para comprobar que mantienes la fuerza.'),...details,weekly:value};
  const good=value>=-.7-1e-8&&value<=-.5+1e-8&&strength.value>=-1;
  return {status:good?'green':'amber',value,...details,text:good?'El peso baja al ritmo previsto y la fuerza se mantiene.':'La tendencia aún no reúne las dos condiciones del mini cut.',action:'Sigue registrando; revisa la tendencia mensual antes de ajustar.'};
 }
 if(phase?.kind!=='bulk')return {status:'amber',value,...details,text:'Mantención: observa la tendencia sin perseguir un rango de volumen o mini cut.',action:'Mantén tu plan y reúne registros comparables.'};
 const measures=(state.measurements??[]).filter(row=>row.date<=date&&row.date>=phase.startDate).sort((a,b)=>a.date.localeCompare(b.date)),last=measures.at(-1),previous=measures.at(-2),waist=measures.filter(row=>numeric(row.values.waist)),lastWaist=waist.at(-1),baseline=waist.filter(row=>lastWaist&&days(row.date,lastWaist.date)>=21&&days(row.date,lastWaist.date)<=40).at(-1);
 const recent=last&&days(last.date,date)<=21&&previous&&days(previous.date,last.date)>=10&&days(previous.date,last.date)<=21;
 const others=['biceps','forearm','chest','thigh','calf'],complete=recent&&others.every(name=>numeric(last.values[name])&&numeric(previous.values[name]));
 if(!complete||!baseline||days(lastWaist.date,date)>21)return {...insufficient(4,'Faltan medidas quincenales completas y una comparación de cintura de 21–40 días.'),...details,weekly:value,text:'Datos insuficientes para comparar las medidas y la cintura.'};
 const waistRate=(lastWaist.values.waist-baseline.values.waist)*30/days(baseline.date,lastWaist.date),stable=others.every(name=>last.values[name]>=previous.values[name]),good=value>=.25-1e-8&&value<=.5+1e-8&&waistRate<=1+1e-8&&stable;
 return {status:waistRate>1+1e-8?'red':good?'green':'amber',value,waistRate,...details,text:waistRate>1+1e-8?'La cintura supera el ritmo de 1 cm por mes.':good?'Peso, cintura y medidas avanzan dentro de tus reglas.':'La tendencia de volumen aún no reúne todas las condiciones.',action:waistRate>1+1e-8?'Revisa la tendencia en tu revisión mensual antes de ajustar.':'Mantén condiciones de medición consistentes y observa el siguiente control.'};
}
function consistency(state,date){
 const dates=[...(state.logs??[]).map(log=>log.date),...Object.keys(state.journal??{})],weeks=observedWeeks(dates,date);if(weeks<4)return insufficient(weeks,'Reúne cuatro semanas de entrenamiento y diario; los días sin datos no se inventan.');
 let planned=0,completed=0;for(let i=27;i>=0;i--){const day=shift(date,-i),exercises=dayContext(state,day).exercises.map(ex=>sessionExercise(state,ex,day));if(!exercises.length)continue;planned++;const logs=(state.logs??[]).filter(log=>log.date===day&&log.kind==='effective');if(logs.length&&(state.sessionMeta?.[day]?.endedAt||exercises.every(ex=>logs.filter(log=>log.exerciseId===ex.id).length>=ex.sets)))completed++;}
 const sleep=Object.entries(state.journal??{}).filter(([day,row])=>day>=shift(date,-27)&&day<=date&&numeric(row.sleepHours)).map(([,row])=>row.sleepHours),sleepAverage=mean(sleep);
 const last=(state.deloads??[]).filter(row=>(row.actualEnd??row.endDate)<=date).sort((a,b)=>(a.actualEnd??a.endDate).localeCompare(b.actualEnd??b.endDate)).at(-1),start=last?(last.actualEnd??last.endDate):[state.trainingStarted,...dates.filter(day=>day<=date)].filter(Boolean).sort()[0],deloadWeeks=activeDeload(state,date)?0:start?Math.floor(days(start,date)/7):null,value=planned?completed/planned*100:null;
 if(value===null||sleep.length<14)return {...insufficient(4,'Completa al menos 14 registros de sueño en 28 días y un plan de sesiones.'),completion:value,sleepAverage,sleepCount:sleep.length,deloadWeeks};
 const good=value>=85&&sleepAverage>=7&&deloadWeeks!==null&&deloadWeeks<6;
 return {status:good?'green':'amber',value,planned,completed,sleepAverage,sleepCount:sleep.length,deloadWeeks,text:good?'La constancia y el descanso acompañan tu entrenamiento.':'Hay margen para cuidar la constancia o la recuperación.',action:deloadWeeks>=6?'Revisa la recomendación de descarga; el contador no la activa solo.':'Prioriza sesiones sostenibles y tu horario de sueño.'};
}
export function progressReport(state,date){const strength=performance(state,date);return {asOf:date,performance:strength,body:body(state,date,strength),consistency:consistency(state,date)};}
export function captureMonthlyReviews(state,today){
 const first=[state.trainingStarted,...(state.logs??[]).map(row=>row.date),...Object.keys(state.journal??{})].filter(day=>day&&day<=today).sort()[0];if(!first)return state;
 const reviews=[...(state.monthlyReviews??[])];let boundary=`${first.slice(0,7)}-01`;boundary=nextMonth(boundary);
 while(boundary<=today){const month=shift(boundary,-1).slice(0,7);if(!reviews.some(row=>row.month===month)){const report=progressReport(state,shift(boundary,-1)),previous=reviews.find(row=>row.month===shift(`${month}-01`,-1).slice(0,7)),changes=Object.fromEntries(['performance','body','consistency'].map(key=>[key,numeric(report[key].value)&&numeric(previous?.report[key].value)?report[key].value-previous.report[key].value:null]));reviews.push({id:`monthly-${month}`,month,date:boundary,capturedOn:today,report,changes});}boundary=nextMonth(boundary);}
 return reviews.length===(state.monthlyReviews??[]).length?state:{...state,monthlyReviews:reviews};
}
function nextMonth(date){const d=new Date(`${date}T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()+1);return d.toISOString().slice(0,10);}
