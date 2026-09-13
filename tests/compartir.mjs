import puppeteer from 'puppeteer-core';
import { buscarChrome } from '../scripts/lib/chrome.mjs';

const b = await puppeteer.launch({
  executablePath: await buscarChrome(), headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

// Simula un dispositivo con compartir nativo y captura lo que se enviaría
await p.evaluateOnNewDocument(() => {
  window.__compartido = null;
  navigator.share = async (d) => { window.__compartido = d; };
});
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });

await p.click('#compartir');
console.log('  Con el próximo feriado seleccionado:');
console.log('   ', JSON.stringify(await p.evaluate(() => window.__compartido), null, 2).replace(/\n/g, '\n    '));

await p.click('.fila[data-fecha="2026-12-25"]');
await p.click('#compartir');
console.log('\n  Tras elegir Navidad:');
console.log('   ', JSON.stringify(await p.evaluate(() => window.__compartido), null, 2).replace(/\n/g, '\n    '));

await p.click('.fila[data-fecha="2026-04-03"]');
await p.click('#compartir');
console.log('\n  Con un feriado ya pasado:');
console.log('   ', JSON.stringify(await p.evaluate(() => window.__compartido.text)));

await b.close();
