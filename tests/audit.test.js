import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {initialState,preparationSuggestions,dayIndex,weekDates,weeklyVolume} from '../src/domain.js';
import {chileDate,migrateProgram} from '../src/program/state.js';
import {shiftDate,validDate} from '../src/wellness.js';
import {trend} from '../src/program/phases.js';
import {confirmTargets,suggestedTargets,generatePlan,dayContext} from '../src/program/nutrition.js';
import {sessionExercise} from '../src/training.js';
import {sessionTitle} from '../src/calendarText.js';
import {projectCollections} from '../src/history.js';
import {recoveryItems} from '../src/program/tracking.js';
import {measurementReminder} from '../src/measurements.js';

test('sin medidas el primer recordatorio es actual; sin inicial usa el primer registro real',()=>{
 assert.deepEqual(measurementReminder([],'2031-06-02'),{due:true,date:'2031-06-02'});
 assert.deepEqual(measurementReminder([{date:'2031-06-01',values:{waist:80}}],'2031-06-02'),{due:false,date:'2031-06-15'});
});

test('recuperación usa metas de sueño y pasos configuradas, no textos fijos',()=>{
  const state=initialState();state.settings.sleepGoal=9;state.cardioSettings={stepsMin:6000,stepsMax:7000};
  const items=Object.fromEntries(recoveryItems(state,'2026-10-14'));
  assert.match(items.sleep,/9 horas/);assert.match(items.steps,/6\.000–7\.000/);
});

test('volumen planeado respeta sesiones canceladas o movidas en el calendario',()=>{
 const state=initialState(),planned=weeklyVolume(state,'2026-10-12').find(row=>row.muscle==='Pecho').planned;
 const chest=state.routine[0].filter(ex=>ex.muscle==='Pecho').reduce((sum,ex)=>sum+ex.sets,0);
 state.calendar['2026-10-12']={type:'rest',routineDay:0};
 assert.equal(weeklyVolume(state,'2026-10-12').find(row=>row.muscle==='Pecho').planned,planned-chest);
 state.calendar['2026-10-14']={type:'weights',routineDay:0};
 assert.equal(weeklyVolume(state,'2026-10-12').find(row=>row.muscle==='Pecho').planned,planned);
});

test('calendario civil independiente de TZ, DST, año bisiesto y lunes como inicio',()=>{
  const code=`import {shiftDate,validDate} from './src/wellness.js';import {weekDates,dayIndex} from './src/domain.js';import {previousMonth} from './src/measurements.js';console.log(JSON.stringify([shiftDate('2026-09-05',1),shiftDate('2026-04-05',-1),shiftDate('2024-02-28',1),weekDates('2027-01-03'),dayIndex('2026-10-12'),previousMonth('2024-03-31'),validDate('2026-02-29'),validDate('')]))`;
  const results=['America/Santiago','Pacific/Kiritimati','America/Los_Angeles','UTC'].map(TZ=>JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',code],{cwd:process.cwd(),env:{...process.env,TZ},encoding:'utf8'})));
  for(const result of results)assert.deepEqual(result,['2026-09-06','2026-04-04','2024-02-29',['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03'],0,'2024-02-29',false,false]);
});
test('Chile: medianoche, hora repetida y salto de horario de verano',()=>{
  for(const [instant,date] of [['2026-10-16T02:59:59Z','2026-10-15'],['2026-10-16T03:00:00Z','2026-10-16'],['2026-04-05T02:59:59Z','2026-04-04'],['2026-04-05T03:00:00Z','2026-04-04'],['2026-04-05T04:00:00Z','2026-04-05'],['2026-09-06T03:59:59Z','2026-09-05'],['2026-09-06T04:00:00Z','2026-09-06']])assert.equal(chileDate(new Date(instant)),date);
  assert.equal(validDate('2024-02-29'),true);assert.equal(validDate('2026-04-31'),false);
});
test('toda la rutina: perfiles y equipos válidos, mínimos pesados, porcentajes seguros',()=>{
  const state=initialState();
  for(const date of weekDates('2026-10-12')){
    const context=dayContext(state,date);assert.deepEqual(context.exercises,state.routine[dayIndex(date)]);
    for(const ex of context.exercises){
      assert.ok(['heavy','compound','isolation'].includes(ex.loadType),ex.name);
      assert.ok(['barbell','dumbbell','machine','cable'].includes(ex.equipment),ex.name);
      const session=sessionExercise(state,ex,date);if(ex.loadType==='heavy')assert.ok(session.approaches>=2,ex.name);
      for(const weight of [0,.1,1,2.5,5,37,100,102.5,400])for(const row of preparationSuggestions(session,weight)){assert.ok(row.weight>=0&&row.weight<=weight*.8+1e-8);assert.ok(Math.abs(row.weight/ex.increment-Math.round(row.weight/ex.increment))<1e-8);}
    }
  }
});
test('títulos nuevos salen del músculo; el título histórico ya guardado no cambia',()=>{
  const state=initialState();state.routine[0]=[state.routine[4][0]];
  assert.equal(sessionTitle(state.routine[0]),'Cuádriceps');
  state.sessionMeta={'2026-10-12':{notes:'Ficticio'}};
  const session=projectCollections(state).sessions[0];assert.equal(session.routineTitle,'Cuádriceps');
  session.routineTitle='Título conservado';assert.equal(projectCollections(state,[session]).sessions[0].routineTitle,'Título conservado');
});
test('ritmo usa dos semanas calendario con 4 datos mínimos, nunca rellena días',()=>{
  const state=initialState(),end='2026-10-25';
  assert.equal(trend(state,end).weekly,null);
  for(let i=0;i<14;i++)state.journal[shiftDate(end,i-13)]={weight:i<7?70:70.4};
  assert.ok(Math.abs(trend(state,end).weekly-.4)<1e-8);
  for(let i=0;i<4;i++)delete state.journal[shiftDate(end,-i)];
  assert.equal(trend(state,end).weekly,null);
});
test('planes por fase: cantidades finitas, alimentos permitidos, snacks dentro del límite y sin mutación',()=>{
  for(const kind of ['bulk','cut','maintain'])for(const intake of [1800,2200,2800]){
    let state=initialState();const date='2026-10-15';state.phases=[{...state.phases[0],kind,startDate:'2026-10-01'}];state.journal[date]={weight:70};
    state=confirmTargets(state,{...suggestedTargets(state,date,intake),baseIntake:intake,restReduction:0,snackBudget:.2},date);
    const before=JSON.stringify(state),plan=generatePlan(state,date);
    assert.equal(plan.meals.length,4);const items=plan.meals.flatMap(meal=>meal.items);
    for(const item of items){assert.ok(state.foods.some(food=>food.id===item.food.id));assert.ok(Number.isFinite(item.quantity)&&item.quantity>=0);for(const value of Object.values(item.macros))assert.ok(Number.isFinite(value)&&value>=0);}
    const snackKcal=items.filter(item=>item.food.snack).reduce((sum,item)=>sum+item.macros.kcal,0);
    assert.ok(snackKcal<=plan.target.kcal*(kind==='cut'?.1:.2)+1e-8);assert.equal(JSON.stringify(state),before);
    state.foods=[];assert.throws(()=>generatePlan(state,date),/Completa la base/);
  }
});
test('instalación posterior al plan inicial no crea fases ya vencidas ni altera fases existentes',()=>{
  const state=initialState(),legacy={...state,schemaVersion:4};
  const migrated=migrateProgram(legacy,'2031-06-01');assert.equal(migrated.phases[0].startDate,'2031-06-01');assert.ok(migrated.phases[0].deadline>'2031-06-01');assert.ok(migrated.phases[1].startDate>migrated.phases[0].deadline);
  assert.equal(migrateProgram(state,'2031-06-01'),state);
});
