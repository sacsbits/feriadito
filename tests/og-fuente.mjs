import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import puppeteer from 'puppeteer-core';
const T={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const s=createServer(async(q,r)=>{try{let p=join('dist',new URL(q.url,'http://x').pathname);if((await stat(p).catch(()=>null))?.isDirectory())p=join(p,'index.html');if(!extname(p))p+='.html';const cuerpo=await readFile(p);r.writeHead(200,{'content-type':T[extname(p)]??'application/octet-stream'});r.end(cuerpo);}catch{r.writeHead(404);r.end()}});
await new Promise(r=>s.listen(0,'127.0.0.1',r));
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--disable-gpu']});
const p=await b.newPage();
await p.setViewport({width:1200,height:630});
await p.goto(`http://127.0.0.1:${s.address().port}/og/hoy`,{waitUntil:'networkidle0'});
console.log(await p.evaluate(async()=>{
  await document.fonts.ready;
  const el=document.querySelector('.og__titular');
  return {
    familiaCSS: getComputedStyle(el).fontFamily.slice(0,45),
    cargada: document.fonts.check('700 54px "Plus Jakarta Sans Variable"'),
    fuentesListas: [...document.fonts].map(f=>`${f.family} ${f.status}`),
  };
}));
await b.close(); s.close();
