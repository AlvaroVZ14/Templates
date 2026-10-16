import { shiftDate } from '../wellness.js';
import { daysBetween, lastWeight, phaseForDate, trend } from './phases.js';
import {appleCount,fruitProgress} from './fruit.js';

export const MACROS=['kcal','protein','carbs','fat'];
export const emptyMacros=()=>({kcal:0,protein:0,carbs:0,fat:0});
export function foodItem(food,quantity){return {food:structuredClone(food),quantity,macros:{...Object.fromEntries(MACROS.map(key=>[key,food[key]*quantity/food.portion])),...(Number.isFinite(food.fiber)?{fiber:food.fiber*quantity/food.portion}:{})}};}
export function sumItems(items){const sum=items.reduce((sum,item)=>Object.fromEntries(MACROS.map(key=>[key,sum[key]+item.macros[key]])),emptyMacros());const known=items.filter(item=>Number.isFinite(item.macros.fiber));return {...sum,...(known.length?{fiber:known.reduce((sum,item)=>sum+item.macros.fiber,0)}:{})};}
export function validateFood(food){return !(food.portion>0&&food.portion<=10000&&MACROS.every(key=>Number.isFinite(food[key])&&food[key]>=0&&food[key]<=10000)&&(food.fiber==null||Number.isFinite(food.fiber)&&food.fiber>=0&&food.fiber<=10000))?'Porción mayor que 0 y nutrientes entre 0 y 10000.':null;}
export function dayContext(state,date){
  const index=(new Date(`${date}T12:00:00`).getDay()+6)%7,override=state.calendar[date];
  const defaultType=state.routine[index].length===0?'rest':state.routine[index].some(ex=>ex.muscle==='Cuádriceps')?'legs':'weights';
  const type=override?.type??defaultType;
  const fallback=state.routine.findIndex(list=>list.length>0&&(type!=='legs'||list.some(ex=>ex.muscle==='Cuádriceps')));
  const routineDay=override?.routineDay??(state.routine[index].length?index:Math.max(0,fallback));
  return {type,routineDay,trainingTime:override?.trainingTime??state.programSettings.trainingTime,exercises:type==='rest'?[]:state.routine[routineDay]};
}
export function suggestedTargets(state,date,base=state.baseIntake,ratio=state.programSettings.proteinRatio){
  const phase=phaseForDate(state,date),weight=lastWeight(state,date)?.value;
  if(!phase||!weight||!base)return null;
  const kcal=phase.kind==='bulk'?base+250:phase.kind==='cut'?base-400:base;
  const protein=Number((weight*ratio).toFixed(1)),fat=Math.ceil(weight*.6*10-1e-8)/10,carbs=(kcal-protein*4-fat*9)/4;
  return {kcal,protein,fat,carbs,weight,proteinRatio:ratio,phaseId:phase.id,phaseKind:phase.kind};
}
export function goalForDate(state,date,ignoreSnapshot=false){
  if(!ignoreSnapshot&&state.nutritionDays[date]?.target)return state.nutritionDays[date].target;
  const phase=phaseForDate(state,date);
  const revision=state.goalRevisions.filter(item=>item.effectiveDate<=date&&item.phaseId===phase?.id).sort((a,b)=>a.effectiveDate.localeCompare(b.effectiveDate)).at(-1);
  if(!revision)return null;
  const context=dayContext(state,date),reduction=context.type==='rest'?revision.restReduction:0;
  const kcal=revision.kcal*(1-reduction),carbs=(kcal-revision.protein*4-revision.fat*9)/4;
  return {...revision,kcal,carbs,dayType:context.type};
}
export function validateTargets(target){
  if(!target||!Number.isFinite(target.kcal)||target.kcal<500||target.kcal>10000)return 'Las calorías deben estar entre 500 y 10000.';
  if(!Number.isFinite(target.proteinRatio)||target.proteinRatio<1.6||target.proteinRatio>2.2)return 'Elige proteína entre 1,6 y 2,2 g/kg.';
  if(!Number.isFinite(target.restReduction)||target.restReduction<0||target.restReduction>.1||!Number.isFinite(target.snackBudget)||target.snackBudget<0||target.snackBudget>.2)return 'Descanso: 0–10%; snacks de mantención: 0–20%.';
  if(!Number.isFinite(target.protein)||!Number.isFinite(target.fat)||!(target.protein>0)||target.fat+1e-8<target.weight*.6)return 'Revisa proteína y grasa mínima de 0,6 g/kg.';
  if(target.kcal-target.protein*4-target.fat*9<0||target.kcal*(1-target.restReduction)-target.protein*4-target.fat*9<0)return 'Estas calorías no permiten cubrir proteína y grasa mínima, también en descanso.';
  return null;
}
export function confirmTargets(state,target,date){
  const invalid=validateTargets(target);if(invalid)throw new Error(invalid);
  const phase=phaseForDate(state,date);if(!phase)throw new Error('Selecciona una fase para esa fecha.');
  const revision={...target,id:crypto.randomUUID(),phaseId:phase.id,phaseKind:phase.kind,effectiveDate:date,confirmedAt:new Date().toISOString()};
  return {...state,baseIntake:target.baseIntake,programSettings:{...state.programSettings,proteinRatio:target.proteinRatio,restReduction:target.restReduction,maintenanceSnack:target.snackBudget},goalRevisions:[...state.goalRevisions,revision]};
}
export function dailyTotals(state,date){
  const logs=state.foodLogs.filter(log=>log.date===date),legacy=state.meals.filter(meal=>meal.date===date);
  const totals=logs.reduce((sum,log)=>Object.fromEntries(MACROS.map(key=>[key,sum[key]+log.macros[key]])),emptyMacros());
  for(const meal of legacy){totals.kcal+=meal.kcal;totals.protein+=meal.protein;}
  const items=logs.flatMap(log=>log.items??[]).filter(item=>item.quantity>0),known=items.filter(item=>Number.isFinite(item.macros.fiber));
  return {...totals,fiber:known.length?known.reduce((sum,item)=>sum+item.macros.fiber,0):null,partialFiber:legacy.length>0||known.length<items.length||logs.some(log=>!log.items?.length),hasData:logs.length+legacy.length>0,partialMacros:legacy.length>0};
}
export function snapshotDay(state,date,target){return {...state.nutritionDays,[date]:{...state.nutritionDays[date],target:state.nutritionDays[date]?.target??structuredClone(target),complete:false}};}
export function setComplete(state,date,complete){const target=goalForDate(state,date);if(!target)throw new Error('Confirma las metas de este día.');if(complete&&!dailyTotals(state,date).hasData)throw new Error('Registra al menos un consumo antes de cerrar el día.');return {...state,nutritionDays:{...snapshotDay(state,date,target),[date]:{...state.nutritionDays[date],target:state.nutritionDays[date]?.target??structuredClone(target),complete}}};}
export function proteinAlert(state,date){
  const dates=[shiftDate(date,-2),shiftDate(date,-1),date];
  return dates.every(day=>state.nutritionDays[day]?.complete&&state.nutritionDays[day].target&&dailyTotals(state,day).protein<state.nutritionDays[day].target.protein)?dates:null;
}
export function adherence(state,date){
  const dates=Array.from({length:14},(_,i)=>shiftDate(date,i-13)).filter(day=>state.nutritionDays[day]?.complete&&state.nutritionDays[day].target);
  const fulfilled=dates.filter(day=>{const target=state.nutritionDays[day].target,actual=dailyTotals(state,day);return Math.abs(actual.kcal-target.kcal)<=target.kcal*.1&&actual.protein>=target.protein*.9;}).length;
  return {days:dates.length,fulfilled,ratio:dates.length?fulfilled/dates.length:0};
}
function score(total,target){return Math.max(0,target.fat-total.fat)*100+Math.abs(total.protein-target.protein)*5+Math.abs(total.kcal-target.kcal)/8+Math.abs(total.carbs-target.carbs)*.6+Math.max(0,total.fat-target.fat)*.7;}
export function generatePlan(state,date){
  const target=goalForDate(state,date);if(!target)throw new Error('Primero confirma las metas nutricionales.');
  const context=dayContext(state,date),foods=Object.fromEntries(state.foods.map(food=>[food.id,food])),options=state.planOptions[date]??{};
  const cap=target.kcal*(target.phaseKind==='bulk'?.2:target.phaseKind==='cut'?.1:Math.min(.2,target.snackBudget??.2));
  const chosen=(options.snacks??[]).map(id=>foods[id]).filter(food=>food?.snack),chosenItems=chosen.map(food=>foodItem(food,1));
  const chosenTotal=sumItems(chosenItems),chosenFit=chosenTotal.kcal<=cap;
  const fruitItems=foods.apple&&appleCount(state)>0?[foodItem(foods.apple,appleCount(state))]:[];
  let best=null;
  function search(snacks){
    const snackTotal=sumItems([...snacks,...fruitItems]);
    for(let eggs=0;eggs<=12;eggs++)for(let halfBread=0;halfBread<=16;halfBread++)for(let chicken=0;chicken<=700;chicken+=10){
      const partial=Object.fromEntries(MACROS.map(key=>[key,snackTotal[key]+foods.egg[key]*eggs/foods.egg.portion+foods.bread[key]*halfBread/2/foods.bread.portion+foods.chicken[key]*chicken/foods.chicken.portion])),riceKcal=foods.rice.kcal/foods.rice.portion;
      const rice=riceKcal>0?Math.min(2000,Math.max(0,Math.round((target.kcal-partial.kcal)/riceKcal/10)*10)):0;
      const total=Object.fromEntries(MACROS.map(key=>[key,partial[key]+foods.rice[key]*rice/foods.rice.portion])),value=score(total,target)+snackTotal.kcal*.001;
      if(!best||value<best.score)best={items:[foodItem(foods.egg,eggs),foodItem(foods.bread,halfBread/2),foodItem(foods.chicken,chicken),...snacks,...fruitItems,foodItem(foods.rice,rice)].filter(item=>item.quantity>0),total,score:value};
    }
  }
  search(chosenFit?chosenItems:[]);
  if(!chosen.length&&(best.total.fat<target.fat-.5||best.total.kcal<target.kcal-100))for(const food of state.foods.filter(item=>item.snack))if(food.kcal<=cap)search([foodItem(food,1)]);
  const slots=Array.from({length:4},(_,index)=>({slot:index,name:`Comida ${index+1}`,items:[]}));
  const add=(slot,food,quantity)=>{const item=slot.items.find(item=>item.food.id===food.id);if(item){item.quantity+=quantity;item.macros=foodItem(food,item.quantity).macros;}else slot.items.push(foodItem(food,quantity));};
  const protein=slot=>sumItems(slot.items).protein;
  for(const id of ['egg','chicken']){const item=best.items.find(item=>item.food.id===id);if(!item)continue;const step=id==='egg'?1:10;for(let qty=0;qty<item.quantity;qty+=step){const slot=slots.toSorted((a,b)=>protein(a)-protein(b))[0];add(slot,item.food,Math.min(step,item.quantity-qty));}}
  const hour=Number(context.trainingTime.slice(0,2)),pre=hour<13?0:1,post=hour<13?1:2;
  const shares=Array(4).fill(context.type==='legs'?.1:context.type==='weights'?.15:.25);if(context.type!=='rest'){shares[pre]=context.type==='legs'?.4:.35;shares[post]=shares[pre];}
  for(const id of ['bread','rice']){const item=best.items.find(item=>item.food.id===id);if(!item)continue;const step=id==='bread'?.5:10;for(let qty=0;qty<item.quantity;qty+=step){const slot=slots.toSorted((a,b)=>sumItems(a.items).carbs/shares[a.slot]-sumItems(b.items).carbs/shares[b.slot])[0];add(slot,item.food,Math.min(step,item.quantity-qty));}}
  for(const item of best.items.filter(item=>item.food.snack))add(slots[3],item.food,item.quantity);
  for(const item of fruitItems)add(slots[context.type==='rest'?0:pre],item.food,item.quantity);
  for(let i=0;i<100;i++){const sorted=slots.toSorted((a,b)=>protein(a)-protein(b)),low=sorted[0],high=sorted[3],item=high.items.find(item=>item.food.id==='chicken');if(!item||item.quantity<10||protein(high)-protein(low)<=foods.chicken.protein/foods.chicken.portion*10)break;item.quantity-=10;item.macros=foodItem(item.food,item.quantity).macros;add(low,item.food,10);}
  const training=Number(context.trainingTime.slice(0,2))*60+Number(context.trainingTime.slice(3));
  const times=context.type==='rest'?[480,780,1020,1260]:hour<13?[training-90,training+60,840,1260]:[480,training-90,training+60,1320];
  const meals=slots.map((slot,index)=>({...slot,items:slot.items.filter(item=>item.quantity>0),timing:context.type==='rest'?'Descanso':index===pre?'1–2 h antes de pesas':index===post?'Después de pesas':'Horario orientativo',time:`${String(Math.floor(((times[index]+1440)%1440)/60)).padStart(2,'0')}:${String((times[index]+1440)%60).padStart(2,'0')}${times[index]>=1440?' (+1 día)':''}`,macros:sumItems(slot.items)}));
  return {id:crypto.randomUUID(),date,target:structuredClone(target),context:structuredClone(context),meals,total:sumItems(meals.flatMap(meal=>meal.items)),appleCount:fruitItems.reduce((sum,item)=>sum+item.quantity,0),snackKcal:best.items.filter(item=>item.food.snack).reduce((sum,item)=>sum+item.macros.kcal,0),snackCap:cap,snackWarning:!chosenFit,createdAt:new Date().toISOString()};
}
export function savePlan(state,date){const plan=generatePlan(state,date);return {...state,mealPlans:{...state.mealPlans,[date]:plan},planHistory:state.mealPlans[date]?[...state.planHistory,structuredClone(state.mealPlans[date])]:state.planHistory,nutritionDays:snapshotDay(state,date,plan.target)};}
export function consumePlan(state,date,slot,checked,items=null){
  const plan=state.mealPlans[date];if(!plan)throw new Error('Genera el plan primero.');
  const id=`plan-${date}-${slot}`,exists=state.foodLogs.some(log=>log.id===id);
  if(checked&&exists)return state;
  const actual=structuredClone(items??plan.meals[slot].items);
  const log={id,date,slot,source:'plan',items:actual,macros:sumItems(actual),targetSnapshot:structuredClone(plan.target),contextSnapshot:structuredClone(plan.context),createdAt:new Date().toISOString()};
  let foodLogs=state.foodLogs;
  if(checked){const fruit=foodLogs.find(item=>item.id===`fruit-${date}`),apples=actual.filter(item=>item.food.id==='apple').reduce((sum,item)=>sum+item.quantity,0);if(fruit&&apples>0){const remaining=Math.max(0,fruit.items[0].quantity-apples);foodLogs=foodLogs.filter(item=>item.id!==fruit.id);if(remaining>0){const item=foodItem(fruit.items[0].food,remaining);foodLogs=[...foodLogs,{...fruit,items:[item],macros:item.macros}];}}}
  return {...state,foodLogs:checked?[...foodLogs,log]:foodLogs.filter(item=>item.id!==id),nutritionDays:snapshotDay(state,date,plan.target)};
}
export function setFruitConsumed(state,date,checked){
  const progress=fruitProgress(state,date),id=`fruit-${date}`;
  if(!checked)return {...state,foodLogs:state.foodLogs.filter(log=>log.id!==id),nutritionDays:state.nutritionDays[date]?{...state.nutritionDays,[date]:{...state.nutritionDays[date],complete:false}}:state.nutritionDays};
  if(progress.count>=progress.target)return state;
  const food=state.foods.find(food=>food.id==='apple');if(!food)throw new Error('No se encuentra la manzana en tu base.');
  const quantity=progress.target-progress.count+(progress.own?.items[0].quantity??0),item=foodItem(food,quantity),target=goalForDate(state,date);
  const log={id,date,slot:0,source:'fruit',items:[item],macros:item.macros,targetSnapshot:target?structuredClone(target):null,createdAt:new Date().toISOString()};
  return {...state,foodLogs:[...state.foodLogs.filter(log=>log.id!==id),log],nutritionDays:target?snapshotDay(state,date,target):state.nutritionDays};
}
export function updateConsumption(state,log){return {...state,foodLogs:state.foodLogs.map(item=>item.id===log.id?{...log,macros:sumItems(log.items)}:item),nutritionDays:state.nutritionDays[log.date]?{...state.nutritionDays,[log.date]:{...state.nutritionDays[log.date],complete:false}}:state.nutritionDays};}
export function saveCalendar(state,date,context){
  const next={...state,calendar:{...state.calendar,[date]:context}};
  if(!state.nutritionDays[date]?.target)return next;
  const target=goalForDate(next,date,true);
  return {...next,nutritionDayHistory:[...state.nutritionDayHistory,{date,...structuredClone(state.nutritionDays[date]),reason:'Calendario corregido explícitamente',at:new Date().toISOString()}],nutritionDays:{...state.nutritionDays,[date]:{target,complete:false}}};
}
