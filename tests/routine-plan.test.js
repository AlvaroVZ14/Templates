import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,migrateState,recordSet,weeklyVolume,validateRoutine,preparationSuggestions} from '../src/domain.js';
import {initialState as legacyState} from './fixtures/legacy-state.js';
import {ROUTINE_VERSION,ROUTINE_TARGETS,createRoutinePlan,migrateRoutinePlan,routineForDate,effectiveSetPlan,effectiveSetSuggestion} from '../src/routinePlan.js';
import {dayContext} from '../src/program/nutrition.js';
import {sessionExercise,trainingLogError,muscleRecovery} from '../src/training.js';
import {sessionName,sessionTitle,restMessage,nextTraining} from '../src/calendarText.js';
import {exercisePain,exerciseZones} from '../src/pain.js';
import {projectCollections} from '../src/history.js';
import {BACKUP_STORES,validateBackup} from '../src/backup.js';

const expectedTargets={Pecho:14,Espalda:13,'Bíceps':10,'Tríceps':4,'Deltoides laterales':6,'Deltoides posteriores':4,'Cuádriceps':10,Femorales:6,'Glúteos':4,Aductores:2,Abductores:4,Gemelos:4,Abdomen:4};
const date='2026-11-03';
const log=(ex,index,extra={})=>({id:crypto.randomUUID(),exerciseId:ex.id,profileId:ex.profileId,exerciseName:ex.name,muscle:ex.muscle,equipment:ex.equipment,date,kind:'effective',weight:100,reps:8,rpe:9,failure:false,createdAt:`${date}T18:00:00Z`,setIndex:index,...extra});

test('PPL exacto: cinco días, siete ejercicios y 17 efectivas por sesión, 85 en 13 grupos',()=>{
 const state=initialState(),routine=state.routine;
 assert.equal(state.routineVersion,ROUTINE_VERSION);assert.deepEqual(routine.map(day=>day.length),[0,7,7,7,0,7,7]);
 assert.deepEqual(routine.map(day=>day.reduce((n,ex)=>n+ex.sets,0)),[0,17,17,17,0,17,17]);
 assert.deepEqual(ROUTINE_TARGETS,expectedTargets);assert.deepEqual(state.targets,expectedTargets);
 const totals=Object.fromEntries(Object.keys(expectedTargets).map(muscle=>[muscle,routine.flat().filter(ex=>ex.muscle===muscle).reduce((n,ex)=>n+ex.sets,0)]));
 assert.deepEqual(totals,expectedTargets);assert.equal(Object.values(totals).reduce((a,b)=>a+b,0),85);
 assert.equal(new Set(routine.flat().map(ex=>ex.id)).size,35);assert.equal(validateRoutine(routine),null);
 assert.ok(routine.flat().every(ex=>!ex.forced&&!ex.negative&&ex.setPlan.length===ex.sets));
 const seenProfiles=new Set();for(const ex of routine.flat()){if(seenProfiles.has(ex.profileId))continue;seenProfiles.add(ex.profileId);const profile=state.profiles[ex.profileId];assert.equal(profile.targetReps,ex.setPlan[0].repMin);assert.equal(profile.repMin,ex.setPlan[0].repMin);assert.equal(profile.repMax,ex.setPlan[0].repMax);}
 assert.deepEqual(routine.map(day=>day.map(ex=>ex.sets)),[[],[4,2,3,2,2,2,2],[3,3,2,2,3,2,2],[2,3,4,2,2,2,2],[],[3,2,1,5,2,2,2],[3,2,2,2,2,4,2]]);
});

test('rangos por carga/músculo y curl TORSO 3 pesadas + 2 ligeras, sin confundir equipo',()=>{
 const routine=createRoutinePlan();
 for(const ex of routine.flat())for(const [index,entry] of ex.setPlan.entries()){
  const range=ex.routineSession==='TORSO'&&ex.name==='Curl mancuerna'?(index<3?[6,10]:[12,15]):ex.muscle==='Abdomen'?[10,20]:['Deltoides laterales','Gemelos'].includes(ex.muscle)?[12,20]:ex.compound?[6,10]:[8,15];
  assert.deepEqual([entry.repMin,entry.repMax],range,`${ex.routineSession}: ${ex.name} ${index+1}`);
 }
 assert.deepEqual(routine[5][3].setPlan.map(row=>row.role),['heavy','heavy','heavy','light','light']);
 assert.equal(effectiveSetSuggestion(routine[5][3],24,3,[log(routine[5][3],0,{weight:24})]).weight,null);
 for(const day of [3,6])assert.equal(routine[day].find(ex=>ex.name==='Hack squat').loadType,'heavy');
});

test('Top + Back-off existe en presses y hack de ambos días, editable y desde Top real',()=>{
 const routine=createRoutinePlan(),press=routine[1][0];
 for(const [day,index,roles] of [[1,0,['top','backoff','backoff','backoff']],[1,1,['top','backoff']],[3,1,['top','backoff','backoff']],[5,0,['top','backoff','backoff']],[6,2,['top','backoff']]])assert.deepEqual(routine[day][index].setPlan.map(row=>row.role),roles);
 const ex={...press,increment:2.5},top=log(ex,0,{weight:120,setRole:'top'});
 assert.equal(effectiveSetSuggestion(ex,100,0,[]).weight,100);
 const backoff=effectiveSetSuggestion(ex,100,1,[top]);assert.equal(backoff.weight,107.5);assert.equal(backoff.referenceSource,'top-today');
 assert.equal(effectiveSetSuggestion({...ex,backoffPercent:20},100,1,[top]).weight,95);
 assert.equal(effectiveSetSuggestion(ex,100,2,[top,log(ex,1,{weight:80,setRole:'backoff'})]).weight,107.5);
 assert.equal(effectiveSetSuggestion(ex,null,0).weight,null);assert.equal(effectiveSetSuggestion(ex,null,0).referenceSource,'missing');
 assert.equal(effectiveSetSuggestion(ex,null,1,[top]).weight,107.5);
});

test('Back-off/Ligera se guardan separadas sin contaminar referencia usada por previas y extensiones',()=>{
 let state=initialState();const ex=state.routine[1][0];state.profiles[ex.profileId].workWeight=80;
 state=recordSet(state,ex,log(ex,0,{weight:100}));assert.equal(state.logs.at(-1).setRole,'top');assert.equal(state.logs.at(-1).setIndex,0);assert.equal(state.profiles[ex.profileId].workWeight,100);
 const before=preparationSuggestions(sessionExercise(state,ex,date),100);
 state=recordSet(state,ex,log(ex,1,{weight:90}));assert.equal(state.logs.at(-1).setRole,'backoff');assert.equal(state.profiles[ex.profileId].workWeight,100);
 assert.deepEqual(preparationSuggestions(sessionExercise(state,ex,date),state.profiles[ex.profileId].workWeight),before);
 const curl=state.routine[5][3];state.profiles[curl.profileId].workWeight=20;
 for(let index=0;index<3;index++)state=recordSet(state,curl,log(curl,index,{weight:24,date:'2026-11-07'}));
 state=recordSet(state,curl,log(curl,3,{weight:14,date:'2026-11-07'}));assert.equal(state.logs.at(-1).setRole,'light');assert.equal(state.profiles[curl.profileId].workWeight,24);
});

test('drop/RP solo en última efectiva, sin convertir cada caída/mini-serie en volumen',()=>{
 for(const exerciseIndex of [2,3]){
  let state=initialState();const ex=state.routine[1][exerciseIndex],kind=ex.technique;
  assert.ok(['drop','rp'].includes(kind));
  assert.deepEqual(ex.setPlan.map((_,index)=>effectiveSetPlan(ex,index).technique),Array.from({length:ex.sets},(_,index)=>index===ex.sets-1?kind:''));
  const first=log(ex,0);state=recordSet(state,ex,first);
  assert.ok(trainingLogError(state,ex,log(ex,0,{kind,parentId:first.id,step:1})),`${kind} no puede salir de primera serie`);
  for(let index=1;index<ex.sets;index++)state=recordSet(state,ex,log(ex,index));
  const parent=state.logs.filter(row=>row.kind==='effective').at(-1),extension=log(ex,ex.sets-1,{kind,parentId:parent.id,step:1,weight:kind==='drop'?80:100,reps:4});
  assert.equal(trainingLogError(state,ex,extension),null);state=recordSet(state,ex,extension);
  const volume=weeklyVolume(state,date).find(row=>row.muscle===ex.muscle);assert.equal(volume.done,ex.sets);assert.equal(state.logs.length,ex.sets+1);
 }
});

test('migración PPL idempotente conserva todos los campos históricos e instantánea íntegra',()=>{
 const original=legacyState();delete original.routineVersion;
 const ex=original.routine[0][0];original.logs=[log(ex,0,{date:'2026-10-12'})];original.journal['2026-10-12']={weight:70,sleepHours:8,pain:'Dato ficticio'};
 original.trainingDrafts={pending:{date:'2026-10-12',values:{weight:'82.5'}}};original.cardio=[{id:'cardio-ficticio',date:'2026-10-12',minutes:12}];original.monthlyReviews=[{id:'review-ficticio',month:'2026-10'}];
 const before=structuredClone(original),next=migrateRoutinePlan(original,'2026-11-01');
 assert.deepEqual(original,before);assert.deepEqual(next.routineMigrationBackups.at(-1).state,before);
 for(const key of Object.keys(before).filter(key=>!['routine','targets','profiles','routineVersion','routineMigrationBackups'].includes(key)))assert.deepEqual(next[key],before[key],key);
 for(const [id,profile] of Object.entries(before.profiles))assert.deepEqual(next.profiles[id],profile,id);
 assert.equal(migrateRoutinePlan(next),next);assert.equal(migrateState(next),next);
 next.routine[1][0].sets=2;assert.equal(migrateRoutinePlan(next),next);assert.equal(next.routine[1][0].sets,2);
});

test('reutilización segura de pesos; variantes, equipo distinto y coincidencias ambiguas quedan sin heredar',()=>{
 const old=legacyState();delete old.routineVersion;
 for(const profile of Object.values(old.profiles))profile.workWeight=77;
 const next=migrateRoutinePlan(old),find=name=>next.routine.flat().find(ex=>ex.name===name);
 assert.equal(find('Press banca').profileId,old.routine[0][0].profileId);assert.equal(next.profiles[find('Press banca').profileId].workWeight,77);
 assert.equal(find('Press inclinado mancuernas').profileId,old.routine[0][2].profileId);
 for(const name of ['Prensa unilateral','Femoral sentado','Femoral de pie','Hiperextensiones (glúteos)','Jalón al pecho','Dominadas','Deltoides posterior'])assert.equal(next.profiles[find(name).profileId].workWeight,null,name);
 assert.notEqual(find('Curl mancuerna').profileId,old.routine[0][7].profileId);
 const ambiguous=structuredClone(old),copy={...ambiguous.routine[0][0],id:'other',profileId:'other-profile'};ambiguous.routine[0].push(copy);ambiguous.profiles[copy.profileId]={workWeight:200};
 const resolved=migrateRoutinePlan(ambiguous),bench=resolved.routine[1][1];assert.equal(resolved.profiles[bench.profileId].workWeight,null);
 const wrongEquipment=structuredClone(old);wrongEquipment.routine[0][0].equipment='machine';assert.equal(migrateRoutinePlan(wrongEquipment).profiles[bench.profileId].workWeight,null);
});

test('nombres del calendario salen de PUSH/PULL/LEG A/TORSO/LEG B y descansos lunes/viernes',()=>{
 const state=initialState();assert.deepEqual(state.routine.filter(day=>day.length).map(day=>sessionName(day)),['PUSH','PULL','LEG A','TORSO','LEG B']);
 for(const day of state.routine.filter(day=>day.length))assert.equal(sessionTitle(day),sessionName(day));
 assert.equal(nextTraining(state,'2026-11-02').name,'PUSH');assert.match(restMessage(state,'2026-11-02','2026-11-02').text,/mañana \(martes\): PUSH/);
 assert.equal(nextTraining(state,'2026-11-06').name,'TORSO');assert.match(restMessage(state,'2026-11-06','2026-11-03').title,/Este día/);
 state.calendar['2026-11-03']={type:'rest',routineDay:1};assert.equal(nextTraining(state,'2026-11-02').name,'PULL');
});

test('dolor sigue asociado a femorales, gemelos y deltoides con los nombres nuevos',()=>{
 const state=initialState();state.journal[date]={painEntries:['hamstrings','calf','shoulder'].map(zone=>({zone,severity:7,sharp:false,joint:false,notes:'Ficticio',since:''}))};
 for(const [muscle,zone] of [['Femorales','hamstrings'],['Gemelos','calf'],['Deltoides laterales','shoulder'],['Deltoides posteriores','shoulder']]){
  const ex=state.routine.flat().find(ex=>ex.muscle===muscle);assert.ok(exerciseZones(ex).includes(zone));assert.ok(exercisePain(state,ex,date).some(row=>row.zone===zone));
 }
});

test('sesión antigua sin nombre en serie conserva nombre y sesión desde rutina archivada',()=>{
 const old=legacyState();delete old.routineVersion;const ex=old.routine[0][0];
 old.logs=[log(ex,0,{date:'2026-10-12'})];delete old.logs[0].exerciseName;
 old.sessionMeta={'2026-10-12':{notes:'Nota histórica ficticia',durationSeconds:1800}};
 const next=migrateRoutinePlan(old,'2026-11-01'),rows=projectCollections(next).sessions;
 const session=rows.find(row=>row.date==='2026-10-12');
 assert.equal(session.exercises[0].name,'Press banca');assert.equal(session.notes,'Nota histórica ficticia');assert.equal(session.durationSeconds,1800);
 assert.notEqual(session.routineTitle,'PUSH');assert.match(session.routineTitle,/Pecho/);
});

test('migración fecha activa: pasado conserva calendario, excepciones futuras requieren revisión sin perder sus valores',()=>{
 const old=legacyState();delete old.routineVersion;old.calendar={'2026-10-12':{type:'weights',routineDay:0,trainingTime:'17:00'},'2026-11-03':{type:'weights',routineDay:4,trainingTime:'19:00'}};
 const before=structuredClone(old),next=migrateRoutinePlan(old,'2026-11-01');
 assert.deepEqual(next.calendar['2026-10-12'],before.calendar['2026-10-12']);
 assert.deepEqual({...next.calendar['2026-11-03'],routineNeedsReview:undefined},{...before.calendar['2026-11-03'],routineNeedsReview:undefined});
 assert.equal(next.calendar['2026-11-03'].routineNeedsReview,true);assert.equal(dayContext(next,'2026-11-03').calendarNeedsReview,true);
 assert.equal(dayContext(next,'2026-11-03').exercises[0].routineSession,'PUSH');
 assert.equal(routineForDate(next,'2026-10-12')[0][0].name,'Press banca');assert.equal(dayContext(next,'2026-10-12').exercises[0].name,'Press banca');
 assert.deepEqual(old,before);assert.equal(migrateRoutinePlan(next,'2026-12-01'),next);
});

test('migración con gimnasio abierto hoy difiere nueva rutina hasta mañana sin perder selección ni borradores',()=>{
 const old=legacyState();delete old.routineVersion;const today='2026-11-03',ex=old.routine[1][0];
 old.gymSession={date:today,currentExerciseId:ex.id};old.sessionMeta={[today]:{startedAt:`${today}T18:00:00Z`,endedAt:null,durationSeconds:null,notes:'Ficticio'}};old.trainingDrafts={pending:{date:today,values:{weight:'65',reps:'7'}}};
 const before=structuredClone(old),next=migrateRoutinePlan(old,today);
 assert.equal(next.routineActivatedOn,'2026-11-04');assert.equal(next.routineActivationDeferred,true);
 assert.deepEqual(next.gymSession,before.gymSession);assert.deepEqual(next.sessionMeta,before.sessionMeta);assert.deepEqual(next.trainingDrafts,before.trainingDrafts);
 assert.equal(dayContext(next,today).exercises[0].id,ex.id);assert.equal(dayContext(next,'2026-11-04').exercises[0].routineSession,'PULL');
 assert.equal(migrateRoutinePlan(next,'2026-11-04'),next);
 const closed=structuredClone(old);closed.sessionMeta[today].endedAt=`${today}T19:00:00Z`;assert.equal(migrateRoutinePlan(closed,today).routineActivatedOn,today);
});

function backup(state){const collections=projectCollections(state),records=Object.fromEntries(BACKUP_STORES.map(key=>[key,[]]));const {sessions:ignored,...cache}=state;records.app=[{key:'state',value:{...cache,storageFormat:2}}];for(const [key,rows] of Object.entries(collections))records[key]=rows.map(value=>({key:value.id,value}));return JSON.parse(JSON.stringify({format:'olympia-friends-backup',formatVersion:1,databaseName:'olympia-friends',databaseVersion:2,records}));}
test('respaldo nuevo y snapshot conservan datos; rutina legacy inválida se rechaza antes de que la migración la reemplace',()=>{
 const old=legacyState();delete old.routineVersion;const file=backup(old);
 for(const patch of [{sets:0},{name:''}]){const copy=structuredClone(file);Object.assign(copy.records.app[0].value.routine[0][0],patch);assert.throws(()=>validateBackup(copy));}
 const state=migrateRoutinePlan(old,'2026-11-01');assert.doesNotThrow(()=>validateBackup(backup(state)));
 const initial=initialState(),bodyweight=initial.routine[1].find(ex=>ex.equipment==='bodyweight');initial.profiles[bodyweight.profileId].workWeight=0;assert.doesNotThrow(()=>validateBackup(backup(initial)));assert.equal(effectiveSetSuggestion(bodyweight,0).weight,0);
 for(const patch of [{routineVersion:'unknown-future-v99'},{routineActivatedOn:'2026-02-30'}]){const invalid=backup(state);Object.assign(invalid.records.app[0].value,patch);assert.throws(()=>validateBackup(invalid));}
});

test('recuperación interpreta nombres históricos de músculo sin reescribir series',()=>{
 const state=initialState(),ex=state.routine[1][0];
 for(const [oldName,newNames] of [['Femoral',['Femorales']],['Gemelo',['Gemelos']],['Aductor',['Aductores']],['Hombro',['Deltoides laterales','Deltoides posteriores']]]){
  state.logs=[log(ex,0,{date:'2026-11-02',muscle:oldName,performedAt:'2026-11-02T18:00:00Z'})];const before=structuredClone(state.logs);
  for(const muscle of newNames)assert.equal(muscleRecovery(state,muscle,date,new Date('2026-11-03T18:00:00Z')).warning,true,`${oldName} -> ${muscle}`);
  assert.deepEqual(state.logs,before);
 }
});
