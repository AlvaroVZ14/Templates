import { shiftDate, weightWeek } from '../wellness.js';
import { waistWarning } from '../measurements.js';
import { chileDate } from './state.js';

export function daysBetween(from,to){return Math.round((Date.parse(`${to}T12:00:00Z`)-Date.parse(`${from}T12:00:00Z`))/86400000);}
export function lastWeight(state,date){const day=Object.keys(state.journal).filter(key=>key<=date&&state.journal[key].weight>0).sort().at(-1);return day?{date:day,value:state.journal[day].weight}:null;}
export function lastWaist(state,date){return state.measurements.filter(item=>item.date<=date&&item.values.waist>0).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)?.values.waist??null;}
export function phaseForDate(state,date){return state.phases.filter(item=>!item.cancelled&&item.startDate<=date&&(!item.actualEnd||date<=item.actualEnd)).sort((a,b)=>a.startDate.localeCompare(b.startDate)||state.phases.indexOf(a)-state.phases.indexOf(b)).at(-1)??null;}
export function captureAnchors(state){
  let changed=false;
  const phases=state.phases.map(phase=>{
    if(phase.startWeight!==null||phase.cancelled)return phase;
    const day=Object.keys(state.journal).filter(date=>date>=phase.startDate&&(!phase.actualEnd||date<=phase.actualEnd)&&state.journal[date].weight>0).sort()[0];
    if(!day)return phase; changed=true;
    return {...phase,startWeight:state.journal[day].weight,anchorDate:day,startWaist:lastWaist(state,day)};
  });
  return changed?{...state,phases}:state;
}
export function trend(state,date){
  const rows=weightWeek(state.journal,Array.from({length:14},(_,i)=>shiftDate(date,i-13)));
  const first=rows.slice(0,7).map(row=>row.weight).filter(value=>value!==null),last=rows.slice(7).map(row=>row.weight).filter(value=>value!==null);
  return {enough:first.length>=4&&last.length>=4,firstCount:first.length,lastCount:last.length,weekly:first.length>=4&&last.length>=4?last.reduce((s,v)=>s+v,0)/last.length-first.reduce((s,v)=>s+v,0)/first.length:null,mean:rows.at(-1).average,meanCount:rows.at(-1).count};
}
export function phaseReport(state,date){
  const phase=phaseForDate(state,date);if(!phase)return null;
  const current=lastWeight(state,date),change=trend(state,date),remainingDays=phase.deadline?daysBetween(date,phase.deadline):null;
  const average=change.mean,remaining=average===null||phase.targetWeight===null?null:phase.targetWeight-average;
  const needed=remaining!==null&&remainingDays>0?remaining/(remainingDays/7):null;
  const range=phase.kind==='bulk'?[.25,.5]:phase.kind==='cut'?[-.7,-.5]:[-.1,.1];
  const status=change.weekly===null?'Datos insuficientes':phase.kind==='maintain'?(Math.abs(change.weekly)<=.1?'En ritmo':'Atrasado'):phase.kind==='bulk'?(change.weekly>range[1]?'Adelantado':change.weekly<range[0]?'Atrasado':'En ritmo'):(change.weekly<range[0]?'Adelantado':change.weekly>range[1]?'Atrasado':'En ritmo');
  const incompatible=needed!==null&&phase.kind!=='maintain'&&(needed<range[0]||needed>range[1]);
  return {phase,current,average,averageCount:change.meanCount,weekly:change.weekly,status,remainingDays,remaining,needed,range,incompatible,overdue:remainingDays!==null&&remainingDays<0};
}
export function trajectory(phase,date){
  if(phase.startWeight===null||date<phase.anchorDate)return null;
  if(phase.kind==='maintain')return phase.targetWeight;
  const duration=daysBetween(phase.anchorDate,phase.deadline);if(duration<=0)return null;
  const part=Math.min(1,Math.max(0,daysBetween(phase.anchorDate,date)/duration));
  return phase.startWeight+(phase.targetWeight-phase.startWeight)*part;
}
export function activatePhase(state,config,date,asOf=chileDate()){
  if(date>asOf){
    const phases=state.phases.map(phase=>phase.scheduled&&phase.startDate>=date?{...phase,cancelled:true}:phase);
    return {...state,phases:[...phases,{...config,id:crypto.randomUUID(),startDate:date,anchorDate:date,startWeight:null,startWaist:null,scheduled:true}]};
  }
  const atStart=phaseForDate(state,date),current=atStart?.scheduled&&atStart.startDate===date?phaseForDate(state,shiftDate(date,-1)):atStart;
  const observed=lastWeight(state,date),weight=observed&&(!current||observed.date>=current.startDate)?observed.value:null,waist=lastWaist(state,date);
  const history=[...state.phaseHistory];
  if(current){
    const compliant=Object.entries(state.nutritionDays).filter(([day,value])=>day>=current.startDate&&day<=date&&value.complete).length;
    history.push({...structuredClone(current),closedAt:date,finalWeight:weight,finalWeightDate:weight===null?null:observed.date,finalWaist:waist,completeDays:compliant,calorieChanges:structuredClone(state.goalRevisions.filter(goal=>goal.phaseId===current.id)),fulfillment:weight===null||current.targetWeight===null?null:current.kind==='bulk'?weight>=current.targetWeight:current.kind==='cut'?weight<=current.targetWeight:Math.abs(weight-current.targetWeight)<=.5});
  }
  const phases=state.phases.map(phase=>phase.id===current?.id?{...phase,actualEnd:shiftDate(date,-1)}:phase.scheduled&&phase.startDate>=date?{...phase,cancelled:true}:phase);
  const next={...config,id:crypto.randomUUID(),startDate:date,anchorDate:date,startWeight:weight,startWaist:waist,scheduled:false};
  return {...state,phases:[...phases,next],phaseHistory:history};
}
export function advancePhases(state,date){
  let next=state;
  for(const scheduled of state.phases.filter(phase=>phase.scheduled&&!phase.cancelled&&phase.startDate<=date).sort((a,b)=>a.startDate.localeCompare(b.startDate))){
    const lastDay=shiftDate(scheduled.startDate,-1),previous=phaseForDate(next,lastDay);
    let history=next.phaseHistory;
    if(previous&&!history.some(item=>item.id===previous.id)){
      const weight=lastWeight(next,lastDay)?.value??null;
      history=[...history,{...structuredClone(previous),closedAt:scheduled.startDate,finalWeight:weight,finalWaist:lastWaist(next,lastDay),completeDays:Object.entries(next.nutritionDays).filter(([day,value])=>day>=previous.startDate&&day<=lastDay&&value.complete).length,calorieChanges:structuredClone(next.goalRevisions.filter(goal=>goal.phaseId===previous.id)),fulfillment:weight===null?null:previous.kind==='bulk'?weight>=previous.targetWeight:previous.kind==='cut'?weight<=previous.targetWeight:Math.abs(weight-previous.targetWeight)<=.5}];
    }
    next={...next,phaseHistory:history,phases:next.phases.map(phase=>phase.id===scheduled.id?{...phase,scheduled:false}:phase.id===previous?.id?{...phase,actualEnd:lastDay}:phase)};
  }
  return next;
}
export function trendAdvice(state,date,adherence){
  const report=phaseReport(state,date);if(!report||report.weekly===null)return {ready:false,text:'Faltan al menos 4 pesos por semana durante dos semanas para valorar la tendencia.'};
  if(daysBetween(report.phase.startDate,date)<13||adherence.days<10)return {ready:false,text:'Reúne 2–3 semanas y al menos 10 días completos de alimentación antes de ajustar.'};
  if(adherence.ratio<.8)return {ready:false,text:'Primero revisa el cumplimiento: al menos 80% de los días completos deben estar cerca de sus metas.'};
  const [min,max]=report.range;
  if(report.weekly>=min&&report.weekly<=max)return {ready:true,text:'Tendencia dentro del rango. No se propone cambiar calorías.',delta:0};
  const waist=waistWarning(state.measurements,date);
  let direction=report.weekly>max?-1:1;
  if(report.phase.kind==='maintain')direction=report.weekly>0?-1:1;
  if(direction>0&&waist)return {ready:true,delta:0,text:'La cintura también aumentó más de 1 cm. Revisa esa tendencia antes de considerar subir calorías.'};
  return {ready:true,delta:direction*100,text:`Tendencia fuera del rango durante dos semanas con registros suficientes. Puedes considerar ${direction>0?'sumar':'restar'} 100–200 kcal; revisa cintura y recuperación. Requiere tu confirmación.`};
}
