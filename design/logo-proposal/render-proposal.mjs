import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
const directory=new URL('./',import.meta.url),browser=await chromium.launch({channel:'chromium'});
try{
 const page=await browser.newPage({viewport:{width:1400,height:1160},deviceScaleFactor:1});
 await page.setContent('<!doctype html><html><body style="margin:0;background:#0B0B0D"></body></html>');
 async function png(source,name,width,height=width){
  const svg=await readFile(new URL(source,directory),'utf8');
  const data=await page.evaluate(async({svg,width,height})=>{
   const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await image.decode();
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0,width,height);return canvas.toDataURL('image/png').split(',')[1];
  },{svg,width,height});
  await writeFile(new URL(name,directory),Buffer.from(data,'base64'));
 }
 await png('logo.svg','logo-preview.png',900,800);
 for(const size of [192,512]){await png('icon.svg',`icon-${size}.png`,size);await png('icon-maskable.svg',`icon-maskable-${size}.png`,size);}
 await png('icon.svg','apple-touch-icon.png',180);
 await png('favicon.svg','favicon-32.png',32);
 await png('favicon.svg','favicon-16.png',16);
 const faviconSizes=[16,32],faviconImages=await Promise.all(faviconSizes.map(size=>readFile(new URL(`favicon-${size}.png`,directory)))),icoHeader=Buffer.alloc(6+16*faviconSizes.length);
 icoHeader.writeUInt16LE(1,2);icoHeader.writeUInt16LE(faviconSizes.length,4);let icoOffset=icoHeader.length;
 for(let index=0;index<faviconSizes.length;index++){const offset=6+16*index;icoHeader[offset]=icoHeader[offset+1]=faviconSizes[index];icoHeader.writeUInt16LE(1,offset+4);icoHeader.writeUInt16LE(32,offset+6);icoHeader.writeUInt32LE(faviconImages[index].length,offset+8);icoHeader.writeUInt32LE(icoOffset,offset+12);icoOffset+=faviconImages[index].length;}
 await writeFile(new URL('favicon.ico',directory),Buffer.concat([icoHeader,...faviconImages]));
 // Check the actual rasterized foreground, not just its SVG viewBox.
 const checks=await page.evaluate(async({maskable,monochrome})=>{
  async function pixels(svg){const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,512,512);return ctx.getImageData(0,0,512,512).data;}
  const mask=await pixels(maskable),mono=await pixels(monochrome);let radius=0,darkInk=0;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4;if(Math.max(Math.abs(mask[i]-11),Math.abs(mask[i+1]-11),Math.abs(mask[i+2]-13))>8)radius=Math.max(radius,Math.hypot(x+.5-256,y+.5-256));if(mono[i+3]>20&&Math.max(mono[i],mono[i+1],mono[i+2])<100)darkInk++;}
  return {maskableForegroundRadius:Number(radius.toFixed(2)),safeRadius:204.8,monochromeHasDarkInk:darkInk>0};
 },{maskable:await readFile(new URL('icon-maskable.svg',directory),'utf8'),monochrome:await readFile(new URL('emblem-monochrome.svg',directory),'utf8')});
 if(checks.maskableForegroundRadius>checks.safeRadius||checks.monochromeHasDarkInk)throw Error('Revisar área segura o transparencia monocroma.');
 console.log(JSON.stringify(checks));
 const source=async name=>'data:image/svg+xml;base64,'+(await readFile(new URL(name,directory))).toString('base64');
 const [logo,emblem,mono,icon]=await Promise.all(['logo.svg','emblem.svg','emblem-monochrome.svg','icon-maskable.svg'].map(source));
 await page.setContent(`<!doctype html><html lang="es"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#0B0B0D;color:#F2F0EB;font:14px Arial,sans-serif;padding:38px 48px}header{height:82px;display:flex;justify-content:space-between;align-items:start;letter-spacing:3px}header b{font-size:18px}header span{color:#AAA5A4;font-size:11px}.grid{display:grid;grid-template-columns:850px 1fr;gap:28px}.full,.card{background:#101013;border:1px solid #30262A;position:relative}.full:before,.card:before{content:'';position:absolute;left:-1px;top:-1px;width:32px;height:3px;background:#E10600}.full img{width:100%;display:block}label{display:block;padding:18px 22px;letter-spacing:2.5px;color:#AAA5A4;font-size:10px}.variants{display:grid;gap:20px}.card{min-height:240px}.card img{width:206px;height:206px;object-fit:contain;display:block;margin:0 auto 8px}.card.row img{display:inline-block;width:143px;height:143px;margin:18px}.foot{display:flex;justify-content:space-between;align-items:center;padding-top:30px;color:#AAA5A4;font-size:11px;letter-spacing:1px}.swatches{display:flex;gap:12px}.swatches i{width:26px;height:26px;border:1px solid #393438;display:inline-block}.caption{line-height:1.8}.monowrap{background:#16161A;border-radius:24%;width:204px;height:204px;margin:auto;overflow:hidden}.monowrap img{width:100%;height:100%}</style><header><b>OLYMPIA <span> / IDENTIDAD 01</span></b><span>IDENTIDAD APROBADA</span></header><div class="grid"><section class="full"><label>01 / LOGOTIPO COMPLETO · TRAZADOS VECTORIALES</label><img src="${logo}"></section><div class="variants"><section class="card"><label>02 / EMBLEMA</label><img src="${emblem}"></section><section class="card"><label>03 / UNA TINTA</label><img src="${mono}"></section><section class="card"><label>04 / ÍCONO MASKABLE · RECORTE DE EJEMPLO</label><div class="monowrap"><img src="${icon}"></div></section></div></div><footer class="foot"><div class="caption">TORSO EN V · ACERO BISELADO · ANATOMÍA EN SOMBRA<br>SVG propio, lettering en contornos y sin imágenes externas.</div><div class="swatches"><i style="background:#E10600"></i><i style="background:#FF3B1F"></i><i style="background:#F2F0EB"></i><i style="background:#0B0B0D"></i></div></footer></html>`);
 await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
 await page.screenshot({path:new URL('presentation.png',directory).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
 console.log('Vista previa e íconos preparados dentro de design/logo-proposal; Paquete Olympia verificado.');
}finally{await browser.close();}
