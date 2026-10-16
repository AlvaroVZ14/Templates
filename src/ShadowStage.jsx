import {useEffect,useRef,useState} from 'react';
import {useVisualEnvironment} from './VisualEffects.jsx';
import {clamp} from './particles.js';
import {motivationPhrases,selectMotivation} from './motivation.js';
import useTilt from './useTilt.js';

const control='button,input,select,textarea,a,summary,[contenteditable]';
export default function ShadowStage({appearance,data,date,className='',children}){
  const element=useRef(null),{mode,visible}=useVisualEnvironment(appearance),active=mode==='full'&&visible;
  const [tensing,setTensing]=useState(false),[releasing,setReleasing]=useState(false),[quote,setQuote]=useState(null);
  const motion=useRef({x:0,y:0,targetX:0,targetY:0,spotX:68,spotY:45}),frame=useRef(0),holdTimer=useRef(0),releaseTimer=useRef(0),quoteTimer=useRef(0),gesture=useRef(null),lastGesture=useRef(null),lastTouch=useRef(0),quoteNumber=useRef(0);
  const tilt=useTilt(active,({x,y})=>{if(gesture.current||performance.now()-lastTouch.current<800)return;motion.current.targetX=x;motion.current.targetY=y;motion.current.spotX=clamp(68+x*20,10,90);motion.current.spotY=clamp(45+y*20,10,90);schedule();});

  function schedule(){
    if(frame.current||!active)return;
    const tick=()=>{
      frame.current=0;if(document.hidden||!element.current)return;
      const state=motion.current;state.x+=(state.targetX-state.x)*.13;state.y+=(state.targetY-state.y)*.13;
      element.current.style.setProperty('--shadow-x',state.x.toFixed(4));element.current.style.setProperty('--shadow-y',state.y.toFixed(4));
      element.current.style.setProperty('--spot-x',`${state.spotX}%`);element.current.style.setProperty('--spot-y',`${state.spotY}%`);
      if(Math.abs(state.x-state.targetX)+Math.abs(state.y-state.targetY)>.001)frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  }
  function point(event){
    const bounds=element.current.getBoundingClientRect(),state=motion.current;
    state.spotX=clamp((event.clientX-bounds.left)/bounds.width*100,0,100);state.spotY=clamp((event.clientY-bounds.top)/bounds.height*100,0,100);
    state.targetX=state.spotX/50-1;state.targetY=state.spotY/50-1;schedule();
  }
  function release(pulse=true){
    clearTimeout(holdTimer.current);const held=gesture.current?.held;
    if(gesture.current)lastGesture.current={...gesture.current};gesture.current=null;setTensing(false);
    if(held&&pulse){setReleasing(true);clearTimeout(releaseTimer.current);releaseTimer.current=setTimeout(()=>setReleasing(false),650);}
  }
  function down(event){
    if(!active||!event.isPrimary||event.button!==0||event.target.closest(control))return;
    point(event);lastGesture.current=null;lastTouch.current=performance.now();gesture.current={x:event.clientX,y:event.clientY,id:event.pointerId,touch:event.pointerType!=='mouse',held:false,moved:false};
    holdTimer.current=setTimeout(()=>{if(gesture.current&&!gesture.current.moved){gesture.current.held=true;setTensing(true);}},260);
  }
  function move(event){
    if(!active||!event.isPrimary||event.target.closest(control))return;
    const current=gesture.current;
    if(current){lastTouch.current=performance.now();if(current.touch&&Math.hypot(event.clientX-current.x,event.clientY-current.y)>12){current.moved=true;clearTimeout(holdTimer.current);setTensing(false);}}
    if(!current?.moved)point(event);
  }
  function leave(){release();motion.current.targetX=motion.current.targetY=0;schedule();}
  function showQuote(){
    const day=selectMotivation(data,date),bank=motivationPhrases(data);
    const relevant=bank.filter(phrase=>phrase.context==='general'||(day.resting?phrase.context==='rest':day.muscles.includes(phrase.context)||phrase.context===day.phase));
    const short=relevant.filter(phrase=>phrase.text.length<=90),choices=short.length?short:relevant;
    const index=quoteNumber.current++,text=choices.length?choices[index%choices.length].text:day.text;
    setQuote({text,id:index});clearTimeout(quoteTimer.current);quoteTimer.current=setTimeout(()=>setQuote(null),2800);
  }
  function click(event){if(active&&!event.target.closest(control)&&!lastGesture.current?.moved&&!lastGesture.current?.held)showQuote();lastGesture.current=null;}
  function keyDown(event){
    if(!active||event.target!==event.currentTarget||event.repeat)return;
    if(event.key==='Enter'){event.preventDefault();showQuote();}
    if(event.key===' '){event.preventDefault();gesture.current={held:true,moved:false};setTensing(true);}
    if(event.key==='Escape'){setQuote(null);release(false);}
  }
  useEffect(()=>{
    if(!active){cancelAnimationFrame(frame.current);frame.current=0;clearTimeout(holdTimer.current);clearTimeout(releaseTimer.current);clearTimeout(quoteTimer.current);gesture.current=null;setTensing(false);setReleasing(false);setQuote(null);motion.current={x:0,y:0,targetX:0,targetY:0,spotX:68,spotY:45};if(element.current){element.current.style.setProperty('--shadow-x','0');element.current.style.setProperty('--shadow-y','0');}return;}
    const cancel=()=>release();window.addEventListener('pointerup',cancel,{passive:true});window.addEventListener('pointercancel',cancel,{passive:true});window.addEventListener('blur',cancel);
    return()=>{window.removeEventListener('pointerup',cancel);window.removeEventListener('pointercancel',cancel);window.removeEventListener('blur',cancel);cancelAnimationFrame(frame.current);frame.current=0;clearTimeout(holdTimer.current);clearTimeout(releaseTimer.current);clearTimeout(quoteTimer.current);};
  },[active]);
  return <section ref={element} className={`session-hero shadow-interactive ${className} ${tilt.available?'has-tilt':''} ${tensing?'is-tensing':''} ${releasing?'is-releasing':''} ${active?'shadow-enabled':''}`} tabIndex={active?0:undefined} aria-label="The Shadow: escenario de la sesión" data-effects={mode} onPointerDown={down} onPointerMove={move} onPointerUp={()=>release()} onPointerCancel={()=>release(false)} onPointerLeave={leave} onClick={click} onKeyDown={keyDown} onKeyUp={event=>{if(event.key===' '&&event.target===event.currentTarget){event.preventDefault();release();}}} onContextMenu={event=>{if(active&&!event.target.closest(control))event.preventDefault();}}>
    {children}
    {active&&<div className="shadow-instructions"><span>Mueve · mantén pulsado · toca para una frase</span>{tilt.available&&<div className="tilt-controls"><button className="shadow-sensor" type="button" onClick={tilt.toggle} disabled={tilt.busy} aria-pressed={tilt.enabled}>{tilt.enabled?'Desactivar inclinación':'Activar inclinación'}</button><small>{tilt.enabled?'Inclinar el teléfono mueve el foco y las capas.':'Desactivada por defecto: al inclinar el teléfono mueve el foco y las capas.'}</small></div>}{tilt.message&&<span className="shadow-sensor-message" role="status">{tilt.message}</span>}</div>}
    {quote&&active&&<p key={quote.id} className="shadow-quote" role="status" aria-live="polite">{quote.text}</p>}
  </section>;
}
