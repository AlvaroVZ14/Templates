export const LOAD_TYPES={heavy:'Compuesto pesado',compound:'Compuesto liviano',isolation:'Aislamiento'};
export const PATTERNS={'chest-press':'Press de pecho','overhead-press':'Press sobre cabeza',row:'Remo','vertical-pull':'Jalón', 'knee-press':'Empuje de pierna','hip-extension':'Extensión de cadera',other:'Otro / independiente'};
const plain=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function classifyExercise(ex){
  const name=plain(ex.name);let inferred='isolation',pattern='other';
  if(/press (banca|declinado|inclinado)/.test(name)){inferred='heavy';pattern='chest-press';}
  else if(/press militar/.test(name)){inferred='heavy';pattern='overhead-press';}
  else if(/remo/.test(name)){inferred='heavy';pattern='row';}
  else if(/jalon/.test(name)){inferred='heavy';pattern='vertical-pull';}
  else if(/hack|^prensa\b/.test(name)){inferred='heavy';pattern='knee-press';}
  else if(/hiperextensiones/.test(name)){inferred='compound';pattern='hip-extension';}
  else if(ex.compound)inferred='compound';
  return {loadType:Object.hasOwn(LOAD_TYPES,ex.loadType)?ex.loadType:inferred,movementPattern:Object.hasOwn(PATTERNS,ex.movementPattern)?ex.movementPattern:pattern};
}
export function migrateClassification(state){
  if(state.classificationVersion===1)return state;
  return {...state,classificationVersion:1,routine:state.routine.map(day=>day.map(ex=>{const classification=classifyExercise(ex);return {...ex,...classification,compound:classification.loadType!=='isolation'};}))};
}
