import {useEffect,useRef,useState} from 'react';

export default function useRestAudio(active){
  const context=useRef(null),[armed,setArmed]=useState(false);
  const supported=Boolean(window.AudioContext||window.webkitAudioContext);
  async function arm(){
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;context.current??=new Audio();await context.current.resume();const ready=context.current.state==='running';setArmed(ready);return ready;}catch{setArmed(false);return false;}
  }
  function play(){
    const audio=context.current;if(!audio||audio.state!=='running'||document.hidden)return;
    try{const oscillator=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime;oscillator.type='sine';oscillator.frequency.setValueAtTime(520,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.035,start+.03);gain.gain.exponentialRampToValueAtTime(.0001,start+.32);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(start);oscillator.stop(start+.35);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}catch{/* Vibration and the visible timer remain available. */}
  }
  useEffect(()=>{if(!active){context.current?.suspend().catch(()=>{});setArmed(false);}},[active]);
  useEffect(()=>()=>{context.current?.close().catch(()=>{});},[]);
  return {supported,armed,arm,play};
}
