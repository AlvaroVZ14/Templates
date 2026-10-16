import {dayContext} from './program/nutrition.js';
import {phaseForDate} from './program/phases.js';

// Original copy for this app. These are prompts, never attributed quotations.
export const MOTIVATION_CONTEXTS = Object.freeze({
  general:'Cualquier día', rest:'Descanso', bulk:'Volumen', cut:'Mini cut', maintain:'Mantención',
  Pecho:'Pecho', Espalda:'Espalda', Hombro:'Hombro', Bíceps:'Bíceps', Tríceps:'Tríceps',
  Cuádriceps:'Cuádriceps', Femoral:'Femoral', Aductor:'Aductor', Gemelo:'Gemelo',
});

export const DEFAULT_MOTIVATION = Object.freeze([
  ['general','Menos ruido. Más hierro bajo control.'],
  ['general','Las excusas no mueven la barra.'],
  ['general','Entra decidido. Ejecuta. Registra.'],
  ['general','Baja lento. Sube con intención.'],
  ['general','La técnica manda. El ego fuera.'],
  ['general','Pocas series. Ninguna de adorno.'],
  ['rest','Descansa. Recupera. Vuelve preparado.'],
  ['rest','Hoy se recupera. Cumple sin inventar más trabajo.'],
  ['rest','Respeta el descanso con la misma seriedad que la barra.'],
  ['rest','El hierro espera. Tu recuperación manda hoy.'],
  ['rest','Duerme. Come. Recupera. Ese es el trabajo.'],
  ['bulk','Construye. Repite. Gánate la próxima carga.'],
  ['bulk','Volumen con un plan. Hierro con intención.'],
  ['bulk','Come según el plan. En la serie, atención total.'],
  ['cut','Déficit con cabeza. Hierro con control.'],
  ['cut','Mini cut: precisión, no castigo.'],
  ['cut','Defiende tu técnica. Registra tu fuerza.'],
  ['maintain','Mantén el rumbo. Cero semanas de adorno.'],
  ['maintain','Lo ganado se defiende con trabajo bien hecho.'],
  ['maintain','No cambies por aburrimiento. Cumple el plan.'],
  ['Pecho','Pecho al trabajo. Cada press cuenta.'],
  ['Espalda','Tira con la espalda. El impulso fuera.'],
  ['Hombro','Hombros firmes. Recorrido limpio. Cero balanceo.'],
  ['Bíceps','Dobla el codo. No negocies con el balanceo.'],
  ['Tríceps','Extiende con intención. Domina la vuelta.'],
  ['Cuádriceps','Piernas al trabajo. Control antes que ego.'],
  ['Femoral','Domina la bajada. Haz trabajar el femoral.'],
  ['Aductor','Sin atajos. Haz contar todo el recorrido.'],
  ['Gemelo','Gemelos con recorrido. Cero rebotes vacíos.'],
  ['Espalda','La espalda mueve. Las manos sujetan.'],
].map(([context,text],index)=>Object.freeze({id:`original-${index+1}`,context,text})));

const validContext = context => Object.hasOwn(MOTIVATION_CONTEXTS,context);

export function validateMotivation(phrases) {
  if(!Array.isArray(phrases))return 'El banco de frases debe ser una lista.';
  const ids=new Set();
  for(const phrase of phrases){
    if(!phrase||typeof phrase.id!=='string'||!phrase.id.trim()||phrase.id.length>100||ids.has(phrase.id))return 'Cada frase necesita un identificador único.';
    ids.add(phrase.id);
    if(typeof phrase.text!=='string'||!phrase.text.trim()||phrase.text.trim().length>160)return 'Escribe cada frase con entre 1 y 160 caracteres.';
    if(!validContext(phrase.context))return 'Elige un contexto válido para cada frase.';
  }
  return null;
}

export function motivationPhrases(data) {
  const saved=data?.motivationSettings?.phrases;
  const phrases=validateMotivation(saved)===null?saved:DEFAULT_MOTIVATION;
  return phrases.map(phrase=>({...phrase,text:phrase.text.trim()}));
}

function dateSeed(date) {
  // A string hash stays independent of locale, time zone and device clock.
  let value=2166136261;
  for(const character of String(date)){value^=character.charCodeAt(0);value=Math.imul(value,16777619);}
  return value>>>0;
}

export function selectMotivation(data,date) {
  const day=dayContext(data,date),phase=phaseForDate(data,date);
  const muscles=[...new Set(day.exercises.map(exercise=>exercise.muscle))];
  const resting=day.type==='rest'||day.exercises.length===0;
  const bank=motivationPhrases(data);
  const matching=context=>bank.filter(phrase=>phrase.context===context);
  const musclePhrases=bank.filter(phrase=>muscles.includes(phrase.context));
  const phasePhrases=matching(phase?.kind);
  const seed=dateSeed(`${date}|${phase?.kind??'no-phase'}`);
  const dayNumber=Math.floor(Date.parse(`${date}T12:00:00Z`)/86400000);
  const phaseTurn=(dayNumber+dateSeed(phase?.kind??'no-phase')%3)%3===0;
  // Include phase copy regularly, even when the default routine has muscle copy
  // for every training day. Both selection and rotation remain date-stable.
  const trainingPriorities=phaseTurn?[phasePhrases,musclePhrases]:[musclePhrases,phasePhrases];
  // A rest override always wins over muscles or phase-specific training copy.
  const priorities=resting
    ? [matching('rest'),matching('general')]
    : [...trainingPriorities,matching('general')];
  const candidates=priorities.find(phrases=>phrases.length)??[];
  const phrase=candidates.length?candidates[dateSeed(`${seed}|phrase`)%candidates.length]:{id:'empty-bank',context:'general',text:'Hoy también cuenta. Respeta tu plan.'};
  const sessionLabel=resting?'Descanso':muscles.length?muscles.join(' / '):'Entrenamiento';
  const phaseLabel=MOTIVATION_CONTEXTS[phase?.kind]??null;
  return {...phrase,date,resting,muscles,phase:phase?.kind??null,label:[sessionLabel,phaseLabel].filter(Boolean).join(' · ')};
}

export function saveMotivation(data,phrases) {
  const error=validateMotivation(phrases);
  if(error)throw new Error(error);
  return {...data,motivationSettings:{...data.motivationSettings,phrases:phrases.map(phrase=>({...phrase,text:phrase.text.trim()}))}};
}
