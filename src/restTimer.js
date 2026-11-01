export function adjustRestTimer(state,delta,now=Date.now()){
 if(!state.timer||![-15,15].includes(delta)||!Number.isFinite(state.timer.end))return state;
 const timer=state.timer,end=Math.max(now,Math.max(now,timer.end)+delta*1000);
 const duration=Number.isFinite(timer.duration)?timer.duration:Math.max(1,(timer.end-now)/1000);
 const start=Number.isFinite(timer.startedAt)?timer.startedAt:timer.end-duration*1000;
 return {...state,timer:{...timer,end,duration:Math.max(1,(end-start)/1000)}};
}
export function restTimerLabel(data,timer){
 const source=data.logs.find(row=>row.id===timer?.sourceLogId);
 if(['warmup','approach'].includes(source?.kind))return 'Preparación 1–2 min';
 if(source?.kind==='rp')return 'Rest-pause 15–20 s';
 if(source?.kind==='drop')return 'Drop 10–15 s';
 const exercise=data.routine.flat().find(ex=>ex.id===source?.exerciseId||ex.name===timer?.label);
 if(!exercise)return 'Descanso';
 return exercise.compound||['heavy','compound'].includes(exercise.loadType)?'Compuesto 2–3 min':'Aislamiento 1,5–2 min';
}
