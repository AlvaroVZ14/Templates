import {shiftDate} from '../wellness.js';
export const PHASE_NAMES = { bulk: 'Volumen', cut: 'Mini cut', maintain: 'Mantención' };
export const FOODS = [
  { id:'bread', name:'Pan', portion:1, unit:'unidades', description:'Unidad de referencia de unos 50 g', kcal:135, protein:4.5, carbs:27, fat:1.5 },
  { id:'egg', name:'Huevo', portion:1, unit:'unidades', description:'Unidad mediana/grande, sin aceite añadido', kcal:72, protein:6.3, carbs:.4, fat:4.8 },
  { id:'rice', name:'Arroz cocido', portion:100, unit:'g', description:'Pesado después de cocinar', kcal:130, protein:2.7, carbs:28, fat:.3 },
  { id:'chicken', name:'Pollo', preparation:'cocido', portion:100, unit:'g', description:'Pechuga sin piel; confirma cocido o crudo', kcal:165, protein:31, carbs:0, fat:3.6 },
  { id:'sopaipilla', name:'Sopaipillas', snack:true, portion:1, unit:'unidades', description:'Unidad mediana; muy variable según fritura', kcal:110, protein:2, carbs:14, fat:5 },
  { id:'empanada', name:'Empanadas de queso', snack:true, portion:1, unit:'unidades', description:'Unidad de referencia; ajusta tamaño y etiqueta', kcal:390, protein:12, carbs:37, fat:22 },
  { id:'cookie', name:'Galletas', snack:true, portion:1, unit:'unidades', description:'Unidad de referencia de unos 8 g', kcal:35, protein:.5, carbs:5.5, fat:1.3 },
];
export function chileDate(value=new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value).map(part=>[part.type,part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function migrateProgram(original,date=chileDate()) {
  if(original.schemaVersion>=5)return original;
  return {...original,schemaVersion:5,foods:structuredClone(FOODS),phases:original.phases??[],phaseHistory:[],goalRevisions:[],baseIntake:null,nutritionDays:{},nutritionDayHistory:[],mealPlans:{},planHistory:[],planOptions:{},foodLogs:[],calendar:{},recovery:{},cardioDays:{},cardioEvents:[],cardioPreferences:{},dismissedAlerts:{},programSettings:{proteinRatio:1.8,restReduction:0,maintenanceSnack:.2,trainingTime:'18:00',fatigueThreshold:8}};
}
