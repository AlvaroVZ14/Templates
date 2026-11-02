import {projectCollections,verifyProjection,preservationCounts,hydrateCollections} from './history.js';
export const DATABASE_VERSION=2;
export const COLLECTIONS=['sessions','cardio','journal','measurements','phases'];
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

// Add a numbered step, increase DATABASE_VERSION, and prove rollback before release.
export function upgradeDatabase(db,tx,oldVersion,reject){
 const migrations={2:()=>{
      createStores(db);
      if(oldVersion===1){
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
 }};
 for(let version=Math.max(2,oldVersion+1);version<=DATABASE_VERSION;version++){if(!migrations[version])throw new Error(`Falta la migracion de IndexedDB ${version}.`);migrations[version]();}
}
