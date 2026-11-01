import {useCallback,useEffect,useRef} from 'react';
import {createSeriesQueue,mergeSeriesReceipt} from './seriesQueue.js';
import {persistTrainingOperation} from './trainingPersistence.js';
export default function useSeriesQueue(data,setData,setError){
  const ref=useRef(null);
  if(!ref.current){let storage=null;try{storage=localStorage;}catch{/* IndexedDB may still be available. */}ref.current=createSeriesQueue({storage,persist:async op=>mergeSeriesReceipt(ref.current.getConfirmedState(),op,await persistTrainingOperation(op)),onState:setData,onError:setError,schedule:callback=>document.hidden?setTimeout(callback,0):requestAnimationFrame(()=>setTimeout(callback,0))});}
  useEffect(()=>{if(data)ref.current.sync(data);},[data]);
  const confirm=useCallback((...args)=>{setError('');return ref.current.confirm(...args);},[setError]);
  const begin=useCallback((...args)=>ref.current.begin(...args),[]);
  const flush=useCallback(async()=>{if(!await ref.current.flush())throw new Error('Hay series sin guardar; revisa el aviso y reintenta.');},[]);
  return {confirm,begin,flush,initialize:state=>ref.current.initialize(state),pending:()=>ref.current.pending()};
}
