// Version of the JSON state, independent of IndexedDB's store/index version.
export const DATA_SCHEMA_VERSION=7;
export function runSchemaMigrations(original,steps,target=DATA_SCHEMA_VERSION){
 const version=original?.schemaVersion??1;
 if(!Number.isInteger(version)||version<1||version>target)throw new Error('Estos datos pertenecen a una versión más nueva o no compatible. Actualiza la app; no se ha modificado el historial.');
 if(version===target)return original;
 let state=structuredClone(original);
 for(let next=version+1;next<=target;next++){
  const up=steps[next];if(typeof up!=='function')throw new Error(`Falta la migración de datos ${next}.`);
  state=up(state);if(state?.schemaVersion!==next)throw new Error(`La migración ${next} no confirmó su versión.`);
 }
 return state;
}
