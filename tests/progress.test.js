import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {dayContext} from '../src/program/nutrition.js';
import {progressReport,performance,captureMonthlyReviews} from '../src/progress.js';
const date='2026-12-31';
function shift(n){const d=new Date(`${date}T12:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function fixture(scores=[100,103,106]){const state=initialState();state.trainingStarted=shift(-90);state.phases[0].startDate=shift(-120);const ex=state.routine[0][0];state.logs=[];for(let i=83;i>=0;i--){state.journal[shift(-i)]={weight:70+(83-i)*.3/7,sleepHours:8};if(i%7===0)state.logs.push({id:`p-${i}`,date:shift(-i),exerciseId:ex.id,profileId:ex.profileId,equipment:ex.equipment,exerciseName:ex.name,kind:'effective',weight:scores[i>=56?0:i>=28?1:2],reps:8});}state.measurements=[28,14,0].map((n,i)=>({id:`m-${i}`,date:shift(-n),values:{waist:70+i*.1,biceps:35+i*.1,forearm:31.5,chest:100,thigh:59,calf:35.2}}));return state;}
test('cuatro semanas mínimas, sin convertir una semana mala en rojo ni mezclar equipos/técnicas',()=>{
 const state=fixture();state.logs=state.logs.filter(log=>log.date>=shift(-20));const report=progressReport({...state,journal:{[shift(-20)]:{weight:70,sleepHours:8}}},date);assert.equal(report.performance.status,'insufficient');assert.match(report.performance.text,/vuelve en/);
 const good=fixture();assert.equal(performance(good,date).status,'green');const decline=fixture([100,100,97]);assert.equal(performance(decline,date).status,'amber');const red=fixture([100,97,94]);assert.equal(performance(red,date).status,'red');
 assert.equal(performance(fixture([100,98,96.04]),date).status,'amber'); // Exactly −2% is not below −2%.
 for(const log of good.logs.filter(log=>log.date>=shift(-27)))log.equipment='different';assert.equal(performance(good,date).status,'insufficient');
 const exclude=fixture();exclude.logs.push({...exclude.logs[0],date,kind:'drop',weight:10000},{...exclude.logs[0],date,kind:'effective',deload:true,weight:10000});assert.equal(performance(exclude,date).value,performance(fixture(),date).value);
});
test('volumen exige peso, medidas y cintura; mini cut exige fuerza; no inventa observaciones',()=>{
 const state=fixture();assert.equal(progressReport(state,date).body.status,'green');state.measurements.at(-1).values.waist=72;assert.equal(progressReport(state,date).body.status,'red');state.measurements=[];assert.equal(progressReport(state,date).body.status,'insufficient');
 const cut=fixture([100,100,100]);cut.phases[0].kind='cut';for(const [day,row] of Object.entries(cut.journal)){const index=(Date.parse(`${day}T12:00Z`)-Date.parse(`${shift(-83)}T12:00Z`))/86400000;row.weight=80-index*.6/7;}assert.equal(progressReport(cut,date).body.status,'green');for(const row of cut.logs.filter(log=>log.date>=shift(-27)))row.weight=85;assert.equal(progressReport(cut,date).body.status,'amber');
});
test('constancia usa sesiones completas, sueño observado y descarga sin modificar entrenamiento',()=>{
 const state=fixture();state.logs=[];for(let n=27;n>=0;n--){const day=shift(-n);for(const ex of dayContext(state,day).exercises)for(let i=0;i<ex.sets;i++)state.logs.push({id:`${day}-${ex.id}-${i}`,date:day,kind:'effective',exerciseId:ex.id});}state.deloads=[{id:'test',startDate:shift(-35),endDate:shift(-29)}];const original=structuredClone(state);const report=progressReport(state,date);assert.equal(report.consistency.status,'green');assert.equal(report.consistency.value,100);assert.deepEqual(state,original);state.deloads=[];assert.equal(progressReport(state,date).consistency.status,'amber');for(const row of Object.values(state.journal))row.sleepHours=6;assert.equal(progressReport(state,date).consistency.status,'amber');
});
test('revisiones mensuales inmutables, idempotentes y calculadas hasta el cierre sin datos futuros',()=>{
 const state=fixture(),original=structuredClone(state);const saved=captureMonthlyReviews(state,'2027-01-01');assert.deepEqual(state,original);const december=saved.monthlyReviews.find(row=>row.month==='2026-12');assert.equal(december.date,'2027-01-01');assert.equal(december.report.asOf,date);assert.equal(december.report.performance.status,'green');assert.ok(saved.monthlyReviews.some(row=>row.month==='2026-11'));
 const edited={...saved,logs:[]};assert.equal(captureMonthlyReviews(edited,'2027-01-20'),edited);assert.deepEqual(edited.monthlyReviews.find(row=>row.month==='2026-12'),december);assert.equal(new Set(saved.monthlyReviews.map(row=>row.month)).size,saved.monthlyReviews.length);
});
