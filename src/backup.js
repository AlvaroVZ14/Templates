import {migrateState,validateRoutine,KINDS} from './domain.js';
import {hydrateCollections,projectCollections,verifyProjection} from './history.js';
import {JOURNAL_FIELDS} from './wellness.js';
import {validateFood,MACROS} from './program/nutrition.js';
export const BACKUP_STORES=['app','sessions','cardio','journal','measurements','phases','sessionRevisions','migrationBackups'];
const collections=['sessions','cardio','journal','measurements','phases'];
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(`${value}T12:00:00Z`))&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;
function require(condition,message){if(!condition)throw new Error(message);}
function safeTree(value,depth=0){require(depth<120,'El archivo contiene datos demasiado anidados.');if(value===null)return;if(typeof value==='number')require(Number.isFinite(value),'Número no válido en el archivo.');if(typeof value==='object')for(const key of Object.keys(value)){require(!['__proto__','prototype','constructor'].includes(key),'El archivo contiene una clave no permitida.');safeTree(value[key],depth+1);}else require(['string','number','boolean'].includes(typeof value),'Dato no compatible con JSON.');}
function validateState(state){
 require(object(state)&&Number.isInteger(state.schemaVersion)&&state.schemaVersion>=1&&state.schemaVersion<=7,'Versión de datos no compatible.');
 require(Array.isArray(state.routine)&&state.routine.length===7&&state.routine.every(Array.isArray)&&Array.isArray(state.logs),'Falta la rutina o el historial.');
 const next=migrateState(structuredClone(state));require(!validateRoutine(next.routine),'La rutina del respaldo no es válida.');
 for(const key of ['profiles','dailySteps','journal','calendar','programSettings'])require(object(next[key]),`Configuración no válida: ${key}.`);
 for(const key of ['cardio','measurements','phases','phaseHistory','goalRevisions','foods','foodLogs','meals','deloads'])require(Array.isArray(next[key]),`Colección no válida: ${key}.`);
 const ids=new Set();for(const log of next.logs){require(object(log)&&typeof log.id==='string'&&!ids.has(log.id),'ID de serie ausente o duplicado.');ids.add(log.id);require(date(log.date)&&Object.hasOwn(KINDS,log.kind),'Fecha o tipo de serie no válido.');require(Number.isFinite(log.weight)&&log.weight>=0&&log.weight<=1500&&Number.isInteger(log.reps)&&log.reps>=1&&log.reps<=200,'Peso o repeticiones no válidos.');require(log.rpe==null||Number.isFinite(log.rpe)&&log.rpe>=0&&log.rpe<=10,'RPE no válido.');require(log.failure==null||typeof log.failure==='boolean','Fallo no válido.');require(log.restRealSeconds==null||Number.isFinite(log.restRealSeconds)&&log.restRealSeconds>=0&&log.restRealSeconds<=86400,'Descanso real no válido.');}
 for(const log of next.logs){require(!log.parentId||ids.has(log.parentId),'Una extensión apunta a una serie inexistente.');for(const key of ['exerciseName','muscle','equipment','exerciseNotes'])require(log[key]==null||typeof log[key]==='string',`Texto de serie no válido: ${key}.`);}
 for(const [day,entry] of Object.entries(next.journal)){require(date(day)&&object(entry),'Diario no válido.');for(const field of JOURNAL_FIELDS){const value=entry[field.key];require(value==null||Number.isFinite(value)&&value>=field.min&&value<=field.max,`Valor de diario no válido: ${field.key}.`);}require(entry.pain==null||typeof entry.pain==='string','Dolor no válido.');}
 for(const profile of Object.values(next.profiles)){require(object(profile)&&(profile.workWeight==null||Number.isFinite(profile.workWeight)&&profile.workWeight>=0&&profile.workWeight<=1500),'Peso de trabajo no válido.');require(profile.notes==null||typeof profile.notes==='string','Notas de ejercicio no válidas.');require(profile.targetReps==null||Number.isInteger(profile.targetReps)&&profile.targetReps>0&&profile.targetReps<=200,'Reps objetivo no válidas.');}
 for(const row of next.cardio)require(object(row)&&date(row.date)&&Number.isFinite(row.minutes)&&row.minutes>0&&typeof row.type==='string','Cardio no válido.');
 for(const [day,value] of Object.entries(next.dailySteps))require(date(day)&&Number.isInteger(value)&&value>=0,'Pasos no válidos.');
 for(const row of next.measurements)require(object(row)&&date(row.date)&&object(row.values)&&Object.values(row.values).every(value=>value===null||Number.isFinite(value)&&value>0&&value<=500),'Medidas no válidas.');
 for(const row of next.phases)require(object(row)&&typeof row.id==='string'&&['bulk','cut','maintain'].includes(row.kind)&&date(row.startDate),'Fase no válida.');
 const macros=value=>object(value)&&MACROS.every(key=>Number.isFinite(value[key])&&value[key]>=0)&&(value.fiber==null||Number.isFinite(value.fiber)&&value.fiber>=0);
 for(const food of next.foods)require(object(food)&&typeof food.id==='string'&&typeof food.name==='string'&&!validateFood(food),'Alimento no válido.');
 for(const meal of next.meals)require(object(meal)&&date(meal.date)&&Number.isFinite(meal.kcal)&&meal.kcal>=0&&Number.isFinite(meal.protein)&&meal.protein>=0,'Comida no válida.');
 for(const log of next.foodLogs)require(object(log)&&typeof log.id==='string'&&date(log.date)&&macros(log.macros)&&Array.isArray(log.items)&&log.items.every(item=>object(item)&&object(item.food)&&typeof item.food.name==='string'&&Number.isFinite(item.quantity)&&macros(item.macros)),'Consumo alimentario no válido.');
 for(const [day,plan] of Object.entries(next.mealPlans??{}))require(date(day)&&object(plan)&&macros(plan.total)&&object(plan.target)&&Array.isArray(plan.meals)&&plan.meals.every(meal=>object(meal)&&Array.isArray(meal.items)&&meal.items.every(item=>object(item)&&object(item.food)&&typeof item.food.name==='string'&&macros(item.macros))),'Plan alimentario no válido.');
 require(object(next.settings)&&Number.isFinite(next.settings.sleepGoal)&&next.settings.sleepGoal>0&&next.settings.sleepGoal<=24,'Meta de sueño no válida.');
 require(object(next.preparationSettings)&&[0,1].includes(next.preparationSettings.minimum),'Configuración de previas no válida.');
 if(next.navigationSettings)require(object(next.navigationSettings)&&(!next.navigationSettings.drawerSide||['left','right'].includes(next.navigationSettings.drawerSide))&&(!next.navigationSettings.lastSession||date(next.navigationSettings.lastSession)),'Navegación no válida.');
 for(const draft of Object.values(next.trainingDrafts??{}))require(object(draft)&&date(draft.date)&&object(draft.values)&&Object.values(draft.values).every(value=>value===null||['number','string','boolean'].includes(typeof value)),'Borrador no válido.');
 for(const [day,meta] of Object.entries(next.sessionMeta??{}))require(date(day)&&object(meta)&&(meta.notes==null||typeof meta.notes==='string')&&(meta.durationSeconds==null||Number.isFinite(meta.durationSeconds)&&meta.durationSeconds>=0),'Datos de sesión no válidos.');
 require(next.monthlyReviews===undefined||Array.isArray(next.monthlyReviews),'Revisiones mensuales no válidas.');
 for(const row of next.monthlyReviews??[])require(object(row)&&typeof row.id==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(row.month)&&object(row.report)&&date(row.report.asOf)&&['performance','body','consistency'].every(key=>object(row.report[key])&&['green','amber','red','insufficient'].includes(row.report[key].status)&&typeof row.report[key].text==='string'&&typeof row.report[key].action==='string'&&(row.report[key].value===null||Number.isFinite(row.report[key].value)))&&object(row.changes),'Revisión mensual no válida.');
 return next;
}
export function validateBackup(payload){
 safeTree(payload);require(object(payload)&&payload.format==='heavy-duty-backup','No es un respaldo de Heavy Duty.');require(payload.formatVersion===1&&payload.databaseVersion===2&&payload.databaseName==='heavy-duty-personal','Versión de respaldo o de base de datos no compatible.');require(object(payload.records)&&Object.keys(payload.records).length===BACKUP_STORES.length,'Colecciones del respaldo incompletas o desconocidas.');
 const records=structuredClone(payload.records);
 for(const store of BACKUP_STORES){require(Array.isArray(records[store]),`Falta la colección ${store}.`);const keys=new Set();for(const entry of records[store]){require(object(entry)&&(typeof entry.key==='string'||typeof entry.key==='number')&&object(entry.value),'Registro de respaldo no válido.');require(!keys.has(entry.key),`Claves duplicadas en ${store}.`);keys.add(entry.key);if(store!=='app')require(typeof entry.value.id==='string'&&entry.key===entry.value.id,`ID no válido en ${store}.`);}}
 const raw=records.app.find(row=>row.key==='state')?.value;require(raw,'Falta el estado principal.');const state=validateState(raw),rows=Object.fromEntries(collections.map(key=>[key,records[key].map(row=>row.value)]));
 const sessionValid=session=>object(session)&&date(session.date)&&Array.isArray(session.exercises)&&session.exercises.every(ex=>typeof ex.name==='string'&&Array.isArray(ex.sets)&&ex.sets.every(set=>object(set.source)));
 for(const session of rows.sessions)require(sessionValid(session),'Sesión no válida.');
 for(const entry of records.sessionRevisions)require(sessionValid(entry.value.session),'Versión histórica de sesión no válida.');
 require(new Set(rows.sessions.map(row=>row.date)).size===rows.sessions.length,'Hay sesiones duplicadas para una fecha.');
 verifyProjection(raw,rows);const restored=hydrateCollections(state,rows);verifyProjection(restored,projectCollections(restored,rows.sessions));
 return {records,state:restored,counts:{sessions:rows.sessions.length,series:restored.logs.length,cardio:restored.cardio.length,journal:Object.keys(restored.journal).length,measurements:restored.measurements.length,monthlyReviews:restored.monthlyReviews?.length??0},version:payload.formatVersion};
}
const identity=row=>object(row)&&typeof row.id==='string'?`id:${row.id}`:`value:${JSON.stringify(row)}`;
// Current values win collisions; imported fields and distinct IDs are retained.
// Both complete sources are archived by the import transaction before merging.
export function combineValues(current,incoming){
 if(current===undefined||current===null)return structuredClone(incoming);
 if(Array.isArray(current)&&Array.isArray(incoming)){const seen=new Set(current.map(identity));return [...structuredClone(current),...incoming.filter(row=>!seen.has(identity(row))).map(row=>structuredClone(row))];}
 if(object(current)&&object(incoming)){const result={...structuredClone(incoming)};for(const key of Object.keys(current))result[key]=Object.hasOwn(incoming,key)?combineValues(current[key],incoming[key]):structuredClone(current[key]);return result;}
 return structuredClone(current);
}
export function combineStates(current,incoming){
 const source=structuredClone(incoming),used=new Set(current.routine.flat().map(ex=>ex.id)),mapping=new Map(),name=ex=>ex.name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const routine=current.routine.map((day,index)=>{const result=structuredClone(day),matched=new Set();for(const ex of source.routine[index]){if(used.has(ex.id))continue;const same=day.find(local=>!matched.has(local.id)&&local.profileId===ex.profileId&&local.equipment===ex.equipment&&name(local)===name(ex));if(same){mapping.set(ex.id,same.id);matched.add(same.id);}else{result.push(ex);used.add(ex.id);}}return result;});
 // Independent installations generate different routine IDs. Join the same
 // exercise in the same day and relink its records; archive originals unchanged.
 const relink=log=>({...log,exerciseId:mapping.get(log.exerciseId)??log.exerciseId});source.logs=source.logs.map(relink);source.techniqueTrials=(source.techniqueTrials??[]).map(relink);
 source.trainingDrafts=Object.fromEntries(Object.entries(source.trainingDrafts??{}).map(([key,value])=>[key.split(':').map(part=>mapping.get(part)??part).join(':'),value]));
 source.sessions=source.sessions.map(session=>({...session,exercises:session.exercises.map(ex=>({...ex,id:mapping.get(ex.id)??ex.id,instance:mapping.has(ex.id)?`${mapping.get(ex.id)}${ex.instance.slice(ex.id.length)}`:ex.instance,sets:ex.sets.map(set=>({...set,source:relink(set.source)}))}))}));
 const merged=combineValues(current,source);merged.routine=routine;
 // Sessions are joined by calendar date; their sets are rebuilt from merged logs.
 const sessions=new Map(source.sessions.map(row=>[row.date,structuredClone(row)]));for(const row of current.sessions??[]){const previous=sessions.get(row.date);sessions.set(row.date,previous?{...previous,...structuredClone(row),exercises:combineValues(row.exercises,previous.exercises)}:structuredClone(row));}
 merged.sessions=[...sessions.values()];merged.schemaVersion=7;validateState(merged);return merged;
}
