export const PREPARATION_STEPS = {
  0: [],
  1: [{percent:60,reps:8}],
  2: [{percent:50,reps:10,repRange:'10–12'},{percent:75,reps:8}],
  3: [{percent:40,reps:10},{percent:60,reps:6},{percent:80,reps:3}],
};
export function migratePreparation(state){
  if(state.schemaVersion>=7)return state;
  const routine=state.routine.map(list=>{
    const seen=new Set();
    return list.map(ex=>{
      const oldDefault=!seen.has(ex.muscle)||ex.compound?2:1;seen.add(ex.muscle);
      // Preserve identifiable custom counts from older versions; defaults become automatic.
      const override=Object.hasOwn(ex,'preparationOverride')?ex.preparationOverride:ex.approaches!==oldDefault?ex.approaches:null;
      return {...ex,preparationOverride:override,preparationJoint:ex.preparationJoint??''};
    });
  });
  return {...state,schemaVersion:7,routine,preparationSettings:{minimum:0,general:false,generalMinutes:5,rotators:false},preparationActivities:{}};
}
const zone=ex=>ex.preparationJoint?.trim()||ex.muscle;
const isolation=ex=>!ex.compound||ex.equipment==='machine';
export function contextualPreparation(ex,list,minimum=0){
  const index=list.findIndex(item=>item.id===ex.id),prior=index<0?[]:list.slice(0,index);
  const same=prior.filter(item=>item.muscle===ex.muscle&&zone(item)===zone(ex));
  let count,reason,light=false;
  if(!same.length){count=2;reason=`Primer ejercicio de ${ex.muscle}${ex.preparationJoint?` · zona ${ex.preparationJoint}`:''}: 2 previas.`;}
  else if(isolation(ex)){
    light=true;
    const previousIsolation=same.some(isolation);
    count=previousIsolation?0:1;
    reason=previousIsolation?'Músculo ya caliente y aislamiento/máquina ya preparado: 0 previas.':'Músculo ya caliente: primer aislamiento/máquina, 1 muy ligera (45% × 10).';
  }else{count=1;reason='Músculo ya caliente: compuesto posterior, 1 ligera (60% × 8).';}
  const automatic=count,override=ex.preparationOverride;
  if(Number.isInteger(override)&&override>=0&&override<=3){count=override;reason=`Tu ajuste guardado: ${count} previas. Regla automática: ${automatic}. ${reason}`;}
  if(count<minimum){count=minimum;reason+=` Mínimo global: ${minimum}.`;}
  const steps=count===1&&light?[{percent:45,reps:10}]:PREPARATION_STEPS[count];
  return {approaches:count,preparationSteps:steps,preparationReason:reason,automaticApproaches:automatic};
}
export function setPreparationCount(state,id,count){
  if(count!==null&&(!Number.isInteger(count)||count<0||count>3))throw new Error('Elige de 0 a 3 previas, o Automático.');
  return {...state,routine:state.routine.map(list=>list.map(ex=>ex.id===id?{...ex,preparationOverride:count}:ex))};
}
export function isPressDay(exercises){return exercises.some(ex=>/press/i.test(ex.name)||ex.compound&&['Pecho','Hombro'].includes(ex.muscle));}
