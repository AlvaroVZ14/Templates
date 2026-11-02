import {PROFILE_DEFAULTS,validateProfile,profileNutrition,profileWeight,sleepHours} from './profile.js';
import {activatePhase,phaseForDate} from './program/phases.js';
export function savePersonalProfile(state,value,date){
 const profile={...PROFILE_DEFAULTS,...value,name:typeof value.name==='string'?value.name.trim():''},invalid=validateProfile(profile,date);if(invalid)throw new Error(invalid);
 const old=state.personalProfile,goalChanged=!old||old.phase!==profile.phase||old.targetWeight!==profile.targetWeight||old.goalDate!==profile.goalDate;
 profile.date=date;profile.savedAt=new Date().toISOString();profile.weightDate=date;profile.startWeight=goalChanged?profile.weightKg:old.startWeight;profile.goalStartDate=goalChanged?date:old.goalStartDate??old.date;profile.version=1;
 let next={...state,personalProfile:profile,profileHistory:[...(state.profileHistory??[]),{id:crypto.randomUUID(),date,profile:structuredClone(profile)}],onboarding:{status:'done'},profileDraft:null,settings:{...state.settings,sleepGoal:Math.max(7,Math.min(9,sleepHours(profile)))},programSettings:{...state.programSettings,trainingTime:profile.trainingTime||'18:00'}};
 const phase=phaseForDate(state,date);
 if(goalChanged||phase?.kind!==profile.phase)next=activatePhase(next,{kind:profile.phase,targetWeight:profile.targetWeight,deadline:profile.goalDate||null,windowStart:null},date,date);
 const nutrition=profileNutrition(profile,date),phaseId=phaseForDate(next,date)?.id;
 const nutritionDays={...next.nutritionDays},mealPlans={...next.mealPlans};
 if(nutritionDays[date])next={...next,nutritionDayHistory:[...next.nutritionDayHistory,{date,...structuredClone(nutritionDays[date]),reason:'Perfil actualizado explícitamente',at:profile.savedAt}]};
 if(mealPlans[date]){next={...next,planHistory:[...next.planHistory,structuredClone(mealPlans[date])]};delete mealPlans[date];}
 if(nutrition)nutritionDays[date]={target:{...nutrition,phaseId,fromProfile:true},complete:false};else delete nutritionDays[date];
 next={...next,nutritionDays,mealPlans,...(nutrition?{baseIntake:nutrition.maintenance,programSettings:{...next.programSettings,proteinRatio:2,restReduction:0}}:{})};
 return next;
}
export function initialProfile(state,date){return {...PROFILE_DEFAULTS,...state.personalProfile,weightKg:profileWeight(state,date)??null};}
