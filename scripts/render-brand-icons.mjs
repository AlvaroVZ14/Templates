import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../public/',import.meta.url),browser=await chromium.launch({channel:'chromium'});
try{
 const page=await browser.newPage();await page.setContent('<!doctype html><title>Local SVG renderer</title>');
 async function render(source,size){
  const svg=await readFile(new URL(source,root),'utf8');
  const data=await page.evaluate(async({svg,size})=>{const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.getContext('2d').drawImage(image,0,0,size,size);return canvas.toDataURL('image/png').split(',')[1];},{svg,size});
  return Buffer.from(data,'base64');
 }
 for(const size of [192,512]){await writeFile(new URL(`icon-${size}.png`,root),await render('icon.svg',size));await writeFile(new URL(`icon-maskable-${size}.png`,root),await render('icon-maskable.svg',size));}
 await writeFile(new URL('apple-touch-icon.png',root),await render('icon.svg',180));
 const sizes=[16,32],images=[];
 for(const size of sizes){const image=await render('favicon.svg',size);images.push(image);await writeFile(new URL(`favicon-${size}.png`,root),image);}
 const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let position=header.length;
 for(let index=0;index<sizes.length;index++){const offset=6+16*index;header[offset]=header[offset+1]=sizes[index];header.writeUInt16LE(1,offset+4);header.writeUInt16LE(32,offset+6);header.writeUInt32LE(images[index].length,offset+8);header.writeUInt32LE(position,offset+12);position+=images[index].length;}
 await writeFile(new URL('favicon.ico',root),Buffer.concat([header,...images]));
 console.log('Íconos Olympia: PNG 192/512, maskable, Apple 180 y favicon SVG/ICO.');
}finally{await browser.close();}
