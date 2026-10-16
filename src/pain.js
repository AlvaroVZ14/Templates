import {validDate} from './wellness.js';
import {daysBetween} from './program/phases.js';
import {classifyExercise} from './classification.js';

export const PAIN_ZONES={shoulder:'Hombro',elbow:'Codo',wrist:'Muñeca',neck:'Cuello',chest:'Pecho',upperBack:'Espalda alta',lowerBack:'Zona lumbar',hip:'Cadera',knee:'Rodilla',ankle:'Tobillo',biceps:'Bíceps',triceps:'Tríceps',quads:'Cuádriceps',hamstrings:'Femoral',calf:'Gemelo',adductor:'Aductor'};
const plain=text=>String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const aliases={shoulder:/\bhombros?\b/,elbow:/\bcodos?\b/,wrist:/\bmunecas?\b/,neck:/\bcuello\b|\bcervical/,chest:/\bpecho\b|\bpectoral/,upperBack:/\bespalda alta\b|\bdorsal/,lowerBack:/\blumbar|\bespalda baja/,hip:/\bcaderas?\b/,knee:/\brodillas?\b/,ankle:/\btobillos?\b/,biceps:/\bbiceps\b/,triceps:/\btriceps\b/,quads:/\bcuadriceps\b/,hamstrings:/\bfemoral|\bisquiotibial/,calf:/\bgemelos?\b|\bpantorrilla|\bsoleo/,adductor:/\baductor/};
export function validatePainEntries(entries,date){
  if(!Array.isArray(entries)||entries.length>30)return 'Registra hasta 30 zonas por día.';
  const zones=new Set();
  for(const row of entries){
    if(!row||!Object.hasOwn(PAIN_ZONES,row.zone)||zones.has(row.zone))return 'Elige una zona distinta para cada registro.';zones.add(row.zone);
    if(!Number.isInteger(row.severity)||row.severity<0||row.severity>10)return 'Indica dolor de 0 a 10; 0 significa sin dolor en esa zona.';
    if(typeof row.sharp!=='boolean'||typeof row.joint!=='boolean'||typeof row.notes!=='string'||row.notes.length>1000)return 'Revisa la descripción del dolor.';
    if(row.since&&(!validDate(row.since)||row.since>date))return 'La fecha de inicio del dolor no puede ser posterior al registro.';
  }
  return null;
}
// Legacy text stays untouched. Only explicit zones and scores/qualities are read;
// an unscored note never becomes an invented numerical severity.
export function painEntriesFor(entry){
  const rows=(entry?.painEntries??[]).map(row=>({...row,legacy:false})),known=new Set(rows.map(row=>row.zone));
  for(const clause of String(entry?.pain??'').split(/[;\n.!]+/)){
    const text=plain(clause);if(/\bsin (dolor|molestia)|\bno (me )?duele|\bsin molestias/.test(text))continue;
    const matches=Object.entries(aliases).filter(([,pattern])=>pattern.test(text));
    // Mixed zones in one sentence are ambiguous: keep the original text and ask
    // for structured entries instead of assigning one area's score to another.
    if(matches.length!==1)continue;
    const score=/\b(10|[0-9])\s*\/\s*10\b/.exec(text),sharp=/punzant|pinchazo/.test(text),joint=/articular|articulacion/.test(text),zone=matches[0][0];
    if(!known.has(zone)){rows.push({zone,severity:score?Number(score[1]):null,sharp,joint,notes:clause.trim(),since:'',legacy:true});known.add(zone);}
  }
  return rows;
}
export function painHistory(state,asOf='9999-12-31'){
  return Object.entries(state.journal??{}).filter(([date])=>date<=asOf).flatMap(([date,entry])=>painEntriesFor(entry).map(row=>({...row,date}))).sort((a,b)=>a.date.localeCompare(b.date));
}
function painContext(state,date){return {history:painHistory(state,date),trainingDates:[...new Set([...state.logs.filter(log=>log.date<=date).map(log=>log.date),...Object.entries(state.sessionMeta??{}).filter(([day,meta])=>day<=date&&meta.startedAt).map(([day])=>day)])].sort().slice(-3)};}
export function zoneStatus(state,zone,date,context=painContext(state,date)){
  const history=context.history.filter(row=>row.zone===zone),latest=history.at(-1);
  if(!latest||latest.severity===0)return null;
  const reset=history.findLastIndex(row=>row.severity===0),episode=history.slice(reset+1),first=episode[0];
  const trainingDates=context.trainingDates;
  const repeated=trainingDates.length===3&&trainingDates.every(day=>history.some(row=>row.date===day&&row.severity!==0));
  const since=latest.since||first.date,persistent=daysBetween(since,latest.date)>14;
  const professional=latest.sharp||latest.joint||persistent;
  return {zone,latest,repeated,persistent,professional,since,stale:daysBetween(latest.date,date)>7,alert:latest.severity>=6||repeated||professional};
}
export function exerciseZones(ex){
  const groups={Pecho:['chest','shoulder','elbow'],Espalda:['upperBack','shoulder','elbow'],Hombro:['shoulder','neck','elbow'],'Bíceps':['biceps','elbow','wrist'],'Tríceps':['triceps','elbow'], 'Cuádriceps':['quads','knee'],Femoral:['hamstrings','knee'],Gemelo:['calf','ankle'],Aductor:['adductor','hip']};
  const zones=new Set(groups[ex.muscle]??[]),{movementPattern}=classifyExercise(ex);
  if(movementPattern==='row'&&ex.equipment==='barbell')zones.add('lowerBack');
  if(['knee-press','hip-extension'].includes(movementPattern)){zones.add('hip');zones.add('lowerBack');}
  if(/tras nuca/.test(plain(ex.name)))zones.add('shoulder');
  if(['barbell','dumbbell','cable'].includes(ex.equipment)&&['Pecho','Espalda','Hombro'].includes(ex.muscle))zones.add('wrist');
  return [...zones];
}
export function painStatuses(state,date){const context=painContext(state,date);return Object.keys(PAIN_ZONES).map(zone=>zoneStatus(state,zone,date,context)).filter(Boolean);}
export function exercisePain(state,ex,date){const context=painContext(state,date);return exerciseZones(ex).map(zone=>zoneStatus(state,zone,date,context)).filter(row=>row?.alert);}
export function needsFailureSafety(ex){const {loadType,movementPattern}=classifyExercise(ex);return loadType==='heavy'&&(movementPattern==='knee-press'||['barbell','dumbbell'].includes(ex.equipment)&&['chest-press','overhead-press','row'].includes(movementPattern));}
