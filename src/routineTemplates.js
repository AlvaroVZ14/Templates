import {makeExercise,validateRoutine} from './domain.js';
import {createRoutinePlan,ROUTINE_VERSION} from './routinePlan.js';

export const TEMPLATES=[{id:'ppl-torso-leg',name:'PPL + Torso + Leg',days:5,description:'5 días · 85 series · plantilla avanzada'},
 {id:'full-body',name:'Full Body',days:3,description:'Lunes, miércoles y viernes · cuerpo completo'},
 {id:'upper-lower',name:'Torso / Pierna',days:4,description:'Lunes, martes, jueves y viernes'},
 {id:'ppl-six',name:'Push / Pull / Legs',days:6,description:'Lunes a sábado · descanso el domingo'}];
// General starting points, editable rather than individualized prescriptions.
const moves={
 squat:['Sentadilla','Cuádriceps','barbell',true],press:['Press banca','Pecho','barbell',true],row:['Remo en polea','Espalda','cable',true],
 pulldown:['Jalón al pecho','Espalda','cable',true],incline:['Press inclinado mancuernas','Pecho','dumbbell',true],
 legpress:['Prensa','Cuádriceps','machine',true],curlleg:['Femoral sentado','Femorales','machine',false],
 hinge:['Peso muerto rumano','Femorales','barbell',true],lateral:['Elevaciones laterales mancuerna','Deltoides laterales','dumbbell',false],
 curl:['Curl mancuerna','Bíceps','dumbbell',false],triceps:['Extensión tríceps en polea','Tríceps','cable',false],
 calves:['Gemelo en prensa','Gemelos','machine',false],crunch:['Crunch con disco','Abdomen','barbell',false],
 glutes:['Hip thrust','Glúteos','barbell',true],fly:['Aperturas en polea','Pecho','cable',false],rear:['Deltoides posterior polea','Deltoides posteriores','cable',false]};
function session(name,entries){return entries.map(([key,sets=2])=>{
 const [title,muscle,equipment,compound]=moves[key],ex=makeExercise(title,muscle,sets,'',equipment,compound);
 const repMin=muscle==='Abdomen'?10:muscle==='Gemelos'||key==='lateral'?12:compound?6:8,repMax=muscle==='Abdomen'||muscle==='Gemelos'||key==='lateral'?20:compound?10:15;
 return {...ex,routineSession:name,setPlan:Array.from({length:sets},()=>({role:'standard',repMin,repMax,technique:''})),backoffPercent:10,rests:{...ex.rests,effective:compound?150:105}};
});}
export function createTemplate(id){
 if(id==='ppl-torso-leg')return createRoutinePlan();
 let days;
 if(id==='full-body')days={0:['FULL BODY A',[['squat'],['press'],['row'],['curlleg'],['lateral'],['crunch']]],2:['FULL BODY B',[['hinge'],['incline'],['pulldown'],['legpress'],['curl'],['calves']]],4:['FULL BODY C',[['squat'],['press'],['row'],['glutes'],['triceps'],['crunch']]]};
 else if(id==='upper-lower')days={0:['TORSO A',[['press',3],['row',3],['incline',2],['pulldown',2],['lateral',2],['curl',2]]],1:['PIERNA A',[['squat',3],['curlleg',3],['glutes',2],['calves',2],['crunch',2]]],3:['TORSO B',[['incline',3],['pulldown',3],['fly',2],['row',2],['rear',2],['triceps',2]]],4:['PIERNA B',[['legpress',3],['hinge',3],['curlleg',2],['calves',2],['crunch',2]]]};
 else if(id==='ppl-six'){days={};for(let i=0;i<6;i++)days[i]=i%3===0?[`PUSH ${i<3?'A':'B'}`,[['press',2],['incline',2],['lateral',2],['triceps',2]]]:i%3===1?[`PULL ${i<3?'A':'B'}`,[['pulldown',2],['row',2],['rear',2],['curl',2]]]:[`LEGS ${i<3?'A':'B'}`,[['legpress',2],['hinge',2],['curlleg',2],['calves',2],['crunch',2]]];}
 else throw new Error('Plantilla desconocida.');
 const shared=new Map();return Array.from({length:7},(_,day)=>days[day]?session(...days[day]).map(ex=>{const key=`${ex.name}:${ex.equipment}`;if(shared.has(key))ex.profileId=shared.get(key);else shared.set(key,ex.profileId);return ex;}):[]);
}
export function routineTargets(routine){return routine.flat().reduce((targets,ex)=>({...targets,[ex.muscle]:(targets[ex.muscle]??0)+ex.sets}),{});}
export function saveRoutine(state,routine,date,templateId='custom'){
 const invalid=validateRoutine(routine);if(invalid)throw new Error(invalid);
 if(state.gymSession&&state.sessionMeta?.[state.gymSession.date]?.startedAt&&!state.sessionMeta[state.gymSession.date].endedAt)throw new Error('Termina la sesión abierta antes de cambiar la rutina.');
 routine=structuredClone(routine);
 const key=ex=>`${ex.name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}::${ex.equipment}`,matches=new Map();
 for(const ex of state.routine.flat()){const k=key(ex);if(!matches.has(k))matches.set(k,new Set());matches.get(k).add(ex.profileId);}
 for(const ex of routine.flat()){const candidates=matches.get(key(ex));if(candidates?.size===1)ex.profileId=[...candidates][0];}
 const profiles={...state.profiles};for(const ex of routine.flat())profiles[ex.profileId]??={workWeight:null,targetReps:ex.setPlan?.[0]?.repMin??8,repMin:ex.setPlan?.[0]?.repMin??8,repMax:ex.setPlan?.[0]?.repMax??15,notes:''};
 // Flat dated revisions avoid exponentially nested backups after repeated edits.
 const from=state.routineActivatedOn??'0001-01-01';
 const revisions=[...(state.routineRevisions??[]),...(date>from?[{id:crypto.randomUUID(),from,until:date,routine:structuredClone(state.routine)}]:[])];
 return {...state,routine:structuredClone(routine),profiles,targets:routineTargets(routine),routineVersion:ROUTINE_VERSION,routineTemplateId:templateId,routineActivatedOn:date,
  routineRevisions:revisions,
  calendar:Object.fromEntries(Object.entries(state.calendar??{}).map(([day,value])=>[day,day>=date?{...value,routineNeedsReview:true}:value]))};
}
