export async function requestPersistentStorage(storage=globalThis.navigator?.storage){
  if(!storage?.persist)return {kind:'unsupported',message:'Este navegador no permite solicitar almacenamiento persistente. Los datos siguen siendo locales y pueden estar sujetos a limpieza del navegador.'};
  try{const granted=await storage.persisted?.()||await storage.persist();return granted?{kind:'granted',message:'Almacenamiento persistente concedido.'}:{kind:'denied',message:'El navegador no concedió almacenamiento persistente. Podría eliminar datos locales por falta de espacio. No borres los datos del sitio si quieres conservarlos.'};}
  catch{return {kind:'error',message:'No se pudo solicitar almacenamiento persistente. Los datos locales pueden estar sujetos a limpieza del navegador.'};}
}
