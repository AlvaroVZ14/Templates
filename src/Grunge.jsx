import {useEffect,useRef,useState} from 'react';
import {sessionTitle,sessionName} from './calendarText.js';

export function Cracks({header=false}){
  return <svg className={`grunge-cracks ${header?'header-cracks':''}`} viewBox="0 0 240 120" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M238 1 207 17 216 28 182 43 193 51 159 73M216 28 228 52 218 65M182 43 155 35 137 43M2 119 20 98 16 83 40 65 34 57 61 38M20 98 44 95 52 79M40 65 61 69"/></svg>;
}
export function Stamp({children,record=false}){return <span className={`grunge-stamp ${record?'record-stamp':''}`}>{children}</span>;}
export function PosterTitle({exercises}){
  const name=sessionName(exercises),group=['Pierna','Torso'].includes(name);
  const muscles=[...new Set(exercises.map(ex=>ex.muscle))];
  const ordered=muscles.toSorted((a,b)=>exercises.filter(ex=>ex.muscle===b).reduce((sum,ex)=>sum+ex.sets,0)-exercises.filter(ex=>ex.muscle===a).reduce((sum,ex)=>sum+ex.sets,0));
  return <h2 className="poster-session" aria-label={sessionTitle(exercises)}><span aria-hidden="true"><strong>{group?name:ordered[0]}</strong>{!group&&ordered.length>1&&<em>Y</em>}<small>{(group?muscles:ordered.slice(1)).join(' + ')||'UNA SERIE. TODA TU INTENCIÓN.'}</small></span></h2>;
}
export function IronSilhouettes(){
  return <svg className="iron-collage" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="9"><path d="M65 470V100h210v370M65 135l110-75 100 75M175 62v280M96 347h160M175 310l80 135M440 475V60h225v415M440 95h225M462 165h180M520 168v188l100 85M448 460h222M330 340l400-75"/><ellipse cx="353" cy="333" rx="22" ry="69" transform="rotate(-12 353 333)"/><ellipse cx="701" cy="270" rx="22" ry="69" transform="rotate(-12 701 270)"/><path d="M320 350l-28 6m430-92 25-6"/></g></svg>;
}

// Pure presentation state: this key never changes or clears training storage.
const INTRO_KEY='heavy-duty-grunge-intro-day';
export default function GrungeAtmosphere({ready,day,scene,mode,visible,gym,name}){
  const [intro,setIntro]=useState(false),[cut,setCut]=useState(0);
  const last=useRef(scene),considered=useRef(false),introTimer=useRef(),cutTimer=useRef();
  const active=mode==='full'&&visible&&!gym;
  useEffect(()=>{
    if(!ready||considered.current)return;
    considered.current=true;
    let seen=false;try{seen=localStorage.getItem(INTRO_KEY)===day;localStorage.setItem(INTRO_KEY,day);}catch{/* Only the optional presentation may repeat if storage is unavailable. */}
    if(seen||!active)return;
    setIntro(true);introTimer.current=setTimeout(()=>setIntro(false),1300);
    return()=>clearTimeout(introTimer.current);
  },[ready]);
  useEffect(()=>{
    const changed=last.current!==scene;last.current=scene;
    if(!changed||!active)return;
    setCut(value=>value+1);clearTimeout(cutTimer.current);cutTimer.current=setTimeout(()=>setCut(0),360);
  },[scene,active]);
  useEffect(()=>{if(!active){setIntro(false);setCut(0);clearTimeout(introTimer.current);clearTimeout(cutTimer.current);}},[active]);
  useEffect(()=>()=>{clearTimeout(introTimer.current);clearTimeout(cutTimer.current);},[]);
  return <>
    <div className="grunge-film" aria-hidden="true"><span className="film-dust"/><span className="film-scratches"/><span className="film-vignette"/></div>
    {intro&&<button type="button" className="grunge-intro" aria-label="Omitir apertura" onClick={()=>{clearTimeout(introTimer.current);setIntro(false);}}><span className="intro-reel" aria-hidden="true">REGISTRO PERSONAL · EDICIÓN GRUNGE</span><strong>{name}</strong><span>POCAS SERIES. TODA TU INTENCIÓN.</span><small>Toca para continuar</small></button>}
    {cut>0&&<div key={cut} className="grunge-cut" aria-hidden="true"/>}
  </>;
}
