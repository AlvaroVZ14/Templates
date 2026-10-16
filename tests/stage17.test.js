import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,migrateState,preparationSuggestions} from '../src/domain.js';
import {contextualPreparation,setPreparationCount} from '../src/preparation.js';
import {sessionExercise} from '../src/training.js';
import {classifyExercise} from '../src/classification.js';
import {confirmTargets,consumePlan,dailyTotals,foodItem,generatePlan,savePlan,setFruitConsumed,suggestedTargets,validateFood} from '../src/program/nutrition.js';
import {createParticles} from '../src/particles.js';
const date='2026-10-16';
function nutrition(kind='bulk'){let state=initialState();state.phases[0].kind=kind;state.phases[0].startDate='2026-10-01';state.journal[date]={weight:70};return confirmTargets(state,{...suggestedTargets(state,date,2200),baseIntake:2200,restReduction:0,snackBudget:.2},date);}

test('todos los días: tipo independiente del equipo y mínimos, incluso tras aislamientos',()=>{
  const state=initialState(),expected=[[2,1,1,1,0,2,2,0],[2,0,2,2,2,1,2],[],[2,1,2,2,0,0,0],[2,2,1,2,2,1,2],[2,2,2,1,2,2,2],[]];
  for(const [day,list] of state.routine.entries()){
    assert.deepEqual(list.map(ex=>contextualPreparation(ex,list).approaches),expected[day]);
    for(const ex of list){const alone=contextualPreparation(ex,list,0,new Set());if(ex.loadType==='heavy')assert.ok(alone.approaches>=2,ex.name);if(ex.loadType==='compound')assert.ok(alone.approaches>=1,ex.name);assert.ok(ex.equipment);}
  }
  const hack=state.routine[4][1],press=state.routine[4][2];assert.equal(hack.equipment,'machine');assert.equal(hack.loadType,'heavy');
  assert.equal(contextualPreparation({...hack,equipment:'cable'},state.routine[4],0,new Set()).approaches,2);
  assert.equal(sessionExercise(state,press,date).approaches,2);
  state.logs.push({date,exerciseId:hack.id,kind:'effective'});
  const prepared=sessionExercise(state,press,date);assert.equal(prepared.approaches,1);assert.deepEqual(preparationSuggestions(prepared,100).map(s=>[s.weight,s.reps]),[[60,6]]);
  assert.equal(sessionExercise(state,press,'2026-10-23').approaches,2);
  state.logs[0].kind='approach';assert.equal(sessionExercise(state,press,date).approaches,2);
  state.logs=[{date,exerciseId:press.id,kind:'effective'}];assert.equal(sessionExercise(state,hack,date).approaches,1);
  assert.equal(classifyExercise(state.routine[4][5]).loadType,'compound');
});
test('patrones distintos y articulaciones distintas no reducen el mínimo pesado; manual cero advierte',()=>{
  let state=initialState();const list=state.routine[1],row=list[3],pull=list[4];state.logs.push({date:'2026-10-13',exerciseId:row.id,kind:'effective'});
  assert.equal(sessionExercise(state,pull,'2026-10-13').approaches,2);
  state=setPreparationCount(state,row.id,0);state.preparationSettings.minimum=1;
  assert.equal(sessionExercise(state,row,'2026-10-13').approaches,0);assert.equal(sessionExercise(state,row,'2026-10-13').preparationWarning,'Compuesto pesado sin calentar');
  state=setPreparationCount(state,row.id,null);assert.equal(sessionExercise(state,row,'2026-10-13').approaches,2);
  state=setPreparationCount(state,list[1].id,0);assert.equal(sessionExercise(state,list[1],'2026-10-13').approaches,1);
  const first={...row,preparationJoint:'A'},next={...row,id:'next',preparationJoint:'B'};assert.equal(contextualPreparation(next,[first,next]).approaches,2);
});
test('migración aditiva e idempotente conserva registros, planes, alimentos editados y elección manual',()=>{
  let state=nutrition();state.programSettings.appleCount=0;state=savePlan(state,date);state=consumePlan(state,date,1,true);delete state.classificationVersion;delete state.fruitVersion;delete state.programSettings.appleCount;state.foods=state.foods.filter(f=>f.id!=='apple');
  for(const ex of state.routine.flat()){delete ex.loadType;delete ex.movementPattern;}
  state.routine[4][1].preparationOverride=0;state.foods[0].kcal=199;
  const before=structuredClone(state),next=migrateState(state);
  for(const key of ['logs','foodLogs','mealPlans','planHistory','journal','measurements','phases','profiles'])assert.deepEqual(next[key],before[key]);
  assert.deepEqual(next.foods.slice(0,-1),before.foods);assert.equal(next.foods.at(-1).id,'apple');assert.equal(next.programSettings.appleCount,1);assert.equal(next.routine[4][1].preparationOverride,0);assert.equal(migrateState(next),next);assert.deepEqual(state,before);
});
test('manzanas 0–2, fuera de snacks, en preentreno; descanso en desayuno, sin otros alimentos',()=>{
  const state=nutrition();state.planOptions[date]={snacks:['cookie']};
  for(const count of [0,1,2]){state.programSettings.appleCount=count;const plan=generatePlan(state,date),items=plan.meals.flatMap(m=>m.items),apples=items.filter(i=>i.food.id==='apple');
    assert.equal(apples.reduce((n,i)=>n+i.quantity,0),count);assert.equal(plan.snackKcal,35);assert.equal(plan.snackCap,plan.target.kcal*.2);assert.ok(items.every(i=>state.foods.some(f=>f.id===i.food.id)));
    assert.equal(plan.meals[1].items.find(i=>i.food.id==='apple')?.quantity??0,count);for(const key of ['kcal','protein','carbs','fat'])assert.ok(Math.abs(items.reduce((n,i)=>n+i.macros[key],0)-plan.total[key])<1e-6);
  }
  state.calendar[date]={type:'rest',routineDay:4,trainingTime:'18:00'};assert.equal(generatePlan(state,date).meals[0].items.find(i=>i.food.id==='apple').quantity,2);
  const cut=nutrition('cut');cut.planOptions[date]={snacks:['empanada']};const cutPlan=generatePlan(cut,date);
  assert.equal(cutPlan.snackCap,cutPlan.target.kcal*.1);assert.equal(cutPlan.snackKcal,0);assert.equal(cutPlan.snackWarning,true);assert.equal(cutPlan.appleCount,1);
});
test('casilla registra sin duplicar al marcar comida; editar manzana no modifica sus snapshots',()=>{
  let state=savePlan(nutrition(),date),plan=structuredClone(state.mealPlans[date]);
  state=setFruitConsumed(state,date,true);state=setFruitConsumed(state,date,true);assert.equal(state.foodLogs.length,1);assert.equal(dailyTotals(state,date).fiber,4.4);
  state=consumePlan(state,date,1,true);assert.equal(state.foodLogs.length,1);assert.equal(state.foodLogs[0].source,'plan');assert.equal(dailyTotals(state,date).fiber,4.4);assert.equal(dailyTotals(state,date).partialFiber,true);
  const before=structuredClone(state.foodLogs);state.foods=state.foods.map(f=>f.id==='apple'?{...f,kcal:50,fiber:9}:f);assert.deepEqual(state.foodLogs,before);assert.deepEqual(state.mealPlans[date],plan);assert.equal(dailyTotals(state,date).fiber,4.4);
  assert.equal(validateFood({...state.foods.at(-1),fiber:-1}),'Porción mayor que 0 y nutrientes entre 0 y 10000.');
  state=consumePlan(state,date,1,false);assert.equal(state.foodLogs.length,0);assert.equal(dailyTotals(state,date).fiber,null);
  state=setFruitConsumed(state,date,true);assert.equal(dailyTotals(state,date).fiber,9);state=setFruitConsumed(state,date,false);assert.equal(state.foodLogs.length,0);
});
test('fibra desconocida no se rellena con la base actual; brasas concentradas en bordes',()=>{
  const state=initialState(),apple=state.foods.at(-1);state.foodLogs=[{date,items:[foodItem({...apple,fiber:undefined},1)],macros:{kcal:95,protein:.5,carbs:25.1,fat:.3}}];
  assert.equal(dailyTotals(state,date).fiber,null);assert.equal(dailyTotals(state,date).partialFiber,true);
  for(const width of [390,1440,1920]){const particles=createParticles(80,width,900);assert.ok(particles.every(p=>width===390?p.x<=18||p.x>=width-18:p.x<=(width-1240)/2||p.x>=(width+1240)/2));}
});
