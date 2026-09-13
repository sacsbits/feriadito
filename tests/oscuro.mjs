import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox','--disable-gpu','--hide-scrollbars'] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 760, deviceScaleFactor: 1 });
await p.goto('http://localhost:4321/', { waitUntil:'networkidle0' });
await p.click('#alternar-tema');
await p.screenshot({ path: process.argv[2] + '/oscuro-escritorio.png' });
await b.close();
