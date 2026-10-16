import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {painEntriesFor,zoneStatus,exercisePain,needsFailureSafety,validatePainEntries,painHistory} from '../src/pain.js';
import {cardioRecommendation,cardioWeek,cardioSettings,saveCardioSettings,validateCardioSettings,completePlannedCardio} from '../src/program/cardio.js';
import {markCardio} from '../src/program/tracking.js';
import {generateSummary} from '../src/summaries.js';
import {BACKUP_STORES,validateBackup,combineStates} from '../src/backup.js';
import {projectCollections} from '../src/history.js';
function backupFixture(state){const rows=projectCollections(state),cache={...state,storageFormat:2};delete cache.sessions;const records=Object.fromEntries(BACKUP_STORES.map(key=>[key,[]]));records.app=[{key:'state',value:cache}];for(const [key,values] of Object.entries(rows))records[key]=values.map(value=>({key:value.id,value}));return JSON.parse(JSON.stringify({format:'heavy-duty-backup',formatVersion:1,databaseVersion:2,databaseName:'heavy-duty-personal',records}));}
const pain=(zone='shoulder',severity=6,patch={})=>({id:crypto.randomUUID(),zone,severity,sharp:false,joint:false,notes:'Dato ficticio',since:'',...patch});
function fixture(kind='bulk'){const state=initialState();state.phases=[{id:'phase-test',kind,startDate:'2026-10-01',deadline:'2027-03-31',targetWeight:74}];state.journal={};return state;}
test('dolor antiguo conserva texto; reconoce solo intensidad explícita y no mezcla zonas ni niega recuperación',()=>{
 const entry={pain:'Hombro derecho 7/10 articular; rodilla 2/10. Sin dolor lumbar'},copy=structuredClone(entry),rows=painEntriesFor(entry);assert.equal(rows.find(row=>row.zone==='shoulder').severity,7);assert.equal(rows.find(row=>row.zone==='knee').severity,2);assert.ok(!rows.some(row=>row.zone==='lowerBack'));assert.deepEqual(entry,copy);
 assert.equal(painEntriesFor({pain:'Hombro cargado'})[0].severity,null);assert.deepEqual(painEntriesFor({pain:'hombro 7/10 y rodilla 2/10'}),[]);
 assert.equal(painEntriesFor({...entry,painEntries:[pain('shoulder',0)]}).find(row=>row.zone==='shoulder').severity,0);
});
test('6/10 avisa solo en ejercicios con esa carga; 5/10 sin repetición no crea aviso',()=>{
 const state=fixture();state.journal['2026-10-12']={painEntries:[pain()]};const press=state.routine[0][0],hack=state.routine[4][1];assert.equal(exercisePain(state,press,'2026-10-12').length,1);assert.equal(exercisePain(state,hack,'2026-10-12').length,0);state.journal['2026-10-12'].painEntries[0].severity=5;assert.equal(exercisePain(state,press,'2026-10-12').length,0);assert.equal(exercisePain(state,press,'2026-10-11').length,0);
});
test('repetición usa tres sesiones registradas distintas, no tres series ni días sin datos',()=>{
 const state=fixture(),dates=['2026-10-05','2026-10-08','2026-10-12'];for(const date of dates){state.logs.push({date},{date});state.journal[date]={painEntries:[pain('elbow',3)]};}assert.equal(zoneStatus(state,'elbow','2026-10-12').repeated,true);delete state.journal[dates[1]];assert.equal(zoneStatus(state,'elbow','2026-10-12').repeated,false);state.journal[dates[1]]={painEntries:[pain('elbow',3)]};state.journal['2026-10-13']={painEntries:[pain('elbow',0)]};assert.equal(zoneStatus(state,'elbow','2026-10-13'),null);
});
test('punzante/articular y más de 14 días aconsejan consulta; sin convertir datos antiguos en dolor actual',()=>{
 const state=fixture();state.journal['2026-10-15']={painEntries:[pain('knee',2,{since:'2026-10-01'})]};assert.equal(zoneStatus(state,'knee','2026-10-15').professional,false);state.journal['2026-10-16']={painEntries:[pain('knee',2,{since:'2026-10-01'})]};assert.equal(zoneStatus(state,'knee','2026-10-16').persistent,true);assert.equal(zoneStatus(state,'knee','2026-11-01').stale,true);
 state.journal['2026-11-02']={painEntries:[pain('knee',0)]};assert.equal(zoneStatus(state,'knee','2026-11-02'),null);for(const flag of ['sharp','joint']){state.journal['2026-11-03']={painEntries:[pain('knee',1,{[flag]:true})]};assert.equal(zoneStatus(state,'knee','2026-11-03').professional,true);}
});
test('valida dolor por zona, escala, duplicados y fecha; historial no muta originales',()=>{
 const state=fixture(),row=pain();state.journal['2026-10-12']={pain:'Texto original',painEntries:[row]};const copy=structuredClone(state);assert.equal(validatePainEntries([row],'2026-10-12'),null);for(const rows of [[row,row],[{...row,severity:11}],[{...row,severity:''}],[{...row,since:'2026-10-13'}],[{...row,zone:'inventado'}]])assert.ok(validatePainEntries(rows,'2026-10-12'));assert.equal(painHistory(state).length,1);assert.deepEqual(state,copy);
});
test('seguridad de todos los pesados de barra/mancuernas y hack/prensa, sin confundir jalones o aislamientos',()=>{
 const state=fixture(),rows=state.routine.flat();for(const name of ['Press banca','Press declinado','Press inclinado mancuernas','Press militar mancuernas','Remo barra libre','Hack squat','Prensa'])assert.equal(needsFailureSafety(rows.find(ex=>ex.name===name)),true,name);for(const name of ['Remo pecho apoyado','Jalón agarre estrecho','Ext. cuádriceps','Gemelos prensa'])assert.equal(needsFailureSafety(rows.find(ex=>ex.name===name)),false,name);
});
test('minutos exactos por fase y cada día, pierna opcional y descanso explícito',()=>{
 for(const [kind,expected,total] of [['bulk',[12,12,0,12,0,12,0],48],['cut',[25,25,0,25,0,25,25],125],['maintain',[15,0,0,15,0,15,0],45]]){const state=fixture(kind),week=cardioWeek(state,'2026-10-12');assert.deepEqual(week.rows.map(row=>row.recommended),expected,kind);assert.equal(week.recommended,total);assert.equal(week.minutes,0);assert.equal(week.rows[4].recommendation.optional,true);assert.deepEqual(week.rows[4].recommendation.optionalMinutes,[5,10]);assert.equal(week.rows[6].recommendation.afterWeights,false);}
});
test('cardio sigue rutina movida por calendario y la excepción de descanso real; no compensa omisiones',()=>{
 let state=fixture();state.calendar['2026-10-12']={type:'rest',routineDay:0};state.calendar['2026-10-14']={type:'weights',routineDay:0};assert.equal(cardioRecommendation(state,'2026-10-14').minutes,12);assert.equal(cardioRecommendation(state,'2026-10-12').minutes,0);
 const before=cardioRecommendation(state,'2026-10-13').minutes;state=markCardio(state,'2026-10-12','omitted',cardioRecommendation(state,'2026-10-12'));assert.equal(cardioRecommendation(state,'2026-10-13').minutes,before);
 state=fixture('cut');state.calendar['2026-10-18']={type:'legs',routineDay:4};assert.equal(cardioRecommendation(state,'2026-10-18').minutes,0);assert.equal(cardioRecommendation(state,'2026-10-14').minutes,25);
});
test('solo dos días seguidos de fatiga alta o sueño bajo reducen exactamente a la mitad, sin ceros inventados',()=>{
 const state=fixture('cut');state.journal['2026-10-12']={fatigue:9};assert.equal(cardioRecommendation(state,'2026-10-12').minutes,25);state.journal['2026-10-11']={fatigue:8};assert.equal(cardioRecommendation(state,'2026-10-12').minutes,12.5);state.journal['2026-10-11']={sleepHours:6};assert.equal(cardioRecommendation(state,'2026-10-12').reduce,true);state.journal['2026-10-12']={sleepHours:6.9};assert.match(cardioRecommendation(state,'2026-10-12').recoveryReason,/Sueño/);state.journal['2026-10-11']={sleepHours:null};assert.equal(cardioRecommendation(state,'2026-10-12').reduce,false);
});
test('ajustes manuales de días/minutos/pulsaciones respetan historia y rangos',()=>{
 let state=fixture(),settings=structuredClone(cardioSettings(state,'2026-10-12'));settings.phases.bulk.minutes=15;settings.phases.bulk.days=[1];settings.showHeartRate=true;settings.age=23;state=saveCardioSettings(state,settings,'2026-10-15','2026-10-15T15:00:00Z');assert.equal(cardioRecommendation(state,'2026-10-12').minutes,12);assert.equal(cardioRecommendation(state,'2026-10-15').minutes,0);assert.equal(cardioRecommendation(state,'2026-10-20').minutes,15);assert.deepEqual(cardioRecommendation(state,'2026-10-20').heartRate,[118,138]);settings.phases.bulk.minutes=99;assert.ok(validateCardioSettings(settings));
});
test('Hecho y editar no duplican, guardan instantánea, conservan cardio antiguo y resumen diario/semanal',()=>{
 let state=fixture();state.cardio=[{id:'old',date:'2026-10-05',type:'Bici',minutes:17,intensity:'Moderada',recommendation:{min:10,max:15}}];const old=structuredClone(state.cardio[0]);state=completePlannedCardio(state,'2026-10-12',12);state=completePlannedCardio(state,'2026-10-12',10.5);assert.equal(state.cardio.length,2);assert.equal(cardioWeek(state,'2026-10-12').minutes,10.5);assert.equal(cardioWeek(state,'2026-10-12').recommended,48);assert.deepEqual(state.cardio[0],old);state.routine[0]=[];assert.equal(cardioRecommendation(state,'2026-10-12').minutes,12);const text=generateSummary(state,'weekly','2026-10-18');assert.match(text,/10.5 \/ 48 min/);assert.match(text,/2026-10-12: cardio 10.5 \/ 12 min/);assert.throws(()=>completePlannedCardio(state,'2026-10-13',0));
});
test('estancamiento solo sugiere, con 14 días de datos; sumar minutos exige confirmación explícita',()=>{
 let state=fixture('cut');for(let day=1;day<=14;day++)state.journal[`2026-10-${String(day).padStart(2,'0')}`]={weight:70};assert.equal(cardioRecommendation(state,'2026-10-13').plateau,false);assert.equal(cardioRecommendation(state,'2026-10-14').plateau,true);assert.equal(cardioRecommendation(state,'2026-10-15').minutes,25);const settings=structuredClone(cardioSettings(state,'2026-10-15'));settings.phases.cut.extraMinutes=5;state=saveCardioSettings(state,settings,'2026-10-15');assert.equal(cardioRecommendation(state,'2026-10-15').minutes,30);
});
test('respaldo valida nuevos datos; combinar mantiene un registro por zona y enlaza seguridad sin perder origen',()=>{
 const current=fixture(),incoming=fixture();current.journal['2026-10-12']={pain:'Texto conservado',painEntries:[pain('shoulder',0)]};incoming.journal['2026-10-12']={pain:'Otro original archivado',painEntries:[pain('shoulder',8),pain('knee',6)]};incoming.safetySettings={hidden:{[incoming.routine[0][0].id]:true}};const settings=structuredClone(cardioSettings(incoming,'2026-10-12'));const source=saveCardioSettings(incoming,settings,'2026-10-12');const file=backupFixture(source);assert.doesNotThrow(()=>validateBackup(file));const merged=combineStates(validateBackup(backupFixture(current)).state,validateBackup(file).state);assert.equal(merged.journal['2026-10-12'].painEntries.length,2);assert.equal(merged.journal['2026-10-12'].painEntries.find(row=>row.zone==='shoulder').severity,0);assert.equal(merged.safetySettings.hidden[current.routine[0][0].id],true);assert.doesNotThrow(()=>validateBackup(backupFixture(merged)));file.records.app[0].value.journal['2026-10-12'].painEntries[0].severity=99;assert.throws(()=>validateBackup(file));
});
