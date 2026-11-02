import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain.js';
import {MEASURES} from '../src/measurements.js';
import {PHOTO_PREFIX,addMonthlyCheck,checkOrder,checkReminder,comparisonRows,monochrome,photoDimensions,validMonthlyCheck,validMonthlyPhoto} from '../src/monthlyCheck.js';
import {BACKUP_STORES,validateBackup,combineStates} from '../src/backup.js';
import {projectCollections} from '../src/history.js';
const check=(date='2026-10-01',extra={})=>({id:crypto.randomUUID(),version:1,date,month:date.slice(0,7),year:date.slice(0,4),createdAt:`${date}T18:00:00Z`,weight:70,values:Object.fromEntries(MEASURES.map(({key})=>[key,null])),photos:{},...extra});
const photo=(row)=>({id:crypto.randomUUID(),version:1,month:row.month,year:row.year,pose:'front',width:800,height:1200,dataUrl:'data:image/jpeg;base64,/9j/2Q=='});
test('reminder is 28 civil days, handles year/leap/DST without treating calendar month as four weeks',()=>{
 assert.equal(checkReminder([],'2026-11-01').due,true);
 assert.equal(checkReminder([check('2026-10-10')],'2026-11-06').due,false);assert.equal(checkReminder([check('2026-10-10')],'2026-11-07').due,true);
 assert.equal(checkReminder([check('2026-12-15')],'2027-01-01').next,'2027-01-12');assert.equal(checkReminder([check('2024-02-01')],'2024-02-29').due,true);
 assert.equal(checkReminder([check('2026-09-01')],'2026-09-29').due,true);assert.equal(checkReminder([check('2026-12-01')],'2026-11-01').last,null);
});
test('checks append immutable snapshots without changing journal, measures or training',()=>{
 const state=initialState(),before=structuredClone(state),row=check(),next=addMonthlyCheck(state,row,'2026-11-01');assert.deepEqual(state,before);assert.deepEqual(next.measurements,state.measurements);assert.deepEqual(next.logs,state.logs);assert.equal(next.monthlyChecks.length,1);
 assert.throws(()=>addMonthlyCheck(next,row,'2026-11-01'),/ya/);assert.throws(()=>addMonthlyCheck(state,check('2026-12-01'),'2026-11-01'),/Revisa/);
 for(const bad of [check('2026-02-30'),check('2026-10-01',{weight:0}),check('2026-10-01',{weight:null}),check('2026-10-01',{photos:{unknown:'x'}})])assert.ok(!validMonthlyCheck(bad));
 assert.deepEqual(checkOrder([check('2026-11-01'),row]).map(row=>row.month),['2026-10','2026-11']);
});
test('comparison distinguishes missing values from zero change and signed changes',()=>{
 const a=check(),b=check('2026-11-01',{weight:71});a.values.waist=70;b.values.waist=69;b.values.biceps=36;
 const rows=comparisonRows(a,b);assert.equal(rows[0].delta,1);assert.equal(rows.find(row=>row.key==='waist').delta,-1);assert.equal(rows.find(row=>row.key==='biceps').delta,null);
 b.weight=70;assert.equal(comparisonRows(a,b)[0].delta,0);assert.equal(comparisonRows(undefined,b)[0].delta,null);
});
test('canvas conversion is grayscale high contrast and dimensions never upscale or exceed1200',()=>{
 const pixels=new Uint8ClampedArray([255,0,0,255,0,255,0,255,128,128,128,255,255,255,255,255,0,0,0,255]);monochrome(pixels);
 for(let i=0;i<pixels.length;i+=4){assert.equal(pixels[i],pixels[i+1]);assert.equal(pixels[i],pixels[i+2]);assert.equal(pixels[i+3],255);}
 assert.equal(pixels[0],17);assert.equal(pixels[8],128);assert.equal(pixels[12],255);assert.equal(pixels[16],0);
 assert.deepEqual(photoDimensions(3000,4500),{width:800,height:1200});assert.deepEqual(photoDimensions(4000,1000),{width:1200,height:300});assert.deepEqual(photoDimensions(100,200),{width:100,height:200});
});
function backup(state,photos=[]){const rows=projectCollections(state,state.sessions??[]),{sessions:_,...cache}=state,records=Object.fromEntries(BACKUP_STORES.map(key=>[key,[]]));records.app=[{key:'state',value:{...cache,storageFormat:2}},...photos.map(value=>({key:PHOTO_PREFIX+value.id,value}))];for(const [key,values] of Object.entries(rows))records[key]=values.map(value=>({key:value.id,value}));return JSON.parse(JSON.stringify({format:'olympia-friends-backup',formatVersion:1,databaseName:'olympia-friends',databaseVersion:2,records}));}
test('backup preserves photos outside main state, validates references before import, and accepts old backups',()=>{
 const state=initialState(),row=check(),image=photo(row);row.photos.front=image.id;const next=addMonthlyCheck(state,row,'2026-11-01'),file=backup(next,[image]),result=validateBackup(file);
 assert.equal(validMonthlyPhoto(image),true);assert.equal(result.counts.checkPhotos,1);assert.equal(result.counts.monthlyChecks,1);assert.deepEqual(result.state.monthlyChecks,next.monthlyChecks);assert.deepEqual(result.records.app[1].value,image);assert.equal(JSON.stringify(result.records.app[0]).includes(image.dataUrl),false);assert.doesNotThrow(()=>validateBackup(backup(state)));
 for(const alter of [f=>f.records.app.pop(),f=>f.records.app[1].value.dataUrl='https://example.com/photo.jpg',f=>f.records.app[1].value.height=3000,f=>f.records.app[1].value.pose='side',f=>f.records.app[0].value.monthlyChecks[0].month='2026-09']){const bad=structuredClone(file);alter(bad);assert.throws(()=>validateBackup(bad));}
 const merged=combineStates(result.state,result.state);assert.deepEqual(merged.monthlyChecks,next.monthlyChecks);
});
