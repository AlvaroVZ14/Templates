import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {DEFAULT_MOTIVATION,motivationPhrases,saveMotivation,selectMotivation,validateMotivation} from '../src/motivation.js';

test('un banco combinado grande conserva todas las frases y permite editarlas',()=>{
  const state=initialState(),phrases=Array.from({length:250},(_,index)=>({id:`combined-${index}`,text:`Mi frase original ${index}.`,context:'general'}));
  const merged=saveMotivation(state,phrases);assert.equal(motivationPhrases(merged).length,250);
  assert.equal(motivationPhrases(merged).at(-1).text,'Mi frase original 249.');assert.match(selectMotivation(merged,'2026-10-12').id,/^combined-/);
  assert.equal(saveMotivation(merged,phrases.map((phrase,index)=>index===249?{...phrase,text:'Última frase editada.'}:phrase)).motivationSettings.phrases.at(-1).text,'Última frase editada.');
});

test('30 originales distintas, válidas, sin modificar el estado al leer',()=>{
  const state=initialState(),before=structuredClone(state);
  assert.equal(DEFAULT_MOTIVATION.length,30);
  assert.equal(new Set(DEFAULT_MOTIVATION.map(phrase=>phrase.text)).size,30);
  assert.equal(validateMotivation(DEFAULT_MOTIVATION),null);
  const bank=motivationPhrases(state);bank[0].text='Cambio solo en la copia';
  assert.notEqual(DEFAULT_MOTIVATION[0].text,bank[0].text);
  selectMotivation(state,'2026-10-12');assert.deepEqual(state,before);
});

test('la misma fecha y contexto conservan selección entre lecturas y copias',()=>{
  const state=initialState(),first=selectMotivation(state,'2026-10-12');
  for(let index=0;index<5;index++)assert.deepEqual(selectMotivation(structuredClone(state),'2026-10-12'),first);
  const choices=new Set(Array.from({length:28},(_,index)=>selectMotivation(state,`2026-10-${String(index+1).padStart(2,'0')}`).id));
  assert.ok(choices.size>5);
});

test('descanso prevalece sobre fase y un calendario corregido usa músculos reales',()=>{
  const state=initialState();
  const rest=selectMotivation(state,'2026-10-14');assert.equal(rest.resting,true);assert.equal(rest.context,'rest');assert.match(rest.label,/Descanso/);
  state.calendar['2026-10-12']={type:'rest',routineDay:0,trainingTime:'18:00'};
  assert.equal(selectMotivation(state,'2026-10-12').context,'rest');
  state.calendar['2026-10-14']={type:'weights',routineDay:4,trainingTime:'18:00'};
  const legs=selectMotivation(state,'2026-10-14');assert.equal(legs.resting,false);assert.ok(legs.muscles.includes('Cuádriceps'));assert.ok(legs.muscles.includes(legs.context));assert.doesNotMatch(legs.label,/Descanso/);
});

test('alterna músculo y fase con la rutina real, y consulta la fase histórica de la fecha',()=>{
  let state=initialState();
  state.phases=[{id:'bulk',kind:'bulk',startDate:'2026-01-01',actualEnd:'2026-10-31'},{id:'cut',kind:'cut',startDate:'2026-11-01',actualEnd:'2026-11-30'},{id:'maintain',kind:'maintain',startDate:'2026-12-01'}];
  const phrases=[{id:'g',text:'General.',context:'general'},{id:'b',text:'Volumen.',context:'bulk'},{id:'c',text:'Mini cut.',context:'cut'},{id:'m',text:'Mantención.',context:'maintain'},{id:'p',text:'Pecho.',context:'Pecho'}];
  state=saveMotivation(state,phrases);
  // Use chest-only Mondays so the two possible contexts are unambiguous.
  const contexts=new Set();
  for(const date of ['2026-10-05','2026-10-12','2026-10-19','2026-10-26']){
    const selected=selectMotivation(state,date);contexts.add(selected.context);
    assert.ok(['Pecho','bulk'].includes(selected.context));assert.equal(selected.phase,'bulk');
    assert.deepEqual(selectMotivation(structuredClone(state),date),selected);
  }
  assert.deepEqual(contexts,new Set(['Pecho','bulk']));
  state=saveMotivation(state,phrases.filter(phrase=>phrase.id!=='p'));
  assert.equal(selectMotivation(state,'2026-10-12').id,'b');
  assert.equal(selectMotivation(state,'2026-11-02').id,'c');
  assert.equal(selectMotivation(state,'2026-12-07').id,'m');
});

test('sin frases de descanso usa general, banco vacío tiene fallback seguro y sin datos usa originales',()=>{
  let state=initialState();state=saveMotivation(state,[{id:'bulk-only',text:'Volumen.',context:'bulk'},{id:'generic',text:'Respeta tu plan.',context:'general'}]);
  assert.equal(selectMotivation(state,'2026-10-14').id,'generic');
  state=saveMotivation(state,[]);assert.equal(selectMotivation(state,'2026-10-12').id,'empty-bank');assert.equal(motivationPhrases(state).length,0);
  state.motivationSettings={phrases:[{broken:true}]};assert.equal(motivationPhrases(state).length,30);
});

test('guardar banco solo añade configuración, conserva demás datos y valida antes de cambiar',()=>{
  const state=initialState(),before=structuredClone(state);
  const next=saveMotivation(state,[{id:'own',context:'general',text:'  Trabajo bajo control.  '}]);
  assert.deepEqual(state,before);assert.deepEqual({...next,motivationSettings:undefined},{...state,motivationSettings:undefined});assert.equal(next.motivationSettings.phrases[0].text,'Trabajo bajo control.');
  for(const invalid of [[{id:'a',context:'general',text:''}],[{id:'a',context:'invalid',text:'Frase'}],[{id:'a',context:'general',text:'x'.repeat(161)}],[{id:'a',context:'general',text:'Una'},{id:'a',context:'rest',text:'Otra'}]])assert.throws(()=>saveMotivation(state,invalid));
  assert.deepEqual(state,before);
});
