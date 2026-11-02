import {saveSeriesOperation,saveTrainingMetadata} from './db.js';
let worker,ready,pending=new Map(),sequence=0;
export function stopTrainingPersistence(){worker?.terminate();worker=null;ready=undefined;for(const job of pending.values())job.reject(new Error('Guardado detenido para borrar datos.'));pending.clear();}
export function warmTrainingPersistence(){
  if(ready)return ready;
  if(typeof Worker==='undefined')return Promise.resolve(false);
  ready=new Promise(resolve=>{
    try{
      worker=new Worker(new URL('./series-persistence.worker.js',import.meta.url),{type:'module',name:'local-training-storage'});
      worker.onmessage=event=>{const message=event.data;if(message.ready){resolve(true);return;}const job=pending.get(message.id);if(!job)return;pending.delete(message.id);if(message.error)job.reject(new Error(message.error));else job.resolve(message.result);};
      worker.onerror=()=>{for(const job of pending.values())job.reject(new Error('Se interrumpió el guardado local.'));pending.clear();worker?.terminate();worker=null;ready=undefined;resolve(false);};
    }catch{worker=null;ready=undefined;resolve(false);}
  });
  return ready;
}
export async function persistTrainingOperation(operation){
  if(!await warmTrainingPersistence()||!worker)return saveSeriesOperation(operation);
  return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});worker.postMessage({id,operation});});
}
export async function persistTrainingMetadata(metadata){
  if(!await warmTrainingPersistence()||!worker)return saveTrainingMetadata(metadata);
  return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});worker.postMessage({id,metadata});});
}
