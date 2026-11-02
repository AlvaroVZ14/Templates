import lighthouse from 'lighthouse';
import {launch} from 'chrome-launcher';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.argv[2]??'https://alvarovz14.github.io/Olympia-amigos/';
await mkdir('docs/publicacion',{recursive:true});
const chrome=await launch({chromePath:chromium.executablePath(),chromeFlags:['--headless','--no-sandbox','--disable-dev-shm-usage']});
try{const result=await lighthouse(url,{port:chrome.port,onlyCategories:['performance','accessibility','best-practices'],output:['html','json'],logLevel:'error'});
 await writeFile('docs/publicacion/lighthouse.html',result.report[0]);await writeFile('docs/publicacion/lighthouse.json',result.report[1]);
 console.log(JSON.stringify({url,version:result.lhr.lighthouseVersion,scores:Object.fromEntries(Object.entries(result.lhr.categories).map(([k,v])=>[k,v.score])),issues:Object.values(result.lhr.audits).filter(a=>a.score!==null&&a.score<1&&a.scoreDisplayMode!=='informative').map(a=>({id:a.id,title:a.title,score:a.score,details:a.details?.items?.slice(0,3)}))}));
}finally{await chrome.kill();}
