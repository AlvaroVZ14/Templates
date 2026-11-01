import {validDate,shiftDate} from './wellness.js';
import {MEASURES} from './measurements.js';

export const CHECK_POSES=[['front','Frontal'],['side','Lateral'],['back','Espalda']];
export const PHOTO_PREFIX='check-photo:';
export const checkOrder=checks=>[...checks].sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt));
export function checkReminder(checks=[],today){
  const last=checkOrder(checks.filter(row=>row.date<=today)).at(-1);
  const next=last?shiftDate(last.date,28):today;
  return {due:today>=next,next,last:last?.date??null};
}
const observed=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
export function validMonthlyCheck(row){
  return row&&row.version===1&&typeof row.id==='string'&&validDate(row.date)&&row.month===row.date.slice(0,7)&&row.year===row.date.slice(0,4)&&typeof row.createdAt==='string'&&Number.isFinite(Date.parse(row.createdAt))&&
    (row.weight===null||observed(row.weight)&&row.weight<=500)&&row.values&&MEASURES.every(({key})=>row.values[key]===null||observed(row.values[key])&&row.values[key]<=500)&&row.photos&&typeof row.photos==='object'&&!Array.isArray(row.photos)&&
    Object.keys(row.photos).every(key=>CHECK_POSES.some(([pose])=>key===pose))&&Object.values(row.photos).every(id=>typeof id==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(id))&&
    (row.weight!==null||MEASURES.some(({key})=>row.values[key]!==null)||Object.keys(row.photos).length>0);
}
export function validMonthlyPhoto(photo){
  return photo&&photo.version===1&&typeof photo.id==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(photo.id)&&/^\d{4}-(0[1-9]|1[0-2])$/.test(photo.month)&&photo.year===photo.month.slice(0,4)&&CHECK_POSES.some(([pose])=>pose===photo.pose)&&
    Number.isInteger(photo.width)&&photo.width>0&&photo.width<=1200&&Number.isInteger(photo.height)&&photo.height>0&&photo.height<=1200&&typeof photo.dataUrl==='string'&&photo.dataUrl.length<4_000_000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.dataUrl);
}
export function addMonthlyCheck(state,row,today){
  if(!validMonthlyCheck(row)||row.date>today)throw new Error('Revisa la fecha, el peso y las medidas del check.');
  if((state.monthlyChecks??[]).some(check=>check.id===row.id))throw new Error('Este check ya está guardado.');
  return {...state,monthlyChecks:[...(state.monthlyChecks??[]),row]};
}
export function comparisonRows(before,after){
  return [{key:'weight',label:'Peso',unit:'kg'},...MEASURES.map(row=>({...row,unit:'cm'}))].map(row=>{
    const first=row.key==='weight'?before?.weight:before?.values[row.key],last=row.key==='weight'?after?.weight:after?.values[row.key];
    return {...row,before:first??null,after:last??null,delta:observed(first)&&observed(last)?Number((last-first).toFixed(2)):null};
  });
}
export function photoDimensions(width,height){
  const scale=Math.min(1,1200/height,1200/width);
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export function monochrome(pixels){
  for(let i=0;i<pixels.length;i+=4){
    const luminance=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];
    const value=Math.max(0,Math.min(255,Math.round((luminance-128)*1.5+128)));
    pixels[i]=pixels[i+1]=pixels[i+2]=value;pixels[i+3]=255;
  }
  return pixels;
}
export async function processCheckPhoto(file){
  if(!file||!file.type.startsWith('image/')||file.size>40*1024*1024)throw new Error('Elige una imagen de hasta 40 MB.');
  const url=URL.createObjectURL(file),image=new Image();
  try{
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('No se pudo abrir la foto. Prueba con JPEG, PNG o WebP.'));image.src=url;});
    const {width,height}=photoDimensions(image.naturalWidth,image.naturalHeight),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('El navegador no permite procesar la foto.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);
    const frame=ctx.getImageData(0,0,width,height);monochrome(frame.data);ctx.putImageData(frame,0,0);
    const dataUrl=canvas.toDataURL('image/jpeg',.78);canvas.width=canvas.height=0;
    return {width,height,dataUrl};
  }finally{URL.revokeObjectURL(url);}
}
