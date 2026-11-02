import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {PROFILE_DEFAULTS,profileNutrition,goalPace,profileAge,profileForDate,profileGoal,sleepHours,validateProfile} from '../src/profile.js';
import {savePersonalProfile} from '../src/profileState.js';
import {goalForDate,generatePlan,confirmTargets} from '../src/program/nutrition.js';
import {cardioRecommendation} from '../src/program/cardio.js';
import {phaseForDate} from '../src/program/phases.js';
const date='2026-11-03',example={...PROFILE_DEFAULTS,name:'Atlas',age:23,sex:'male',heightCm:175,weightKg:75,targetWeight:78,goalDate:'2027-01-26'};
test('Mifflin y macros de ejemplo de23 años/175cm/75kg/5 días con ambos coeficientes',()=>{
 const male=profileNutrition(example,date),female=profileNutrition({...example,sex:'female'},date);assert.equal(male.basal,1733.75);assert.equal(male.maintenance,2687.3125);assert.equal(male.kcal,2956);assert.equal(male.protein,150);assert.equal(male.fat,67.5);assert.equal(male.carbs,437.1);assert.equal(female.basal,1567.75);assert.equal(female.kcal,2673);assert.equal(female.carbs,366.4);
 for(const deficit of [.175,.9]){const cut=profileNutrition({...example,phase:'cut',deficit},date);assert.ok(cut.kcal>=cut.basal&&cut.kcal>=cut.maintenance*.75);}
 assert.equal(profileNutrition({...example,weightKg:null},date),null);assert.equal(profileNutrition({...example,age:17},date),null);assert.equal(profileNutrition({...example,sex:''},date),null);
});
test('edad Chile-calendario, unidades canónicas, sueño y fecha sensata sin obligar a cambiarla',()=>{
 assert.equal(profileAge({...example,birthDate:'2003-11-04'},date),22);assert.equal(profileAge({...example,birthDate:'2003-11-03'},date),23);assert.equal(sleepHours(example),8);
 const pace=goalPace({...example,targetWeight:85,goalDate:'2026-11-10'},date);assert.equal(pace.unrealistic,true);assert.ok(pace.suggestedDate>'2026-11-10');assert.deepEqual(pace.range,[.1875,.375]);assert.equal(validateProfile(example),null);assert.ok(validateProfile({...example,name:''}));
});
test('guardar perfil alimenta metas/fase/sueño sin reescribir historial ni snapshots antiguos',()=>{
 const state=initialState();state.journal={'2026-10-01':{weight:70}};state.foodLogs=[{id:'old',date:'2026-10-01',macros:{kcal:100},items:[]}];const before=structuredClone(state);
 const next=savePersonalProfile(state,example,date);assert.equal(goalForDate(next,date).kcal,2956);assert.equal(phaseForDate(next,date).kind,'bulk');assert.equal(next.settings.sleepGoal,8);assert.equal(profileForDate(next,'2026-10-01'),null);assert.deepEqual(next.foodLogs,before.foodLogs);assert.deepEqual(next.journal,before.journal);assert.deepEqual(state,before);
 const changed=savePersonalProfile(next,{...example,phase:'cut'},'2026-11-04');assert.equal(profileForDate(changed,date).phase,'bulk');assert.equal(profileForDate(changed,'2026-11-04').phase,'cut');assert.equal(goalForDate(changed,date).kcal,2956);assert.ok(goalForDate(changed,'2026-11-04').kcal<2956);
 assert.throws(()=>confirmTargets(changed,{...goalForDate(changed,'2026-11-04'),kcal:1000},'2026-11-04'),/límite/);
});
test('plan respeta comidas elegidas, exclusiones, macros y cardio por fase y límite personal',()=>{
 let state=savePersonalProfile(initialState(),{...example,mealsPerDay:3,avoidIds:['bread']},date);const plan=generatePlan(state,date);assert.equal(plan.meals.length,3);assert.ok(plan.meals.every(meal=>meal.items.every(item=>item.food.id!=='bread')));assert.ok(plan.total.protein>0);assert.ok(plan.snackKcal<=plan.snackCap);
 assert.equal(cardioRecommendation(state,date).minutes,12);state=savePersonalProfile(state,{...example,phase:'cut',cardioMinutes:20},date);assert.equal(cardioRecommendation(state,date).minutes,20);state=savePersonalProfile(state,{...example,cardioMinutes:0},date);assert.equal(cardioRecommendation(state,date).minutes,0);
});
test('fecha meta permite revisar fase; mantención sin fecha no vuelve a pedirla cada día',()=>{
 const state=savePersonalProfile(initialState(),{...example,goalDate:date},date);assert.equal(profileGoal(state,date).due,true);const maintained=savePersonalProfile(state,{...example,phase:'maintain',targetWeight:75,goalDate:''},date);assert.equal(Boolean(profileGoal(maintained,date).due),false);
 const reached=savePersonalProfile(initialState(),example,date);reached.monthlyChecks=[{date,weight:80}];assert.equal(profileGoal(reached,date).weight,80);assert.equal(profileGoal(reached,date).due,true);assert.equal(profileGoal(reached,date).progress,1);
});
