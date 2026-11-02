import {shiftDate,validDate} from './wellness.js';
export const PROFILE_PHASES={bulk:'Volumen',cut:'Definición',maintain:'Mantención'};
export const PROFILE_DEFAULTS={name:'',age:null,birthDate:'',sex:'',heightCm:null,weightKg:null,bodyFat:null,phase:'bulk',targetWeight:null,goalDate:'',experience:0,trainingDays:5,trainingTime:'18:00',bedTime:'23:00',wakeTime:'07:00',mealsPerDay:4,foodIds:['bread','egg','rice','chicken','apple'],avoidIds:[],avoidText:'',supplements:[],cardioMinutes:25,units:'metric',deficit:.175};
export const dayGap=(a,b)=>Math.round((Date.parse(`${b}T12:00:00Z`)-Date.parse(`${a}T12:00:00Z`))/86400000);
export function profileForDate(state,date){return state.personalProfile?.date<=date?state.personalProfile:(state.profileHistory??[]).filter(row=>row.date<=date).sort((a,b)=>a.date.localeCompare(b.date)||(a.profile.savedAt??'').localeCompare(b.profile.savedAt??'')).at(-1)?.profile??null;}
export function profileAge(profile,date){if(profile.birthDate&&validDate(profile.birthDate)){const [y,m,d]=profile.birthDate.split('-').map(Number),[cy,cm,cd]=date.split('-').map(Number);return cy-y-(cm<m||cm===m&&cd<d?1:0);}return profile.age;}
export function profileWeight(state,date,profile=profileForDate(state,date)){
 const latest=[...Object.entries(state.journal??{}),...(state.monthlyChecks??[]).map(row=>[row.date,{weight:row.weight}])].filter(([day,row])=>day<=date&&row.weight>0).sort(([a],[b])=>a.localeCompare(b)).at(-1);
 return latest&&(!profile?.weightKg||latest[0]>=(profile.weightDate??profile.date??''))?latest[1].weight:profile?.weightKg??null;
}
export function activityFactor(days){return days===0?1.2:days<=2?1.375:days<=5?1.55:1.725;}
export function profileNutrition(profile,date,{weight=profile?.weightKg,phase=profile?.phase}={}){
 if(!profile)return null;const age=profileAge(profile,date);
 if(!(weight>0)||!(profile.heightCm>0)||!(age>=18&&age<=100)||!['male','female'].includes(profile.sex))return null;
 const basal=10*weight+6.25*profile.heightCm-5*age+(profile.sex==='male'?5:-161),factor=activityFactor(profile.trainingDays),maintenance=basal*factor;
 const deficit=Math.max(0,Math.min(.25,Number(profile.deficit??.175))),raw=maintenance*(phase==='bulk'?1.1:phase==='cut'?1-deficit:1);
 const protein=Number((2*weight).toFixed(1)),fat=Number((.9*weight).toFixed(1)),macroFloor=protein*4+fat*9,kcal=Math.max(Math.ceil(basal),Math.ceil(maintenance*.75),Math.ceil(macroFloor),Math.round(raw)),carbs=Number(((kcal-macroFloor)/4).toFixed(1));
 return {basal,activityFactor:factor,maintenance,kcal,protein,fat,carbs,weight,proteinRatio:2,restReduction:0,snackBudget:phase==='cut'?.1:.2,baseIntake:maintenance,phaseKind:phase,limited:raw<basal||raw<macroFloor||Number(profile.deficit??.175)>.25};
}
export function goalPace(profile,date){
 const weight=profile.weightKg,target=profile.targetWeight,days=validDate(profile.goalDate)?dayGap(date,profile.goalDate):null;
 if(!(weight>0)||!(target>0)||days==null)return null;
 const delta=target-weight,weekly=days>0?delta*7/days:null,range=profile.phase==='bulk'?[weight*.0025,weight*.005]:profile.phase==='cut'?[-weight*.01,-weight*.005]:[-weight*.001,weight*.001];
 const wrong=profile.phase==='bulk'?delta<0:profile.phase==='cut'?delta>0:Math.abs(delta)>weight*.02;
 const unrealistic=days<=0&&Math.abs(delta)>.1||wrong||weekly!=null&&(weekly<range[0]||weekly>range[1]);
 const typical=profile.phase==='bulk'?weight*.00375:profile.phase==='cut'?weight*.0075:weight*.001;
 return {days,weekly,range,wrong,unrealistic,suggestedDate:!wrong&&Math.abs(delta)>.1?shiftDate(date,Math.max(7,Math.ceil(Math.abs(delta)/typical*7))):null};
}
export function sleepHours(profile){const minutes=time=>{const [h,m]=(time??'').split(':').map(Number);return h*60+m;};const hours=((minutes(profile.wakeTime)-minutes(profile.bedTime)+1440)%1440)/60;return Number.isFinite(hours)&&hours>0?hours:8;}
export function validateProfile(p,date=p.date){
 if(typeof p.name!=='string'||!p.name.trim()||p.name.length>40)return 'Escribe tu nombre (máximo 40 caracteres).';
 if(!Object.hasOwn(PROFILE_PHASES,p.phase))return 'Elige tu objetivo.';
 for(const [key,min,max] of [['age',10,100],['heightCm',100,250],['weightKg',25,500],['bodyFat',2,65],['targetWeight',25,500],['experience',0,60],['trainingDays',0,7],['mealsPerDay',2,6],['cardioMinutes',0,60]])if(p[key]!=null&&(!Number.isFinite(p[key])||p[key]<min||p[key]>max))return `Revisa ${key}: ${min}–${max}.`;
 if(!['','male','female'].includes(p.sex)||!['metric','imperial'].includes(p.units))return 'Revisa sexo y unidades.';
 if(!['trainingDays','mealsPerDay','cardioMinutes'].every(key=>Number.isInteger(p[key]))||!Number.isFinite(p.deficit)||p.deficit<0||p.deficit>1)return 'Revisa frecuencia, comidas, cardio y déficit.';
 for(const key of ['birthDate','goalDate'])if(p[key]&&!validDate(p[key]))return 'Revisa la fecha.';
 if(p.birthDate&&date&&p.birthDate>date)return 'La fecha de nacimiento no puede estar en el futuro.';
 for(const key of ['trainingTime','bedTime','wakeTime'])if(p[key]&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(p[key]))return 'Revisa los horarios.';
 for(const key of ['foodIds','avoidIds','supplements'])if(!Array.isArray(p[key])||p[key].some(value=>typeof value!=='string'||value.length>100))return 'Revisa las selecciones del perfil.';
 if(typeof p.avoidText!=='string'||p.avoidText.length>300)return 'Usa hasta 300 caracteres para alimentos que evitas.';
 return null;
}
export function profileGoal(state,date){const p=profileForDate(state,date);if(!p)return null;const weight=profileWeight(state,date,p),target=p.targetWeight,start=p.startWeight??p.weightKg,days=p.goalDate?dayGap(date,p.goalDate):null;
 const reached=weight&&target&&(p.phase==='bulk'?weight>=target-.5:p.phase==='cut'?weight<=target+.5:false);
 return {profile:p,weight,target,days,remaining:weight&&target?Math.abs(target-weight):null,progress:start&&target&&weight?Math.abs(target-start)<.1?1:Math.min(1,Math.max(0,(weight-start)/(target-start))):0,due:days!=null&&days<=0||Boolean(reached)};
}
