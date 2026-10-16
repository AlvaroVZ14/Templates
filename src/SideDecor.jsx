import {useEffect,useRef} from 'react';
import {useVisualEnvironment} from './VisualEffects.jsx';
export default function SideDecor({appearance}){
  const ref=useRef(null),{mode,visible}=useVisualEnvironment(appearance);
  useEffect(()=>{
    const element=ref.current;if(!element)return;
    let frame=0,x=0,y=0;
    const draw=()=>{frame=0;element.style.setProperty('--edge-x',x.toFixed(3));element.style.setProperty('--edge-y',y.toFixed(3));};
    const move=event=>{if(event.pointerType!=='mouse')return;x=event.clientX/innerWidth*2-1;y=event.clientY/innerHeight*2-1;if(!frame)frame=requestAnimationFrame(draw);};
    if(mode==='full'&&visible)window.addEventListener('pointermove',move,{passive:true});
    else{x=y=0;draw();}
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);};
  },[mode,visible]);
  if(mode==='off')return null;
  return <div ref={ref} className={`side-decor ${mode!=='full'||!visible?'is-paused':''}`} aria-hidden="true" data-testid="side-decor">
    <div className="side-column side-left"><span className="side-word">BLOOD &amp; GUTS</span><svg className="side-iron" viewBox="0 0 160 620" focusable="false"><g fill="none" stroke="currentColor"><path d="M79 10V610M85 10V610" strokeWidth="5"/><path d="M60 130H104V150H60ZM60 470H104V490H60Z"/><ellipse cx="82" cy="205" rx="65" ry="32" strokeWidth="8"/><ellipse cx="82" cy="220" rx="65" ry="32" strokeWidth="8"/><ellipse cx="82" cy="405" rx="65" ry="32" strokeWidth="8"/><ellipse cx="82" cy="420" rx="65" ry="32" strokeWidth="8"/><path d="M17 205V220M147 205V220M17 405V420M147 405V420" strokeWidth="8"/></g></svg><span className="side-scratches"/></div>
    <div className="side-column side-right"><span className="side-word">SIN ATAJOS · AL FALLO</span><div className="side-smoke"/><span className="side-scratches"/></div>
  </div>;
}
