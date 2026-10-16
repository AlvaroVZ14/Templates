import {useEffect,useRef,useState} from 'react';
import {clamp} from './particles.js';
export function mobileSensorCandidate(){
  const touch=navigator.maxTouchPoints>0||matchMedia('(pointer: coarse)').matches;
  const mobile=navigator.userAgentData?.mobile||/Android|iPhone|iPad|iPod/.test(navigator.userAgent)||/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1;
  return Boolean(window.isSecureContext&&window.DeviceOrientationEvent&&touch&&mobile);
}
export default function useTilt(active,onOrientation){
  const candidate=mobileSensorCandidate(),requiresPermission=typeof window.DeviceOrientationEvent?.requestPermission==='function';
  const [available,setAvailable]=useState(()=>candidate&&requiresPermission),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const callback=useRef(onOrientation),alive=useRef(true);callback.current=onOrientation;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{
    if(!active||!candidate||requiresPermission&&!enabled||available&&!enabled)return;
    let baseline=null,verified=false;
    const stop=()=>{clearTimeout(timeout);window.removeEventListener('deviceorientation',read);};
    const unavailable=()=>{stop();setAvailable(false);setEnabled(false);if(enabled)setMessage('No se detectó un sensor disponible. Puedes usar el dedo.');};
    const read=event=>{
      // Some browsers send empty samples while waking the sensor. Confirm with
      // finite readings or the timeout, rather than rejecting the first sample.
      if(!Number.isFinite(event.beta)||!Number.isFinite(event.gamma))return;
      if(!verified){verified=true;clearTimeout(timeout);setAvailable(true);}
      if(!enabled){stop();return;}
      baseline??={beta:event.beta,gamma:event.gamma};let x=clamp((event.gamma-baseline.gamma)/25,-1,1),y=clamp((event.beta-baseline.beta)/35,-1,1);
      const angle=screen.orientation?.angle??window.orientation??0;if(Math.abs(angle)===90)[x,y]=[y*Math.sign(angle),-x*Math.sign(angle)];else if(Math.abs(angle)===180){x=-x;y=-y;}
      callback.current({x,y});
    };
    const timeout=setTimeout(unavailable,3000);window.addEventListener('deviceorientation',read,{passive:true});return stop;
  },[active,candidate,requiresPermission,enabled]);
  async function toggle(){
    if(busy)return;if(enabled){setEnabled(false);setMessage('Inclinación desactivada. Puedes usar el dedo.');return;}
    setBusy(true);
    try{
      const permission=requiresPermission?await window.DeviceOrientationEvent.requestPermission():'granted';
      if(!alive.current)return;
      if(permission==='granted'){setEnabled(true);setMessage('Inclinación activada. Mueve suavemente el teléfono.');}
      else setMessage('Sin permiso de inclinación. Usa el dedo.');
    }catch{if(alive.current)setMessage('Inclinación no disponible. Usa el dedo.');}
    finally{if(alive.current)setBusy(false);}
  }
  return {available:candidate&&available,enabled,busy,message,toggle};
}
