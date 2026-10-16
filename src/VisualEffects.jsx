import {useEffect,useRef,useState} from 'react';
import {advanceParticles,createBurst,createParticles,fireColor,fireLanes,FIRE_COLORS,particleBudget} from './particles.js';

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
  return FIRE_COLORS.map(color=>{
    const sprite=document.createElement('canvas');sprite.width=sprite.height=32;
    const ctx=sprite.getContext('2d');if(!ctx)return sprite;
    const glow=ctx.createRadialGradient(16,16,0,16,16,16);glow.addColorStop(0,color);glow.addColorStop(.12,color+'F0');glow.addColorStop(.4,color+'55');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.fillRect(0,0,32,32);return sprite;
  });
}
export default function ParticleBackground({appearance,page}){
  const canvas=useRef(null),{visible,reduced}=useVisualEnvironment(appearance);
  const mode=appearance.effects==='off'?'off':reduced||appearance.motion===false?'static':appearance.effects==='reduced'?'reduced':'full';
  useEffect(()=>{
    const element=canvas.current;if(!element||mode==='off')return;
    const context=element.getContext('2d',{alpha:true});if(!context)return;
    const coarse=matchMedia('(pointer: coarse)').matches,glows=sprites(),pointer={active:false,x:0,y:0};
    let width=0,height=0,budget,lanes,particles=[],bursts=[],frame=0,last=0,slowFrames=0,registering=false,density=0,simulated=0,nextBurst=7000+Math.random()*6000;
    const counts=()=>{const count=mode==='static'?0:Math.min(density,registering?budget.minimum:budget.count);if(particles.length>count)particles.length=count;else if(particles.length<count)particles.push(...createParticles(count-particles.length,width,height));element.dataset.particles=String(particles.length+bursts.length);element.dataset.bursts=String(bursts.length);element.dataset.targetFps=String(registering||mode==='reduced'?30:60);};
    const draw=time=>{
      context.clearRect(0,0,width,height);context.save();context.beginPath();for(const lane of lanes)context.rect(lane.minX,0,lane.maxX-lane.minX,height);context.clip();context.globalCompositeOperation='lighter';
      for(const lane of lanes){const center=(lane.minX+lane.maxX)/2,edge=lane.maxX-lane.minX;context.globalAlpha=mode==='static'?.2:.2+Math.sin(time*.00025)*.045;context.drawImage(glows[1],center-edge*1.2,height-145,edge*2.4,260);context.drawImage(glows[4],center-edge,height-200,edge*2,330);}
      for(const particle of [...particles,...bursts]){
        const color=fireColor(particle.progress),glow=glows[FIRE_COLORS.indexOf(color)],flicker=mode==='reduced'?1:.94+Math.sin(time*.007+particle.phase)*.06;
        context.globalAlpha=particle.alpha*flicker;const size=particle.size*(particle.kind==='spark'?9:8);
        if(particle.kind==='spark'||particle.trail>0){context.strokeStyle=color;context.lineWidth=Math.max(.4,particle.size*.6);context.beginPath();context.moveTo(particle.x,particle.y);context.lineTo(particle.x-(particle.x-particle.previousX||0)*2,particle.y+Math.min(12,Math.abs(particle.y-particle.previousY||0)*2+2));context.stroke();}
        context.drawImage(glow,particle.x-size/2,particle.y-size/2,size,size);
      }
      context.restore();
    };
    const resize=()=>{
      width=Math.max(1,innerWidth);height=Math.max(1,innerHeight);budget=particleBudget(width,height,devicePixelRatio,coarse,mode==='reduced');lanes=fireLanes(width);density=budget.count;
      element.width=Math.floor(width*budget.ratio);element.height=Math.floor(height*budget.ratio);context.setTransform(budget.ratio,0,0,budget.ratio,0,0);particles=[];bursts=[];counts();draw(simulated);
    };
    const focus=()=>{registering=Boolean(document.activeElement?.closest('.set-form,.suggested-set,.work-reference,.preparation-count,.preparation-sheet,.exercise-notes'));element.classList.toggle('is-registering',registering);if(registering){pointer.active=false;bursts=[];}counts();};
    const blur=()=>queueMicrotask(focus);
    const move=event=>{if(!event.isPrimary)return;if(registering||event.target.closest?.(excluded)){pointer.active=false;return;}Object.assign(pointer,{x:event.clientX,y:event.clientY,radius:coarse?55:100,active:true});};
    const burst=(x,y,count)=>{if(mode!=='full'||registering)return;bursts.push(...createBurst(x,y,width,height,count));if(!budget.mobile)for(const side of [0,1]){let excess=bursts.filter(p=>p.side===side).length-20;bursts=bursts.filter(p=>p.side!==side||excess--<=0);}if(bursts.length>budget.maxBursts)bursts.splice(0,bursts.length-budget.maxBursts);counts();};
    const down=event=>{if(event.isPrimary&&event.button===0&&!event.target.closest?.(excluded)){move(event);burst(event.clientX,event.clientY,budget.mobile?5:16);}};
    const leave=()=>{pointer.active=false;},up=event=>{if(event.pointerType!=='mouse')leave();};
    const tick=time=>{
      if(document.hidden)return;
      const interval=registering||mode==='reduced'?33.333:16.667,elapsed=last?time-last:interval;
      if(elapsed>=interval-.8){last=time;const dt=Math.min(elapsed,40);simulated+=dt;
        slowFrames=elapsed>interval*1.6?slowFrames+1:Math.max(0,slowFrames-1);if(slowFrames>90){density=budget.minimum;slowFrames=0;}
        counts();advanceParticles(particles,pointer,width,height,dt);advanceParticles(bursts,pointer,width,height,dt);
        if(mode==='full'&&simulated>=nextBurst){for(const lane of lanes)burst((lane.minX+lane.maxX)/2,height-8,budget.mobile?2:8);nextBurst=simulated+7000+Math.random()*6000;}
        counts();draw(simulated);
      }
      frame=requestAnimationFrame(tick);
    };
    resize();focus();element.dataset.running=String(mode!=='static'&&visible);
    window.addEventListener('resize',resize,{passive:true});document.addEventListener('focusin',focus);document.addEventListener('focusout',blur);
    if(mode!=='static'&&visible){frame=requestAnimationFrame(tick);window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerdown',down,{passive:true});window.addEventListener('pointerup',up,{passive:true});window.addEventListener('pointercancel',leave,{passive:true});document.addEventListener('pointerleave',leave);}
    return()=>{cancelAnimationFrame(frame);element.dataset.running='false';window.removeEventListener('resize',resize);document.removeEventListener('focusin',focus);document.removeEventListener('focusout',blur);window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',leave);document.removeEventListener('pointerleave',leave);};
  },[mode,visible]);
  return mode==='off'?null:<canvas ref={canvas} className={`ember-field ${page==='today'?'during-training':''} ${mode==='static'?'embers-static':''}`} aria-hidden="true" data-testid="ember-field" data-effects={mode}/>;
}
