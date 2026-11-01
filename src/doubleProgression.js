import {effectiveSetPlan,effectiveSetSuggestion} from './routinePlan.js';

const matching=(row,ex)=>row.exerciseId===ex.id&&(!row.equipment||row.equipment===ex.equipment);
export function progressionSuggestion(state,ex,date){
  const saved=(state.progressionDecisions??[]).findLast(row=>row.date===date&&matching(row,ex)&&row.type==='used');
  if(saved&&!ex.deload&&saved.prescriptions.length===ex.sets&&saved.prescriptions.every((row,index)=>{const plan=effectiveSetPlan(ex,index);return row.role===plan.role&&row.repMin===plan.repMin&&row.repMax===plan.repMax;}))return saved;
  const previous=state.logs.filter(row=>row.date<date&&row.kind==='effective'&&matching(row,ex)).sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt??'').localeCompare(b.createdAt??''));
  const sourceDate=previous.at(-1)?.date,sets=previous.filter(row=>row.date===sourceDate);
  const feedback=(state.exerciseFeedback??[]).findLast(row=>row.date===sourceDate&&matching(row,ex));
  const priorDate=previous.filter(row=>row.date<sourceDate).at(-1)?.date;
  const priorFeedback=(state.exerciseFeedback??[]).findLast(row=>row.date===priorDate&&matching(row,ex));
  const complete=sets.length===ex.sets&&sets.every((row,index)=>!row.deload&&row.reps>=effectiveSetPlan(ex,index).repMax&&(!row.setRole||row.setRole===effectiveSetPlan(ex,index).role));
  const effort=feedback?.cleanRir===true&&sets.every(row=>feedback.sourceSetIds.includes(row.id)&&(!feedback.sourceSets||feedback.sourceSets.some(source=>source.id===row.id&&source.weight===row.weight&&source.reps===row.reps)));
  const weak=feedback?.feeling==='weak',twice=weak&&priorFeedback?.feeling==='weak';
  const step=ex.equipment==='cable'?(state.profiles?.[ex.profileId]?.progressionPlateKg??ex.increment??5):2.5;
  const limited=sets.some(row=>row.weight+step>1500),increase=complete&&effort&&!weak&&!ex.deload&&!limited;
  let reason=ex.deload?'Descarga: mantener, sin buscar progresión.':weak?'Sensación flojo: mantener la carga.':increase?'Todas las efectivas al tope, con técnica limpia y 0–2 RIR: subir carga y volver al inicio del rango.':!sets.length?'Sin sesión anterior comparable: elige una carga controlable.':!effort?'Mantener e intentar +1 rep; falta confirmar técnica limpia y 0–2 RIR en todas las series.':'Mantener e intentar +1 rep hasta completar todos los rangos.';
  if(twice)reason+=' Dos sesiones seguidas flojo: revisa sueño y comida.';
  if(limited)reason+=' Se mantiene el límite de registro de 1500 kg.';
  const prescriptions=Array.from({length:ex.sets},(_,index)=>{
    const plan=effectiveSetPlan(ex,index),prior=sets[index];
    const compatible=prior&&(!prior.setRole||prior.setRole===plan.role);
    const base=compatible?prior.weight:effectiveSetSuggestion(ex,state.profiles?.[ex.profileId]?.workWeight??null,index).weight;
    return {...plan,weight:base==null?null:Number((base+(increase&&plan.role!=='backoff'?step:0)).toFixed(2)),reps:increase?plan.repMin:compatible?Math.min(plan.repMax,Math.max(plan.repMin,prior.reps+(weak||ex.deload?0:1))):plan.repMin};
  });
  if(prescriptions[0]?.weight!=null)for(const row of prescriptions)if(row.role==='backoff')row.weight=rounded(prescriptions[0].weight*(1-(ex.backoffPercent??10)/100),ex.increment??2.5);
  return {version:1,exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,exerciseName:ex.name,date,sourceDate:sourceDate??null,sourceSetIds:sets.map(row=>row.id),action:increase?'increase':'maintain',reason,step,prescriptions};
}
function rounded(weight,increment){return Number((Math.round(weight/increment)*increment).toFixed(2));}
export function progressionSet(state,ex,date,index,logs=[]){
  const result={...progressionSuggestion(state,ex,date).prescriptions[index]};
  const top=logs.find(row=>row.kind==='effective'&&row.setRole==='top')??logs.find(row=>row.kind==='effective');
  if(result.role==='backoff'&&top)result.weight=rounded(top.weight*(1-(ex.backoffPercent??10)/100),ex.increment??2.5);
  return result;
}
export function saveExerciseFeedback(state,ex,date,feeling,cleanRir){
  if(!['strong','normal','weak'].includes(feeling)||typeof cleanRir!=='boolean')throw new Error('Sensación no válida.');
  const sets=state.logs.filter(row=>row.date===date&&row.kind==='effective'&&matching(row,ex));
  if(sets.length!==ex.sets)throw new Error('Completa las series antes de registrar la sensación.');
  const feedback={id:crypto.randomUUID(),version:1,date,exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,exerciseName:ex.name,feeling,cleanRir,sourceSetIds:sets.map(row=>row.id),sourceSets:sets.map(row=>({id:row.id,weight:row.weight,reps:row.reps})),createdAt:new Date().toISOString()};
  const next={...state,exerciseFeedback:[...(state.exerciseFeedback??[]),feedback]};
  // Evaluate as a future session without overwriting the current prescription.
  const tomorrow=new Date(`${date}T12:00:00Z`);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  const suggestion=progressionSuggestion(next,ex,tomorrow.toISOString().slice(0,10));
  return {...next,progressionDecisions:[...(state.progressionDecisions??[]),{...suggestion,id:crypto.randomUUID(),date,type:'next',createdAt:feedback.createdAt,feeling,cleanRir}]};
}
