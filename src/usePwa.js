import {useEffect,useRef,useState} from 'react';
import {checkPublishedUpdate} from './pwaUpdates.js';

// An update is offered only after its complete offline cache has installed.
// Activation never clears IndexedDB, localStorage or pending form drafts.
export default function usePwa(){
  const [online,setOnline]=useState(navigator.onLine),[ready,setReady]=useState(false),[prompt,setPrompt]=useState(null),[error,setError]=useState('');
  const [available,setAvailable]=useState(false),[updating,setUpdating]=useState(false);
  const [checking,setChecking]=useState(false),[checkMessage,setCheckMessage]=useState('');
  const registration=useRef(null),requested=useRef(false),connecting=useRef(null),checkingLock=useRef(false),offered=useRef(false);
  function offer(){offered.current=true;setAvailable(true);}
  useEffect(()=>{
    let disposed=false,lastCheck=0,installing;
    const inspect=()=>{if(!disposed&&registration.current?.waiting&&navigator.serviceWorker.controller)offer();};
    const found=()=>{installing=registration.current.installing;installing?.addEventListener('statechange',inspect);};
    const check=()=>{if(document.visibilityState==='hidden'||!navigator.onLine||Date.now()-lastCheck<60000)return;lastCheck=Date.now();registration.current?.update().catch(()=>{});};
    const connection=()=>{setOnline(navigator.onLine);check();};
    const capture=event=>{event.preventDefault();setPrompt(event);};
    const installed=()=>setPrompt(null);
    let hadController=Boolean(navigator.serviceWorker?.controller);
    const controlled=()=>{
      if(requested.current){window.location.reload();return;}
      if(hadController)offer(); // Another tab updated; keep this form open.
      hadController=true;
    };
    window.addEventListener('online',connection);window.addEventListener('offline',connection);
    window.addEventListener('beforeinstallprompt',capture);window.addEventListener('appinstalled',installed);
    document.addEventListener('visibilitychange',check);
    const timer=setInterval(check,300000);
    if(import.meta.env.PROD&&navigator.serviceWorker){
      navigator.serviceWorker.addEventListener('controllerchange',controlled);
      connecting.current=navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{updateViaCache:'none'}).then(reg=>{
        if(disposed)return;
        registration.current=reg;reg.addEventListener('updatefound',found);found();inspect();check();
        navigator.serviceWorker.ready.then(()=>{if(!disposed)setReady(true);});
        return reg;
      }).catch(()=>{if(!disposed)setError('No se pudo preparar el modo offline. Recarga con conexión.');return null;});
    }
    return()=>{disposed=true;clearInterval(timer);registration.current?.removeEventListener('updatefound',found);installing?.removeEventListener('statechange',inspect);navigator.serviceWorker?.removeEventListener('controllerchange',controlled);document.removeEventListener('visibilitychange',check);window.removeEventListener('online',connection);window.removeEventListener('offline',connection);window.removeEventListener('beforeinstallprompt',capture);window.removeEventListener('appinstalled',installed);};
  },[]);
  async function checkUpdates(){
    if(checkingLock.current||requested.current)return;
    if(!navigator.onLine){setCheckMessage('Sin conexión. Conéctate a internet y vuelve a intentar. Tus registros siguen disponibles.');return;}
    if(!import.meta.env.PROD){setCheckMessage('Modo desarrollo: Vite actualiza los cambios al guardar. La actualización instalable se comprueba en la app publicada.');return;}
    if(!navigator.serviceWorker){setCheckMessage('Este navegador no permite buscar actualizaciones de la app.');return;}
    checkingLock.current=true;setChecking(true);setCheckMessage('Buscando actualizaciones…');
    try{
      const reg=registration.current??await connecting.current;
      if(!reg)throw new Error('No se pudo preparar la búsqueda. Recarga con conexión y vuelve a intentar.');
      const found=await checkPublishedUpdate(reg);
      if(found||offered.current){offer();setCheckMessage('Actualización lista. Toca Actualizar ahora.');}
      else setCheckMessage('Ya tienes la última versión publicada.');
    }catch(error){setCheckMessage(error?.message?.startsWith('La descarga tarda')?error.message:'No se pudo comprobar la actualización. Revisa la conexión y vuelve a intentar.');}
    finally{checkingLock.current=false;setChecking(false);}
  }
  async function update(beforeReload){
    if(requested.current)return;
    setUpdating(true);setError('');
    try{
      if(await beforeReload()===false){setUpdating(false);return;}
      const worker=registration.current?.waiting;
      requested.current=true;
      if(worker)worker.postMessage({type:'SKIP_WAITING'});
      else window.location.reload();
    }catch{requested.current=false;setUpdating(false);setError('No se pudo guardar antes de actualizar. Tu pantalla sigue abierta; vuelve a intentar.');}
  }
  async function install(){if(prompt){await prompt.prompt();await prompt.userChoice;setPrompt(null);}}
  return {online,ready,prompt,error,install,available,updating,update,checking,checkMessage,checkUpdates,build:__APP_BUILD__};
}
