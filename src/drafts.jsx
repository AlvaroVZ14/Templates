import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {updateState} from './db.js';

const Context=createContext(null), RECOVERY='heavy-duty-training-drafts-v1';
const apply=(base,patch)=>{const next={...base};for(const [key,value] of Object.entries(patch)){if(value===null)delete next[key];else next[key]=value;}return next;};
export const DraftProvider=Context.Provider;

// IndexedDB is authoritative. A synchronous recovery copy covers reloads before
// the debounced transaction commits; neither store is counted as training volume.
export function useDrafts(data,setData,onError){
  const latest=useRef(data);latest.current=data;
  const manager=useRef(null);
  if(!manager.current){
    let recovery={};try{recovery=JSON.parse(localStorage.getItem(RECOVERY)||'{}');}catch{/* IndexedDB still works when localStorage is unavailable. */}
    const pending={...recovery};let timer,tail=Promise.resolve();
    const backup=()=>{try{localStorage.setItem(RECOVERY,JSON.stringify(pending));}catch{/* A failed IndexedDB write is reported by flush. */}};
    const service={
      get:key=>Object.hasOwn(pending,key)?pending[key]:latest.current?.trainingDrafts?.[key],
      entries:()=>apply(latest.current?.trainingDrafts??{},pending),
      put(key,value){pending[key]=value;backup();clearTimeout(timer);timer=setTimeout(()=>service.flush().catch(()=>{}),250);},
      flush(){
        clearTimeout(timer);
        const run=async()=>{
          const patch={...pending};if(!Object.keys(patch).length||!latest.current)return;
          try{
            const next=await updateState(state=>({...state,trainingDrafts:apply(state.trainingDrafts??{},patch)}));
            // Keep the latest complete state from independent saves intact.
            latest.current={...latest.current,trainingDrafts:next.trainingDrafts};
            setData(current=>({...current,trainingDrafts:next.trainingDrafts}));
            for(const key of Object.keys(patch))if(pending[key]===patch[key])delete pending[key];backup();
          }catch(error){onError('No se pudo guardar el borrador. Conservamos la pantalla y una copia local; vuelve a intentar.');throw error;}
        };
        tail=tail.catch(()=>{}).then(run);return tail;
      },
    };manager.current=service;
  }
  useEffect(()=>{if(data)manager.current.flush().catch(()=>{});},[!!data]);
  useEffect(()=>{const flush=()=>manager.current.flush().catch(()=>{});window.addEventListener('pagehide',flush);return()=>{window.removeEventListener('pagehide',flush);flush();};},[]);
  return manager.current;
}

export function useFormDraft(key,date,fallbackKey){
  const manager=useContext(Context);
  const own=manager?.get(key),fallback=!own&&fallbackKey?manager?.get(fallbackKey):null;
  const initial=useRef(own??fallback);
  const migratedFrom=useRef(fallback?fallbackKey:null);
  useEffect(()=>{if(migratedFrom.current){manager?.put(migratedFrom.current,null);migratedFrom.current=null;}},[]);
  const dirty=useRef(!!initial.current);
  const values=useRef(initial.current?.values??{});
  const persist=()=>{if(dirty.current)manager?.put(key,{date,values:values.current});};
  return {
    restored:!!initial.current,initial:initial.current?.values??{},
    // Capture actual edits, rather than effects synchronizing saved profiles.
    touch(){dirty.current=true;persist();},
    remember(next){values.current=next;persist();},
    clear(){dirty.current=false;manager?.put(key,null);},
    dirty,
  };
}

export function useDraftState(draft,field,initial){
  const [value,setValue]=useState(()=>Object.hasOwn(draft.initial,field)?draft.initial[field]:(typeof initial==='function'?initial():initial));
  return [value,setValue];
}
