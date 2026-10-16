import {hydrateCollections,projectCollections,preservationCounts,verifyProjection} from './history.js';
import {BACKUP_STORES,validateBackup,combineStates} from './backup.js';

export const DB_NAME='heavy-duty-personal';
export const DB_VERSION=2;
export const COLLECTIONS=['sessions','cardio','journal','measurements','phases'];
const STORES=BACKUP_STORES;
let connection;
function createStores(db){
  if(!db.objectStoreNames.contains('app'))db.createObjectStore('app');
  for(const name of [...COLLECTIONS,'sessionRevisions']){
    const store=db.createObjectStore(name,{keyPath:'id'});
    store.createIndex('byDate','date');store.createIndex('byMonth','month');
    if(name==='sessions'){store.createIndex('byYear','year');store.createIndex('byExercise','exerciseKeys',{multiEntry:true});store.createIndex('byRoutineDay','routineDay');}
    if(name==='sessionRevisions')store.createIndex('bySession','sessionId');
  }
  db.createObjectStore('migrationBackups',{keyPath:'id'});
}
export function openDatabase(){
  if(!connection)connection=new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=event=>{
      const db=request.result,tx=request.transaction;createStores(db);
      if(event.oldVersion===1){
        const read=tx.objectStore('app').get('state');
        read.onsuccess=()=>{try{
          if(!read.result)return;
          const original=read.result,rows=projectCollections(original);verifyProjection(original,rows);
          const report={from:1,to:2,verified:true,at:new Date().toISOString(),before:preservationCounts(original),after:preservationCounts(hydrateCollections(original,rows))};
          tx.objectStore('migrationBackups').add({id:'v1-original',state:structuredClone(original),report});
          for(const name of COLLECTIONS)for(const row of rows[name])tx.objectStore(name).put(row);
          tx.objectStore('app').put({...original,storageFormat:2,storageMigration:report},'state');
        }catch(error){tx.abort();reject(error);}};
      }
    };
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();connection=undefined;};resolve(db);};
    request.onerror=()=>{connection=undefined;reject(request.error);};
    request.onblocked=()=>{connection=undefined;reject(new Error('Cierra las otras pestañas de la app para completar la actualización de IndexedDB.'));};
  });
  return connection;
}
function readTransaction(tx,done){
  const result={},cache=tx.objectStore('app').get('state');let remaining=COLLECTIONS.length+1;
  cache.onsuccess=()=>{result.cache=cache.result;if(--remaining===0)done(result);};
  for(const name of COLLECTIONS){const req=tx.objectStore(name).getAll();req.onsuccess=()=>{result[name]=req.result;if(--remaining===0)done(result);};}
}
function reconcile(tx,name,rows){
  const store=tx.objectStore(name),keys=store.getAllKeys(),wanted=new Set(rows.map(row=>row.id));
  keys.onsuccess=()=>{for(const id of keys.result)if(!wanted.has(id))store.delete(id);};
  for(const row of rows)store.put(row);
}
function writeState(tx,next,previous=[]){
  const rows=projectCollections(next,previous);verifyProjection(next,rows);
  for(const session of rows.sessions){const old=previous.find(item=>item.id===session.id);if(old&&JSON.stringify(old)!==JSON.stringify(session))tx.objectStore('sessionRevisions').add({id:crypto.randomUUID(),sessionId:session.id,date:session.date,month:session.month,at:new Date().toISOString(),session:old});}
  for(const name of COLLECTIONS)reconcile(tx,name,rows[name]);
  const {sessions:ignored,...cache}=next;tx.objectStore('app').put({...cache,storageFormat:2},'state');
  return {...hydrateCollections(cache,rows),storageFormat:2};
}
export async function updateState(updater){
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORES,'readwrite');let next;
    readTransaction(tx,result=>{try{const current=result.cache?.storageFormat===2?hydrateCollections(result.cache,result):result.cache;next=writeState(tx,updater(current),result.sessions);}catch(error){tx.abort();reject(error);}});
    tx.oncomplete=()=>resolve(next);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('No se pudo completar la transacción.'));
  });
}
export async function loadState(){const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction(['app',...COLLECTIONS],'readonly');let value;readTransaction(tx,result=>{value=result.cache?.storageFormat===2?hydrateCollections(result.cache,result):result.cache;});tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);});}
export async function saveState(state){return updateState(()=>state);}
export async function querySessions({month,year,exercise,from,to}={}){
  const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readonly'),store=tx.objectStore('sessions');const req=exercise?store.index('byExercise').getAll(exercise):month?store.index('byMonth').getAll(month):year?store.index('byYear').getAll(year):store.index('byDate').getAll();tx.oncomplete=()=>resolve(req.result.filter(item=>(!from||item.date>=from)&&(!to||item.date<=to)).sort((a,b)=>a.date.localeCompare(b.date)));tx.onerror=()=>reject(tx.error);});
}
export async function queryRevisions(id){const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('sessionRevisions','readonly'),req=tx.objectStore('sessionRevisions').index('bySession').getAll(id);tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);});}
export async function exportBackup(){
  const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction(STORES,'readonly'),records={};for(const name of STORES){const store=tx.objectStore(name),keys=store.getAllKeys(),values=store.getAll();values.onsuccess=()=>{records[name]=values.result.map((value,index)=>({key:keys.result[index],value}));};}tx.oncomplete=()=>resolve({format:'heavy-duty-backup',formatVersion:1,databaseName:DB_NAME,databaseVersion:db.version,exportedAt:new Date().toISOString(),records});tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
}
function readAllStores(tx,done){
  const records={};let remaining=STORES.length;
  for(const name of STORES){const store=tx.objectStore(name),keys=store.getAllKeys(),values=store.getAll();values.onsuccess=()=>{records[name]=values.result.map((value,index)=>({key:keys.result[index],value}));if(--remaining===0)done(records);};}
}
export async function importBackup(payload,mode){
  // Validate before acquiring a write transaction. No clear/put happens on failure.
  const incoming=validateBackup(payload);if(!['combine','replace'].includes(mode))throw new Error('Elige combinar o reemplazar.');
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORES,'readwrite');let result;
    readAllStores(tx,records=>{try{
      const cache=records.app.find(row=>row.key==='state')?.value,rows=Object.fromEntries(COLLECTIONS.map(key=>[key,records[key].map(row=>row.value)])),current=cache?.storageFormat===2?hydrateCollections(cache,rows):cache;
      const next=mode==='combine'&&current?combineStates(current,incoming.state):incoming.state;
      const before={id:`before-import-${crypto.randomUUID()}`,kind:'before-import',at:new Date().toISOString(),mode,records:Object.fromEntries(STORES.filter(key=>key!=='migrationBackups').map(key=>[key,records[key]]))};
      const source={id:`import-source-${crypto.randomUUID()}`,kind:'import-source',at:new Date().toISOString(),records:Object.fromEntries(STORES.filter(key=>key!=='migrationBackups').map(key=>[key,incoming.records[key]]))};
      if(mode==='replace')for(const name of STORES.filter(key=>key!=='migrationBackups'))tx.objectStore(name).clear();
      const appKeys=new Set(mode==='replace'?[]:records.app.map(row=>row.key));for(const row of incoming.records.app)if(row.key!=='state'&&!appKeys.has(row.key))tx.objectStore('app').put(row.value,row.key);
      result=writeState(tx,next,next.sessions??[]);
      for(const name of ['sessionRevisions','migrationBackups']){
        const existing=new Map((mode==='replace'&&name==='sessionRevisions'?[]:records[name]).map(row=>[row.key,row.value]));
        for(const row of incoming.records[name]){const old=existing.get(row.key);if(old&&JSON.stringify(old)===JSON.stringify(row.value))continue;const value=old?{...row.value,id:`import-${crypto.randomUUID()}`,originalId:row.key}:row.value;tx.objectStore(name).put(value);}
      }
      tx.objectStore('migrationBackups').add(before);tx.objectStore('migrationBackups').add(source);
    }catch(error){tx.abort();reject(error);}});
    tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('Importación cancelada; tus datos anteriores siguen intactos.'));
  });
}
