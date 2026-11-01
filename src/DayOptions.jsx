import CardioToday from './CardioToday.jsx';
import Cardio from './Cardio.jsx';
import PhasePanel from './program/PhasePanel.jsx';
import TodayPlan from './program/TodayPlan.jsx';
import Recovery from './program/Recovery.jsx';
import { TrainingRecovery } from './TrainingPanels.jsx';
import {PainOverview} from './Pain.jsx';
import {SessionEditor} from './SessionRecord.jsx';
import {sessionExercise} from './training.js';
import {dayContext} from './program/nutrition.js';
import {restMessage} from './calendarText.js';
import {localDate} from './domain.js';
export default function DayOptions({data,date,change,saving,onFood,onDiary,onMeasures,onPain,gymActive,wake,audio,gymSound}){
 const exercises=dayContext(data,date).exercises.map(ex=>sessionExercise(data,ex,date));
 const rest=exercises.length?null:restMessage(data,date,localDate());
 return <><div className="page-heading"><h1>Cardio y recuperación</h1></div><PainOverview data={data} date={date} onOpen={onPain}/>{rest&&<div className="rest-card" data-testid="rest-card"><h3>{rest.title}</h3><p>{rest.text}</p></div>}<div className="day-options">
      <CardioToday key={`cardio-today-${date}`} data={data} date={date} change={change} saving={saving}/>
      <PhasePanel key={`phase-${date}`} data={data} date={date} change={change} saving={saving} compact/>
      <SessionEditor key={`session-${date}`} data={data} date={date} change={change} saving={saving}/>
      <TrainingRecovery key={`recovery-${date}`} data={data} date={date} exercises={exercises} change={change} saving={saving}/>
      <TodayPlan key={`plan-${date}`} data={data} date={date} change={change} saving={saving} onFood={onFood}/>
      <Cardio key={date} data={data} date={date} change={change} saving={saving}/>
      <Recovery data={data} date={date} change={change} saving={saving} onDiary={onDiary} onMeasures={onMeasures}/>
      {gymActive&&<><p role="status">{wake.status==='held'?'Pantalla encendida':wake.status==='unsupported'?'Pantalla encendida no disponible':wake.status==='denied'?'El navegador no permitió mantener la pantalla encendida':'Modo gimnasio activo'}</p><label className="check-label"><input type="checkbox" checked={data.gymSettings?.sound===true} onChange={event=>gymSound(event.target.checked)}/><span>Aviso sonoro de descanso</span></label>{data.gymSettings?.sound&&!audio.armed&&<button type="button" className="secondary" onClick={audio.arm}>Habilitar sonido</button>}</>}
    </div></>;
}
