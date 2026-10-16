import {useEffect,useRef,useState} from 'react';
import {advanceParticles,createParticles,particleBudget} from './particles.js';

export function visualMode(appearance,reducedMotion=false){
  if(reducedMotion||appearance.motion===false||appearance.effects==='off')return 'off';
  return appearance.effects==='reduced'?'reduced':'full';
}
export function useVisualEnvironment(appearance){
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible,setVisible]=useState(()=>!document.hidden);
  useEffect(()=>{
    const query=matchMedia('(prefers-reduced-motion: reduce)'),motion=()=>setReduced(query.matches),visibility=()=>setVisible(!document.hidden);
    query.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
    return()=>{query.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  return {mode:visualMode(appearance,reduced),visible,reduced};
}

const excluded='button,input,select,textarea,label,a,summary,dialog,[contenteditable]';
function sprites(){
  return ['#C8102E','#FF1A1A','#A6ABB1'].map(color=>{
    const sprite=document.createElement('canvas');sprite.width=sprite.height=32;
    const ctx=sprite.getContext('2d');if(!ctx)return sprite;
    const glow=ctx.createRadialGradient(16,16,0,16,16,16);glow.addColorStop(0,color);glow.addColorStop(.15,color+'D0');glow.addColorStop(.4,color+'50');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.fillRect(0,0,32,32);return sprite;
  });
}

export default function ParticleBackground({appearance,page}){
  const canvas=useRef(null),{mode,visible}=useVisualEnvironment(appearance);
  useEffect(()=>{
    const element=canvas.current;if(!element||mode==='off')return;
    const context=element.getContext('2d',{alpha:true});if(!context)return;
    const coarse=matchMedia('(pointer: coarse)').matches,glows=sprites(),pointer={active:false,x:0,y:0},waves=[];
    let width=0,height=0,budget,particles=[],frame=0,last=0,slowFrames=0;
    const draw=time=>{
      context.clearRect(0,0,width,height);
      for(const particle of particles){
        context.globalAlpha=particle.alpha*(.8+Math.sin(time*.001+particle.phase)*.2);
        if(particle.trail>0){context.strokeStyle=['#C8102E','#FF1A1A','#A6ABB1'][particle.kind];context.lineWidth=.7;context.beginPath();context.moveTo(particle.x,particle.y);context.lineTo(particle.x-particle.vx*3,particle.y-particle.vy*3+3);context.stroke();}
        const size=particle.radius*(particle.kind===2?3:7);context.drawImage(glows[particle.kind],particle.x-size/2,particle.y-size/2,size,size);
      }
      context.globalAlpha=1;
      for(const wave of waves){context.strokeStyle=`rgba(200,16,46,${wave.life/58*.55})`;context.lineWidth=1;context.beginPath();context.arc(wave.x,wave.y,wave.radius,0,Math.PI*2);context.stroke();}
    };
    const resize=()=>{
      width=Math.max(1,innerWidth);height=Math.max(1,innerHeight);budget=particleBudget(width,height,devicePixelRatio,coarse);
      element.width=Math.floor(width*budget.ratio);element.height=Math.floor(height*budget.ratio);context.setTransform(budget.ratio,0,0,budget.ratio,0,0);
      particles=createParticles(budget.count,width,height);element.dataset.particles=String(particles.length);waves.length=0;draw(0);
    };
    const focus=()=>element.classList.toggle('is-registering',Boolean(document.activeElement?.closest('.set-form,.suggested-set,.work-reference,.preparation-sheet,.exercise-notes')));
    const blur=()=>queueMicrotask(focus);
    const move=event=>{
      if(!event.isPrimary)return;
      if(event.target.closest?.(excluded)){pointer.active=false;return;}
      pointer.x=event.clientX;pointer.y=event.clientY;pointer.radius=coarse?90:130;pointer.active=true;
    };
    const down=event=>{if(event.isPrimary&&!event.target.closest?.(excluded)){move(event);waves.push({x:event.clientX,y:event.clientY,radius:1,life:58});if(waves.length>4)waves.shift();}};
    const leave=()=>{pointer.active=false;};
    const up=event=>{if(event.pointerType!=='mouse')leave();};
    const tick=time=>{
      if(document.hidden)return;
      const elapsed=last?time-last:16.667;last=time;
      slowFrames=elapsed>25?slowFrames+1:Math.max(0,slowFrames-1);
      if(slowFrames>90&&particles.length>budget.minimum){particles.length=budget.minimum;element.dataset.particles=String(particles.length);slowFrames=0;}
      advanceParticles(particles,waves,pointer,width,height,elapsed,time);draw(time);frame=requestAnimationFrame(tick);
    };
    resize();focus();element.dataset.running=String(mode==='full'&&visible);
    window.addEventListener('resize',resize,{passive:true});document.addEventListener('focusin',focus);document.addEventListener('focusout',blur);
    if(mode==='full'&&visible){
      frame=requestAnimationFrame(tick);window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerdown',down,{passive:true});window.addEventListener('pointerup',up,{passive:true});window.addEventListener('pointercancel',leave,{passive:true});document.addEventListener('pointerleave',leave);
    }
    return()=>{cancelAnimationFrame(frame);element.dataset.running='false';window.removeEventListener('resize',resize);document.removeEventListener('focusin',focus);document.removeEventListener('focusout',blur);window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',leave);document.removeEventListener('pointerleave',leave);};
  },[mode,visible]);
  return mode==='off'?null:<canvas ref={canvas} className={`ember-field ${page==='today'?'during-training':''} ${mode==='reduced'?'embers-static':''}`} aria-hidden="true" data-testid="ember-field" data-effects={mode}/>;
}
