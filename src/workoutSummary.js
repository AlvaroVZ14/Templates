import {gymSummary} from './gym.js';
const working=new Set(['effective','drop','rp','forced','negative']);
export function workoutSummary(data,date){
 const logs=data.logs.filter(row=>row.date===date),base=gymSummary(data,date,data.sessionMeta?.[date]?.endedAt??new Date().toISOString());
 const measured=logs.filter(row=>working.has(row.kind)&&Number.isFinite(row.restRealSeconds)&&row.restRealSeconds>=0);
 return {...base,volumeKg:logs.filter(row=>working.has(row.kind)&&Number.isFinite(row.weight)&&Number.isFinite(row.reps)).reduce((sum,row)=>sum+row.weight*row.reps,0),averageRestSeconds:measured.length?Math.round(measured.reduce((sum,row)=>sum+row.restRealSeconds,0)/measured.length):null,measuredRests:measured.length,loadImprovements:base.records.filter(row=>row.weight!=null)};
}
