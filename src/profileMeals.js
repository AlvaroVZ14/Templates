import {profileForDate} from './profile.js';
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function generateProfilePlan(state,date,target,context,{foodItem,sumItems}){
 const profile=profileForDate(state,date),avoided=new Set(profile.avoidIds),words=profile.avoidText.split(/[,;\n]/).map(value=>normalize(value.trim())).filter(Boolean);
 const foods=state.foods.filter(food=>profile.foodIds.includes(food.id)&&!avoided.has(food.id)&&!words.some(word=>normalize(food.name).includes(word))&&food.portion>0&&food.kcal>0);
 if(!foods.length)throw new Error('Elige al menos un alimento que comes en Ajustes → Perfil.');
 const cap=target.kcal*(target.phaseKind==='cut'?.1:.2),quantities=Object.fromEntries(foods.map(food=>[food.id,food.id==='apple'?Math.min(2,state.programSettings.appleCount??1):0]));
 const items=values=>foods.filter(food=>values[food.id]>0).map(food=>foodItem(food,values[food.id]));
 const score=total=>['kcal','protein','fat','carbs'].reduce((sum,key)=>sum+Math.pow((total[key]-target[key])/Math.max(1,target[key]),2)*({kcal:3,protein:4,fat:3,carbs:1}[key]),0);
 const totals=values=>foods.reduce((sum,food)=>Object.fromEntries(['kcal','protein','fat','carbs'].map(key=>[key,sum[key]+food[key]*values[food.id]/food.portion])),{kcal:0,protein:0,fat:0,carbs:0});
 let best=score(totals(quantities));
 for(let iteration=0;iteration<600;iteration++){
  let winner=null;
  for(const food of foods){if(food.id==='apple')continue;const step=food.unit==='g'?10:food.id==='bread'?.5:1,max=food.id==='rice'?2000:food.id==='chicken'?700:food.id==='egg'?12:food.id==='bread'?8:food.snack?Math.floor(cap/food.kcal)*food.portion:10*food.portion;
   for(const direction of [-1,1]){const quantity=quantities[food.id]+direction*step;if(quantity<0||quantity>max)continue;const trial={...quantities,[food.id]:quantity};if(foods.filter(item=>item.snack).reduce((sum,item)=>sum+item.kcal*trial[item.id]/item.portion,0)>cap)continue;const value=score(totals(trial));if(value<best-1e-8&&(!winner||value<winner.score))winner={id:food.id,quantity,score:value};}
  }
  if(!winner)break;quantities[winner.id]=winner.quantity;best=winner.score;
 }
 const count=profile.mealsPerDay??4,meals=Array.from({length:count},(_,slot)=>({slot,name:`Comida ${slot+1}`,items:[],timing:slot===Math.min(1,count-1)&&context.type!=='rest'?'1–2 h antes de pesas':'Horario editable',time:`${String(8+Math.round(slot*13/Math.max(1,count-1))).padStart(2,'0')}:00`}));
 for(const food of foods){let remaining=quantities[food.id];const step=food.unit==='g'?10:food.id==='bread'?.5:1;let index=0;while(remaining>1e-8){const meal=meals[index++%count],amount=Math.min(step,remaining),old=meal.items.find(item=>item.food.id===food.id);if(old){const next=foodItem(food,old.quantity+amount);Object.assign(old,next);}else meal.items.push(foodItem(food,amount));remaining-=amount;}}
 for(const meal of meals)meal.macros=sumItems(meal.items);const all=meals.flatMap(meal=>meal.items),total=sumItems(all);
 return {id:crypto.randomUUID(),date,target:structuredClone(target),context:structuredClone(context),meals,total,appleCount:quantities.apple??0,snackKcal:all.filter(item=>item.food.snack).reduce((sum,item)=>sum+item.macros.kcal,0),snackCap:cap,snackWarning:false,profilePlan:true,profileWarning:Math.abs(total.kcal-target.kcal)>target.kcal*.1||total.protein<target.protein*.9||total.fat<target.fat*.8?'Los alimentos elegidos no cubren bien todas las metas. Revisa cantidades o amplía tu selección en Perfil. No se añaden alimentos que evitas.':null,createdAt:new Date().toISOString()};
}
