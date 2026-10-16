import {useEffect, useRef, useState} from 'react';
import {IronSilhouettes} from './Grunge.jsx';

export const DEFAULT_APPEARANCE = {name:'BLOOD & GUTS', motto:'POCAS SERIES. MÁXIMA INTENCIÓN.', motion:true, customMedia:true, effects:'full'};
export const appearanceFor = data => {
  const settings=data?.appearanceSettings;
  return {
    name:typeof settings?.name==='string'&&settings.name.trim()?settings.name.trim().slice(0,32):DEFAULT_APPEARANCE.name,
    motto:typeof settings?.motto==='string'&&settings.motto.trim()?settings.motto.trim().slice(0,80):DEFAULT_APPEARANCE.motto,
    motion:typeof settings?.motion==='boolean'?settings.motion:true,
    customMedia:typeof settings?.customMedia==='boolean'?settings.customMedia:true,
    effects:['full','reduced','off'].includes(settings?.effects)?settings.effects:'full',
  };
};

function useMotion(enabled) {
  const [paused,setPaused] = useState(true);
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setPaused(!enabled || document.hidden || query.matches);
    update(); document.addEventListener('visibilitychange',update); query.addEventListener('change',update);
    return()=>{document.removeEventListener('visibilitychange',update);query.removeEventListener('change',update);};
  },[enabled]);
  return paused;
}

const localAsset = path => typeof path==='string' && !path.startsWith('/') && !path.includes('..') && !/[\\:?#]/.test(path) ? `${import.meta.env.BASE_URL}${path}` : undefined;

function StillableImage({src,paused,onError}) {
  const canvas=useRef(null),[ready,setReady]=useState(false);
  // Keep a local first frame, including for animated WebP/GIF/SVG. Unmounting
  // the image stops animation/decode work while hidden or motion is reduced.
  function capture(event){
    const source=event.currentTarget,target=canvas.current;
    const scale=Math.min(1,1280/source.naturalWidth,1280/source.naturalHeight);
    target.width=Math.max(1,Math.round(source.naturalWidth*scale));target.height=Math.max(1,Math.round(source.naturalHeight*scale));
    try {
      const context=target.getContext('2d');if(!context){onError();return;}
      context.drawImage(source,0,0,target.width,target.height);setReady(true);
    }catch{onError();}
  }
  return <><canvas ref={canvas} className="shadow-media" hidden={!paused||!ready}/>{(!paused||!ready)&&<img className="shadow-media" src={src} alt="" style={paused?{visibility:'hidden'}:undefined} onLoad={capture} onError={onError}/>}</>;
}

export function ShadowBackground({appearance,ambient=false}) {
  const paused=useMotion(appearance.motion&&appearance.effects!=='off'&&appearance.effects!=='reduced'), video=useRef(null);
  const [config,setConfig]=useState(null), [failed,setFailed]=useState(false), [heroMissing,setHeroMissing]=useState(false);
  useEffect(()=>{
    if(ambient)return;
    const controller=new AbortController();
    fetch(`${import.meta.env.BASE_URL}appearance.json`,{signal:controller.signal}).then(response=>response.ok?response.json():null).then(value=>{
      if(value?.media && ['image','video'].includes(value.media.type) && localAsset(value.media.src))setConfig(value);
    }).catch(()=>{});
    return()=>controller.abort();
  },[ambient]);
  const configured=!ambient && appearance.customMedia && !failed && config?.media;
  const custom=configured || (appearance.customMedia && !heroMissing ? {type:'image',src:'hero.jpg'} : null);
  const mediaError=()=>configured?setFailed(true):setHeroMissing(true);
  useEffect(()=>{
    if(!video.current)return;
    if(paused)video.current.pause();else video.current.play().catch(()=>{});
  },[paused,custom]);
  return <div className={`shadow-scene ${ambient?'ambient-scene':''} ${paused?'is-paused':''}`} aria-hidden="true" data-testid={ambient?'ambient-scene':'shadow-scene'}>
    <div className="shadow-glow"/>
    <IronSilhouettes/>
    {!ambient&&custom?.type==='image'&&<div className="hero-collage"><StillableImage key={`collage-${custom.src}`} src={localAsset(custom.src)} paused={paused} onError={()=>{}}/></div>}
    <div className="shadow-subject"><div className="shadow-figure"><svg className="shadow-athlete" viewBox="0 0 360 460" focusable="false">
      <path d="M161 29 Q179 15 196 29 L202 54 Q200 74 188 80 L190 91 Q218 88 239 109 L253 128 L267 112 L272 84 L266 71 L270 56 L281 50 L293 58 L301 81 L300 113 Q291 152 270 169 Q255 181 233 165 L222 158 L225 203 Q217 239 207 253 L224 294 L228 343 L241 403 L254 433 L253 448 L210 448 L194 400 L185 350 L179 304 L169 350 L159 402 L147 448 L105 448 L105 434 L118 407 L131 345 L133 293 L149 254 Q135 237 128 203 L130 159 L118 166 Q96 182 79 169 Q58 153 48 115 L47 82 L55 59 L67 50 L79 56 L84 71 L77 85 L83 113 L97 129 L111 109 Q132 88 160 91 L162 80 Q149 73 149 54Z"/>
      <path className="shadow-detail" d="M161 97 L178 113 L190 96 M133 131 Q156 116 178 138 Q199 116 222 131 M147 165 Q166 170 178 159 Q192 170 211 165 M178 140 L178 225 M158 193 L171 197 M185 197 L199 193 M156 214 L170 217 M186 217 L201 214 M148 255 L177 273 L207 254 M144 293 L157 330 M212 293 L199 330"/>
    </svg>
    {custom?.type==='image' && <StillableImage key={custom.src} src={localAsset(custom.src)} paused={paused} onError={mediaError}/>}
    {custom?.type==='video' && <video ref={video} className="shadow-media" src={localAsset(custom.src)} poster={localAsset(config.poster)} loop muted playsInline preload="metadata" onLoadedData={()=>{if(!paused)video.current?.play().catch(()=>{});}} onError={mediaError}/>}</div></div>
    <div className="stage-beams"/><div className="stage-smoke smoke-near"/><div className="stage-smoke smoke-far"/>
    <div className="shadow-veil"/><div className="shadow-spotlight"/><div className="shadow-grain"/>
  </div>;
}

export function AppearanceSettings({data,change,saving}) {
  const current=appearanceFor(data);
  const [draft,setDraft]=useState(current), [dirty,setDirty]=useState(false), [message,setMessage]=useState('');
  useEffect(()=>{if(!dirty)setDraft(appearanceFor(data));},[data.appearanceSettings,dirty]);
  const update=patch=>{setDraft(value=>({...value,...patch}));setDirty(true);setMessage('');};
  async function save(event){
    event.preventDefault();
    if(await change(state=>({...state,appearanceSettings:{...draft,name:draft.name.trim()||DEFAULT_APPEARANCE.name,motto:draft.motto.trim()||DEFAULT_APPEARANCE.motto}}))){setDirty(false);setMessage('Apariencia guardada.');}
  }
  return <form className="wellness-card appearance-settings" onSubmit={save}>
    <div className="section-heading"><h2>Tu identidad</h2><span>APARIENCIA</span></div>
    <label>Nombre de la app<input aria-label="Nombre de la app" required maxLength="32" value={draft.name} onChange={event=>update({name:event.target.value})}/></label>
    <label>Lema del inicio<input aria-label="Lema del inicio" required maxLength="80" value={draft.motto} onChange={event=>update({motto:event.target.value})}/></label>
    <label>Efectos visuales<select aria-label="Efectos visuales" value={draft.effects} onChange={event=>update({effects:event.target.value})}><option value="full">Completos</option><option value="reduced">Reducidos</option><option value="off">Apagados</option></select></label>
    <p className="field-note">Completos: fuego lateral y escenario interactivo. Reducidos: mitad de partículas y sin ráfagas. Apagados: sin fuego. El movimiento reducido del dispositivo deja solo un resplandor estático.</p>
    <label className="check-label"><input type="checkbox" checked={draft.motion} onChange={event=>update({motion:event.target.checked})}/><span>Movimiento del fondo<small>Se pausa al ocultar la pestaña. Respeta el movimiento reducido del dispositivo.</small></span></label>
    <label className="check-label"><input type="checkbox" checked={draft.customMedia} onChange={event=>update({customMedia:event.target.checked})}/><span>Usar mi imagen o video de public/<small>hero.jpg se usa automáticamente. appearance.json permite elegir otro archivo. Sin imagen, se muestra la silueta SVG.</small></span></label>
    <button className="primary" disabled={saving||!dirty}>Guardar apariencia</button>
    {message&&<p role="status" className="success">{message}</p>}
  </form>;
}
