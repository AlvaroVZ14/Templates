import {confirmQuickSet} from './quickRegistration.js';
import {startGymSession} from './gym.js';
export const SERIES_RECOVERY='olympia-friends-series-queue-v1';
const rowKey=op=>op.kind==='start'?`start:${op.date}`:`${op.date}:${op.exercise.id}:${op.index}`;
export function validSeriesOperation(op){return op&&op.version===1&&typeof op.id==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(op.id)&&/^\d{4}-\d{2}-\d{2}$/.test(op.date)&&Number.isFinite(op.now)&&(op.kind==='start'||op.exercise&&typeof op.exercise.id==='string'&&Number.isInteger(op.index)&&op.index>=0&&op.index<20&&op.values&&typeof op.values==='object');}
export function applySeriesOperation(state,op){if(!validSeriesOperation(op))throw new Error('Operación de serie no válida.');return op.kind==='start'?startGymSession(state,op.date,new Date(op.now).toISOString()):confirmQuickSet(state,op.exercise,op.date,op.index,op.values,op.now,op.id);}
export function mergeSeriesReceipt(state,operation,receipt){
  const next=applySeriesOperation(state,operation),sources=receipt.session.exercises.flatMap(ex=>ex.sets.map(set=>set.source)),byId=new Map(sources.map(row=>[row.id,row]));
  const logs=next.logs.map(row=>byId.get(row.id)??row),ids=new Set(logs.map(row=>row.id));for(const row of sources)if(!ids.has(row.id))logs.push(row);
  return {...next,logs,trainingDrafts:receipt.trainingDrafts,sessions:[...(state.sessions??[]).filter(row=>row.date!==operation.date),receipt.session].sort((a,b)=>a.date.localeCompare(b.date))};
}
export function recoveredSeriesDrafts(state,operations){
  const trainingDrafts={...state.trainingDrafts};
  for(const op of operations){
    if(op.kind==='start')continue;
    const key=`quick:${op.date}:${op.exercise.id}`,prefix=`${op.index}:`,values={...trainingDrafts[key]?.values,[prefix+'weight']:op.values.weight,[prefix+'reps']:op.values.reps,[prefix+'technique']:Boolean(op.values.technique)};
    for(const [index,part] of (op.values.extensions??[]).entries()){values[`${prefix}drop:${index}:weight`]=part.weight;values[`${prefix}extra:${index}:reps`]=part.reps;}
    trainingDrafts[key]={date:op.date,values};
  }
  return {...state,trainingDrafts};
}
// Only small commands are mirrored synchronously, never the complete state or photos.
// IndexedDB remains authoritative; deterministic IDs make interrupted writes replay-safe.
export function createSeriesQueue({persist,onState=()=>{},onError=()=>{},storage=null,schedule=callback=>setTimeout(callback,0)}){
  let base=null,view=null,jobs=[],failed=[],running=false,scheduled=false,waiters=[],journal={pending:[],failed:[]};
  try{const saved=JSON.parse(storage?.getItem(SERIES_RECOVERY)??'null');if(saved?.version===1){journal.pending=(saved.pending??[]).filter(validSeriesOperation);journal.failed=(saved.failed??[]).filter(validSeriesOperation);}}catch{onError('No se pudo leer la recuperación de series. Los datos de IndexedDB siguen intactos.');}
  function write(){try{if(jobs.length||failed.length)storage?.setItem(SERIES_RECOVERY,JSON.stringify({version:1,pending:jobs.map(job=>job.op),failed}));else storage?.removeItem(SERIES_RECOVERY);}catch{onError('No se pudo crear la copia de emergencia. Mantén la app abierta hasta que termine el guardado local.');}}
  function emit(){onState(view);}
  function request(){if(scheduled||running)return;scheduled=true;schedule(()=>{scheduled=false;drain();});}
  async function drain(){
    if(running)return;running=true;let success=true;
    try{
      while(jobs.length){
        const job=jobs[0];
        try{
          base=await persist(job.op);jobs.shift();failed=failed.filter(op=>rowKey(op)!==rowKey(job.op));job.resolve(true);
          view=jobs.reduce((state,item)=>applySeriesOperation(state,item.op),base);write();emit();
        }catch{
          success=false;const cancelled=jobs;jobs=[];
          const existing=new Map(failed.map(op=>[rowKey(op),op]));for(const item of cancelled)existing.set(rowKey(item.op),item.op);failed=[...existing.values()];
          view=recoveredSeriesDrafts(base,failed);base=view;write();emit();
          onError('No se pudo guardar la serie en IndexedDB. Se deshizo la confirmación; conservamos peso y reps para reintentar.');
          for(const item of cancelled)item.resolve(false);
        }
      }
    }finally{running=false;const listeners=waiters;waiters=[];for(const resolve of listeners)resolve(success);}
  }
  function enqueue(op){
    const next=applySeriesOperation(view,op);
    const result=new Promise(resolve=>jobs.push({op,resolve}));view=next;write();emit();request();return result;
  }
  return {
    initialize(state){base=view=recoveredSeriesDrafts(state,journal.failed);failed=journal.failed;const pending=journal.pending;journal={pending:[],failed:[]};emit();for(const op of pending){try{enqueue(op);}catch{failed.push(op);view=base=recoveredSeriesDrafts(base,[op]);onError('Recuperamos valores de una serie pendiente. Revísalos antes de volver a confirmar.');}}write();return view;},
    sync(state){if(!running&&!jobs.length)base=view=state;},
    confirm(exercise,date,index,values,now=Date.now()){if(!view)throw new Error('La sesión aún no está lista.');const op={id:crypto.randomUUID(),version:1,exercise:structuredClone(exercise),date,index,values:structuredClone(values),now};return enqueue(op);},
    begin(date,now=Date.now()){return enqueue({id:crypto.randomUUID(),version:1,kind:'start',date,now});},
    flush(){return jobs.length||running?new Promise(resolve=>waiters.push(resolve)):Promise.resolve(true);},
    getState:()=>view,
    getConfirmedState:()=>base,
    pending:()=>jobs.length,
  };
}
