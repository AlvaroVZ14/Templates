import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {shiftDate} from '../src/wellness.js';
import {chileDate,migrateProgram} from '../src/program/state.js';
import {activatePhase,advancePhases,captureAnchors,phaseForDate,phaseReport,trajectory,trend,trendAdvice} from '../src/program/phases.js';
import {adherence,confirmTargets,consumePlan,dailyTotals,dayContext,foodItem,generatePlan,goalForDate,proteinAlert,saveCalendar,savePlan,setComplete,suggestedTargets,updateConsumption,validateFood,validateTargets} from '../src/program/nutrition.js';
import {cardioRecommendation,cardioWeek,markCardio,recoveryItems,weeklyNutrition} from '../src/program/tracking.js';

function fixture(){const state=initialState();state.phases[0]={...state.phases[0],startDate:'2026-10-01',anchorDate:'2026-10-01',startWeight:70};state.journal['2026-10-01']={weight:70};state.journal['2026-10-15']={weight:70};return state;}
function goals(state,date='2026-10-15',extra={}){return confirmTargets(state,{...suggestedTargets(state,date,2200),baseIntake:2200,restReduction:.1,snackBudget:.2,...extra},date);}

test('trayectoria llega al objetivo sin inventar pesos previos a la fase',()=>{
  const phase=fixture().phases[0];
  assert.equal(trajectory(phase,'2026-09-30'),null);
  assert.equal(trajectory(phase,'2026-10-01'),70);
  assert.equal(trajectory(phase,'2026-12-31'),74);
  assert.ok(trajectory(phase,'2026-11-15')>70&&trajectory(phase,'2026-11-15')<74);
});
test('migra sin datos falsos, limita alimentos y usa fecha de Chile',()=>{
  const state=fixture(),old={...state,schemaVersion:4};delete old.foods;
  const migrated=migrateProgram(old,'2026-10-15');assert.equal(migrated.schemaVersion,5);assert.equal(migrated.foods.length,7);assert.deepEqual(migrated.logs,state.logs);assert.deepEqual(migrated.measurements,state.measurements);assert.equal(migrated.baseIntake,null);assert.equal(migrated.foodLogs.length,0);assert.equal(migrated.phases[1].targetWeight,71);assert.equal(migrated.phases[1].windowStart,'2027-03-15');
  assert.equal(chileDate(new Date('2026-10-16T02:00:00Z')),'2026-10-15');
});
test('metas solo cambian al confirmar y grasa redondeada respeta el mínimo',()=>{
  let state=fixture();assert.equal(goalForDate(state,'2026-10-15'),null);
  const proposal=suggestedTargets(state,'2026-10-15',2200);assert.equal(proposal.kcal,2450);assert.equal(state.goalRevisions.length,0);
  state=goals(state);assert.equal(goalForDate(state,'2026-10-15').protein,126);assert.equal(state.baseIntake,2200);
  state.journal['2026-10-15'].weight=70.4;const rounded=suggestedTargets(state,'2026-10-15',2200);assert.ok(rounded.fat>=70.4*.6);assert.equal(validateTargets({...rounded,restReduction:0,snackBudget:.2}),null);
  assert.ok(validateTargets({...rounded,kcal:500,restReduction:0,snackBudget:.2}));
});
test('porciones se recalculan y registros anteriores conservan nutrientes',()=>{
  let state=goals(fixture());const food=state.foods[0];const item=foodItem(food,2);assert.equal(item.macros.kcal,270);assert.equal(validateFood({...food,portion:0}),'Porción mayor que 0 y nutrientes entre 0 y 10000.');
  state=savePlan(state,'2026-10-15');state=consumePlan(state,'2026-10-15',0,true);const before=structuredClone(state.foodLogs[0]);
  state.foods[0]={...food,portion:2,kcal:200};assert.equal(foodItem(state.foods[0],1).macros.kcal,100);assert.deepEqual(state.foodLogs[0],before);
});
test('genera cuatro comidas concretas y respeta snacks y grasa sin agregar alimentos',()=>{
  let state=goals(fixture());state.planOptions['2026-10-15']={snacks:['cookie']};const plan=generatePlan(state,'2026-10-15');
  assert.equal(plan.meals.length,4);assert.ok(plan.meals.every(meal=>meal.items.length>0));assert.ok(plan.meals.flatMap(meal=>meal.items).every(item=>state.foods.some(food=>food.id===item.food.id)));assert.ok(plan.snackKcal<=plan.snackCap);assert.ok(plan.total.fat>=plan.target.fat-.5);assert.ok(Math.abs(plan.total.kcal-plan.target.kcal)<30);
  const protein=plan.meals.reduce((sum,meal)=>sum+meal.macros.protein,0);assert.ok(Math.abs(protein-plan.total.protein)<1e-6);
});
test('marcar y desmarcar no duplica, editar real no cambia previsto',()=>{
  let state=savePlan(goals(fixture()),'2026-10-15');const planned=structuredClone(state.mealPlans['2026-10-15']);state=consumePlan(state,'2026-10-15',0,true);const once=dailyTotals(state,'2026-10-15').kcal;
  state=consumePlan(state,'2026-10-15',0,true);assert.equal(state.foodLogs.length,1);assert.equal(dailyTotals(state,'2026-10-15').kcal,once);
  const log=state.foodLogs[0],items=log.items.map(item=>foodItem(item.food,item.quantity*2));state=updateConsumption(state,{...log,items});assert.equal(dailyTotals(state,'2026-10-15').kcal,once*2);assert.deepEqual(state.mealPlans['2026-10-15'],planned);
  state=consumePlan(state,'2026-10-15',0,false);assert.equal(dailyTotals(state,'2026-10-15').kcal,0);assert.equal(state.foodLogs.length,0);
});
test('descanso conserva proteína y grasa; pierna concentra más carbohidratos',()=>{
  let state=goals(fixture()),weights=generatePlan(state,'2026-10-15');
  state=saveCalendar(state,'2026-10-15',{type:'legs',routineDay:4,trainingTime:'18:00'});const legs=generatePlan(state,'2026-10-15');
  assert.ok(legs.meals[1].macros.carbs+legs.meals[2].macros.carbs>weights.meals[1].macros.carbs+weights.meals[2].macros.carbs);
  state=saveCalendar(state,'2026-10-15',{type:'rest',routineDay:0,trainingTime:'18:00'});const rest=goalForDate(state,'2026-10-15');assert.equal(rest.kcal,2450*.9);assert.equal(rest.protein,126);assert.equal(rest.fat,42);assert.equal(dayContext(state,'2026-10-15').exercises.length,0);
  assert.ok(weeklyNutrition(state,'2026-10-15').budget<=2450*7);
});
test('proteína alerta solo con tres fechas consecutivas completas y metas históricas',()=>{
  let state=goals(fixture(),'2026-10-13');
  for(const day of ['2026-10-13','2026-10-14','2026-10-15']){state.foodLogs.push({id:day,date:day,macros:{kcal:1000,protein:30,carbs:100,fat:20},items:[]});state=setComplete(state,day,true);}
  assert.ok(proteinAlert(state,'2026-10-15'));state.nutritionDays['2026-10-14'].complete=false;assert.equal(proteinAlert(state,'2026-10-15'),null);assert.throws(()=>setComplete(state,'2026-10-16',true));
  const old=state.nutritionDays['2026-10-13'].target;state=goals(state,'2026-10-16',{kcal:2600});assert.deepEqual(goalForDate(state,'2026-10-13'),old);
});
test('fase conserva historial, cintura, metas confirmadas y fecha de minicut',()=>{
  let state=goals(fixture());const old=state.phases[0];state=activatePhase(state,{kind:'cut',targetWeight:71,deadline:'2027-03-31',windowStart:'2027-03-15'},'2027-01-01','2027-01-01');
  assert.equal(state.phaseHistory[0].id,old.id);assert.equal(state.phaseHistory[0].calorieChanges.length,1);assert.equal(state.phaseHistory[0].finalWeight,70);assert.equal(phaseForDate(state,'2027-01-02').kind,'cut');assert.equal(goalForDate(state,'2027-01-02'),null);assert.equal(state.phases.length,3);
  const proposal=suggestedTargets(state,'2027-01-02',2200);assert.equal(proposal.kcal,1800);
});
test('fase programada se archiva una vez al llegar la fecha, sin inventar pesos',()=>{
  let state=fixture();state=advancePhases(state,'2027-01-01');assert.equal(state.phaseHistory.length,1);assert.equal(phaseForDate(state,'2027-01-01').kind,'cut');assert.equal(state.phases.find(phase=>phase.kind==='cut').startWeight,null);state=advancePhases(state,'2027-01-02');assert.equal(state.phaseHistory.length,1);
  state.journal['2027-01-02']={weight:74};state=captureAnchors(state);assert.equal(state.phases.find(phase=>phase.kind==='cut').startWeight,74);
});
test('ritmo y ajustes requieren dos semanas, pesos y cumplimiento; incompatibilidad no cambia metas',()=>{
  let state=goals(fixture(),'2026-10-01');for(let i=0;i<14;i++){const day=shiftDate('2026-10-01',i);state.journal[day]={weight:i<7?70:71};const target=goalForDate(state,day);state.foodLogs.push({date:day,id:day,macros:{...target},items:[]});state=setComplete(state,day,true);}
  assert.equal(trend(state,'2026-10-14').weekly,1);const advice=trendAdvice(state,'2026-10-14',adherence(state,'2026-10-14'));assert.equal(advice.delta,-100);assert.equal(state.goalRevisions.length,1);
  const before=structuredClone(state.phases);state.phases[0].deadline='2026-10-16';assert.equal(phaseReport(state,'2026-10-14').incompatible,true);assert.equal(state.phases[0].targetWeight,before[0].targetWeight);
  assert.equal(trendAdvice(fixture(),'2026-10-15',{days:0,ratio:0}).ready,false);
});
test('cardio por fase y pierna, fatiga, omisión idempotente y frecuencia por día',()=>{
  let state=fixture();assert.equal(cardioRecommendation(state,'2026-10-15').min,10);assert.equal(cardioRecommendation(state,'2026-10-16').optional,true);
  state.journal['2026-10-15'].fatigue=9;assert.equal(cardioRecommendation(state,'2026-10-15').reduce,false);state.journal['2026-10-14']={...state.journal['2026-10-14'],fatigue:9};assert.equal(cardioRecommendation(state,'2026-10-15').reduce,true);
  const rec=cardioRecommendation(state,'2026-10-15');state=markCardio(state,'2026-10-15','omitted',rec);state=markCardio(state,'2026-10-15','omitted',rec);assert.equal(state.cardioEvents.length,1);
  state.cardio.push({date:'2026-10-12',minutes:10},{date:'2026-10-12',minutes:5});assert.equal(cardioWeek(state,'2026-10-15').performed,1);assert.equal(cardioWeek(state,'2026-10-15').minutes,15);
  state=activatePhase(state,{kind:'cut',targetWeight:71,deadline:'2027-03-31'},'2027-01-01');assert.equal(cardioRecommendation(state,'2027-01-04').min,20);
  assert.ok(recoveryItems(state,'2026-10-18',true).some(([key])=>key==='review'));
});
