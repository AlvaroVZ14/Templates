import {dayContext} from './program/nutrition.js';
import {cardioRecommendation} from './program/cardio.js';
import {sessionName} from './calendarText.js';
import {weeklySessions} from './simpleHome.js';
import Brand from './Brand.jsx';
import {appearanceFor} from './Appearance.jsx';
import {ProfileGoal,ProfileSleep} from './Profile.jsx';
export default function SimpleHome({data,date,onStart,saving,change}){
  const context=dayContext(data,date),cardio=cardioRecommendation(data,date),week=weeklySessions(data,date);
  const day=new Date(`${date}T12:00:00Z`).toLocaleDateString('es-CL',{weekday:'long',timeZone:'UTC'});
  return <section className="simple-home" aria-label="Entrenamiento de hoy">
    {data.personalProfile&&<><ProfileGoal data={data} date={date} change={change} saving={saving}/><ProfileSleep data={data} compact/></>}
    <Brand name={appearanceFor(data).name} full/>
    <h1>{day} <span>·</span> {context.exercises.length?sessionName(context.exercises):'Descanso'}</h1>
    <p className="home-cardio">{cardio.minutes>0?`Cardio: ${cardio.minutes.toLocaleString('es-CL')} min · ${cardio.type.toLowerCase()}`:'Cardio: 0 min · solo pasos'}</p>
    <button className="primary home-start" disabled={saving||!context.exercises.length} onClick={onStart}>EMPEZAR ENTRENAMIENTO</button>
    <div className="home-week"><span>{week.done}/{week.planned} sesiones esta semana</span><progress aria-label="Progreso semanal" value={week.done} max={Math.max(1,week.planned)}/></div>
  </section>;
}
