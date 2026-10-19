// Wait for the complete offline download, not only the worker script check.
export function waitForInstallation(worker,timeout=30000){
  if(!worker||['installed','activated'].includes(worker.state))return Promise.resolve();
  return new Promise((resolve,reject)=>{
    let timer;
    const finish=error=>{clearTimeout(timer);worker.removeEventListener('statechange',inspect);error?reject(error):resolve();};
    const inspect=()=>{
      if(['installed','activated'].includes(worker.state))finish();
      else if(worker.state==='redundant')finish(new Error('No se pudo instalar la actualización.'));
    };
    worker.addEventListener('statechange',inspect);
    timer=setTimeout(()=>finish(new Error('La descarga tarda más de lo esperado. Vuelve a buscar en unos instantes.')),timeout);
    inspect();
  });
}

export async function checkPublishedUpdate(registration,timeout=30000){
  let installing=registration.installing,timer;
  const found=()=>{installing=registration.installing;};
  registration.addEventListener('updatefound',found);
  try{
    await Promise.race([registration.update(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('La descarga tarda más de lo esperado. Vuelve a buscar en unos instantes.')),timeout);})]);
    clearTimeout(timer);
    if(registration.waiting)return true;
    await waitForInstallation(installing??registration.installing,timeout);
    return Boolean(registration.waiting);
  }finally{clearTimeout(timer);registration.removeEventListener('updatefound',found);}
}
