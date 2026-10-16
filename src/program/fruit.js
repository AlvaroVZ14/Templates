export const APPLE={id:'apple',name:'Manzana',category:'fruit',snack:false,portion:1,unit:'unidades',description:'Manzana mediana con piel, unos 182 g. Valores aproximados y editables.',kcal:95,protein:.5,carbs:25.1,fat:.3,fiber:4.4};
export function migrateFruit(state){
  if(state.fruitVersion===1)return state;
  return {...state,fruitVersion:1,foods:state.foods.some(food=>food.id==='apple')?state.foods:[...state.foods,structuredClone(APPLE)],programSettings:{appleCount:1,...state.programSettings}};
}
export function appleCount(state){return [0,1,2].includes(state.programSettings.appleCount)?state.programSettings.appleCount:1;}
export function fruitProgress(state,date){
  const logs=state.foodLogs.filter(log=>log.date===date),count=logs.flatMap(log=>log.items).filter(item=>item.food.id==='apple').reduce((sum,item)=>sum+item.quantity,0);
  return {count,target:appleCount(state),own:logs.find(log=>log.id===`fruit-${date}`)};
}
