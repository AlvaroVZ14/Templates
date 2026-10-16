import {useEffect,useState} from 'react';

export default function useWakeLock(active){
  const [status,setStatus]=useState('idle'),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    if(!active){setStatus('idle');return;}
    if(!navigator.wakeLock?.request||!window.isSecureContext){setStatus('unsupported');return;}
    let disposed=false,sentinel=null,generation=0,pending=null;
    const release=()=>{generation++;pending=null;const held=sentinel;sentinel=null;held?.release().catch(()=>{});};
    async function acquire(){
      if(disposed||document.hidden||sentinel&&!sentinel.released||pending!==null)return;
      const token=++generation;pending=token;setStatus('requesting');
      try{
        const lock=await navigator.wakeLock.request('screen');
        if(disposed||token!==generation||document.hidden){await lock.release();return;}
        sentinel=lock;setStatus(lock.released?'released':'held');
        lock.addEventListener('release',()=>{if(!disposed&&sentinel===lock){sentinel=null;setStatus('released');}},{once:true});
      }catch{if(!disposed&&token===generation)setStatus('denied');}
      finally{if(pending===token)pending=null;}
    }
    const visibility=()=>{if(document.hidden){release();setStatus('released');}else acquire();};
    const hide=()=>{release();if(!disposed)setStatus('released');};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',acquire);acquire();
    return()=>{disposed=true;release();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',acquire);};
  },[active,attempt]);
  return {status,retry:()=>setAttempt(value=>value+1)};
}
