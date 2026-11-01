import {classifyExercise} from './classification.js';
import {chileDate} from './program/state.js';
import {shiftDate} from './wellness.js';

export const ROUTINE_VERSION='ppl-torso-leg-v1';
export const ROUTINE_TARGETS={Pecho:14,Espalda:13,'Bíceps':10,'Tríceps':4,'Deltoides laterales':6,'Deltoides posteriores':4,'Cuádriceps':10,Femorales:6,'Glúteos':4,Aductores:2,Abductores:4,Gemelos:4,Abdomen:4};
const increments={barbell:2.5,dumbbell:1,machine:5,cable:5,bodyweight:1};
export const SET_ROLES={standard:'Efectiva',top:'Top Set',backoff:'Back-off',heavy:'Pesada',light:'Ligera'};
const plain=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ').trim();
// These aliases describe the same movement and equipment. Variants such as
// seated/standing curls, narrow/general pulldowns and unilateral presses stay apart.
const aliases=new Map([
  ['aperturas polea','aperturas en polea'],
  ['ext. triceps tras nuca','extension triceps tras nuca'],
  ['extensiones triceps tras nuca','extension triceps tras nuca'],
  ['remo barra libre','remo libre'],['remo barra','remo libre'],
  ['curl mancuernas','curl mancuerna'],
  ['ext. cuadriceps','extensiones de cuadriceps'],['extension de cuadriceps','extensiones de cuadriceps'],
  ['aductor','aductores maquina'],['aductor maquina','aductores maquina'],
  ['soleo maquina','soleo maquina'],['gemelos prensa','gemelo en prensa'],
  ['press inclinado con mancuernas','press inclinado mancuernas'],
  ['elevaciones laterales','elevaciones laterales mancuerna'],
]);
function identity(ex){const name=plain(ex.name);return `${aliases.get(name)??name}::${ex.equipment}`;}
const plan=(sets,repMin,repMax,technique='',top=false)=>Array.from({length:sets},(_,index)=>({role:top?(index===0?'top':'backoff'):'standard',repMin,repMax,technique:index===sets-1?technique:''}));
function exercise(session,key,name,muscle,sets,equipment,loadType='isolation',technique='',top=false,range){
  const [repMin,repMax]=range??(muscle==='Abdomen'?[10,20]:['Deltoides laterales','Gemelos'].includes(muscle)?[12,20]:loadType==='isolation'?[8,15]:[6,10]);
  const base={id:`${ROUTINE_VERSION}:${session.toLowerCase().replace(/ /g,'-')}:${key}`,profileId:`${ROUTINE_VERSION}:profile:${key}`,name,muscle,sets,equipment,loadType,compound:loadType!=='isolation',technique,
    routineSession:session,setPlan:plan(sets,repMin,repMax,technique,top),backoffPercent:10,
    approaches:2,preparationOverride:null,preparationJoint:'',increment:increments[equipment],dropCount:1,rpCount:2,forced:false,negative:false,
    rests:{warmup:90,effective:loadType==='isolation'?105:150,rp:20,drop:15},intensityRirMin:0,intensityRirMax:2,eccentricSeconds:[2,3],
    ...(equipment==='bodyweight'?{weightMode:'added-load',weightNote:'Registra solo el lastre añadido; 0 kg significa peso corporal, no peso corporal total ni asistencia.'}:{}),
  };
  return {...base,...classifyExercise(base)};
}
export function createRoutinePlan(){
  const e=exercise;
  const torsoCurl=e('TORSO','curl-mancuerna','Curl mancuerna','Bíceps',5,'dumbbell');
  torsoCurl.setPlan=Array.from({length:5},(_,index)=>({role:index<3?'heavy':'light',repMin:index<3?6:12,repMax:index<3?10:15,technique:''}));
  const routine=[[],[
    e('PUSH','press-inclinado','Press inclinado mancuernas','Pecho',4,'dumbbell','heavy','',true),
    e('PUSH','press-banca','Press banca','Pecho',2,'barbell','heavy','',true),
    e('PUSH','aperturas-polea','Aperturas en polea','Pecho',3,'cable','isolation','drop'),
    e('PUSH','laterales-mancuerna','Elevaciones laterales mancuerna','Deltoides laterales',2,'dumbbell','isolation','rp'),
    e('PUSH','laterales-polea','Elevaciones laterales polea','Deltoides laterales',2,'cable'),
    e('PUSH','triceps-tras-nuca','Extensión tríceps tras nuca','Tríceps',2,'cable','isolation','drop'),
    e('PUSH','fondos','Fondos','Pecho',2,'bodyweight','compound'),
  ],[
    e('PULL','curl-polea','Curl polea','Bíceps',3,'cable'),
    e('PULL','dominadas','Dominadas','Espalda',3,'bodyweight','heavy','drop'),
    e('PULL','remo-libre','Remo libre','Espalda',2,'barbell','heavy'),
    e('PULL','remo-mancuerna','Remo mancuerna','Espalda',2,'dumbbell','heavy'),
    e('PULL','jalon-pecho','Jalón al pecho','Espalda',3,'cable','heavy','drop'),
    e('PULL','posterior-maquina','Deltoides posterior','Deltoides posteriores',2,'machine','isolation','drop'),
    e('PULL','curl-mancuerna','Curl mancuerna','Bíceps',2,'dumbbell'),
  ],[
    e('LEG A','extensiones','Extensiones de cuádriceps','Cuádriceps',2,'machine','isolation','drop'),
    e('LEG A','hack-squat','Hack squat','Cuádriceps',3,'machine','heavy','',true),
    e('LEG A','femoral-sentado','Femoral sentado','Femorales',4,'machine'),
    e('LEG A','hiper-gluteos','Hiperextensiones (glúteos)','Glúteos',2,'barbell','compound'),
    e('LEG A','aductores','Aductores máquina','Aductores',2,'machine'),
    e('LEG A','soleo','Sóleo máquina','Gemelos',2,'machine'),
    e('LEG A','crunch-disco','Crunch con disco','Abdomen',2,'barbell'),
  ],[],[
    e('TORSO','press-inclinado','Press inclinado mancuernas','Pecho',3,'dumbbell','heavy','',true),
    e('TORSO','jalon-pecho','Jalón al pecho','Espalda',2,'cable','heavy'),
    e('TORSO','remo-polea','Remo en polea','Espalda',1,'cable','heavy','drop'),
    torsoCurl,
    e('TORSO','laterales-polea','Elevaciones laterales polea','Deltoides laterales',2,'cable','isolation','drop'),
    e('TORSO','posterior-polea','Deltoides posterior polea','Deltoides posteriores',2,'cable'),
    e('TORSO','triceps-tras-nuca','Extensión tríceps tras nuca','Tríceps',2,'cable'),
  ],[
    e('LEG B','prensa-unilateral','Prensa unilateral','Cuádriceps',3,'machine','heavy'),
    e('LEG B','gemelo-prensa','Gemelo en prensa','Gemelos',2,'machine'),
    e('LEG B','hack-squat','Hack squat','Cuádriceps',2,'machine','heavy','',true),
    e('LEG B','femoral-pie','Femoral de pie','Femorales',2,'machine','isolation','drop'),
    e('LEG B','hiper-gluteos','Hiperextensiones (glúteos)','Glúteos',2,'barbell','compound'),
    e('LEG B','abductores','Abductores máquina','Abductores',4,'machine'),
    e('LEG B','crunch-disco','Crunch con disco','Abdomen',2,'barbell'),
  ]];
  // Repeated movements share reference weights, not their per-day instance IDs.
  const profiles=new Map();for(const ex of routine.flat()){const key=identity(ex);if(profiles.has(key))ex.profileId=profiles.get(key);else profiles.set(key,ex.profileId);}
  return routine;
}
export function migrateRoutinePlan(state,date=chileDate()){
  if(state.routineVersion===ROUTINE_VERSION)return state;
  const snapshot=structuredClone(state),routine=createRoutinePlan(),profiles={...state.profiles},candidates=new Map(),shared=new Map();
  const gym=state.gymSession,meta=state.sessionMeta?.[gym?.date];
  const deferred=Boolean(gym?.date===date&&meta?.startedAt&&!meta.endedAt&&state.routine.flat().some(ex=>ex.id===gym.currentExerciseId));
  const activatedOn=deferred?shiftDate(date,1):date;
  for(const old of state.routine.flat()){
    const key=identity(old);if(!candidates.has(key))candidates.set(key,new Set());
    if(old.profileId&&Object.hasOwn(profiles,old.profileId))candidates.get(key).add(old.profileId);
  }
  for(const ex of routine.flat()){
    const key=identity(ex),matches=candidates.get(key);
    if(!shared.has(key))shared.set(key,matches?.size===1?[...matches][0]:ex.profileId);
    ex.profileId=shared.get(key);
    profiles[ex.profileId]??={workWeight:null,targetReps:ex.setPlan[0].repMin,repMin:ex.setPlan[0].repMin,repMax:ex.setPlan[0].repMax,notes:''};
  }
  const calendar=Object.fromEntries(Object.entries(state.calendar??{}).map(([day,entry])=>[day,day>=activatedOn?{...entry,routineNeedsReview:true}:entry]));
  return {...state,routine,profiles,calendar,targets:{...ROUTINE_TARGETS},routineVersion:ROUTINE_VERSION,routineActivatedOn:activatedOn,routineActivationDeferred:deferred,
    routineMigrationBackups:[...(state.routineMigrationBackups??[]),{id:`before-${ROUTINE_VERSION}`,fromVersion:state.routineVersion??'legacy',toVersion:ROUTINE_VERSION,createdAt:new Date().toISOString(),state:snapshot}]};
}
export function routineForDate(state,date){
  if(state.routineActivatedOn&&date<state.routineActivatedOn){
    const snapshot=state.routineMigrationBackups?.findLast(item=>item.toVersion===state.routineVersion)?.state;
    if(snapshot?.routine)return routineForDate(snapshot,date);
  }
  return state.routine;
}
export function effectiveSetPlan(ex,index=0){
  const position=Math.max(0,Math.floor(index)),explicit=ex.setPlan?.[position];
  const repMin=explicit?.repMin??ex.repMin??8,repMax=explicit?.repMax??ex.repMax??12;
  return {role:explicit?.role??'standard',repMin,repMax,technique:position===ex.sets-1?(explicit?.technique??ex.technique??''):''};
}
export function effectiveSetSuggestion(ex,referenceWeight,index=0,logs=[]){
  const entry=effectiveSetPlan(ex,index),effective=logs.filter(log=>log.kind==='effective');
  const top=effective.find(log=>log.setRole==='top')??effective[0];
  const valid=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
  const source=entry.role==='backoff'&&valid(top?.weight)?top.weight:referenceWeight;
  const percent=Number.isFinite(ex.backoffPercent)?ex.backoffPercent:10;
  const value=entry.role==='backoff'?source*(1-percent/100):source;
  const increment=ex.increment??increments[ex.equipment]??1;
  // The plan gives a light rep range, not an arbitrary percentage reduction.
  // Ask for a suitable lighter load rather than labelling the heavy reference light.
  const weight=entry.role==='light'?null:valid(source)?Number((Math.round(Math.max(0,value)/increment)*increment).toFixed(3)):null;
  return {...entry,index,weight,reps:entry.repMin,referenceSource:weight===null?'missing':entry.role==='backoff'&&valid(top?.weight)?'top-today':'reference'};
}
