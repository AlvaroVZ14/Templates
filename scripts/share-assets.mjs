import {chromium} from '@playwright/test';
import QRCode from 'qrcode';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const url='https://alvarovz14.github.io/Olympia-amigos/';
await QRCode.toFile('public/compartir-qr.png',url,{width:768,margin:4,errorCorrectionLevel:'M',color:{dark:'#0B0B0D',light:'#FFFFFF'}});
const qrSvg=await QRCode.toString(url,{type:'svg',margin:4,errorCorrectionLevel:'M'});
await writeFile('public/compartir-qr.svg',qrSvg.replace(/(<svg[^>]*>)/,'$1<title>Olympia</title>'));
await mkdir('public/splash',{recursive:true});
const logo=await readFile('public/logo.svg','utf8'),browser=await chromium.launch({headless:true});
try{for(const [w,h,dpr] of [[375,667,2],[375,812,3],[390,844,3],[393,852,3],[430,932,3],[414,896,2]]){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:dpr});
 await page.setContent(`<html><body style="margin:0;background:#0B0B0D;display:grid;place-items:center;height:100vh"><div style="width:65vw;max-width:300px">${logo}</div></body></html>`);
 await page.screenshot({path:`public/splash/iphone-${w}-${h}.png`});await page.close();
}}finally{await browser.close();}
