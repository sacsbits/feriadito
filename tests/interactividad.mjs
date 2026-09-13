import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args:['--no-sandbox','--disable-gpu','--hide-scrollbars'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });

// 1) Estado inicial del contador
const inicial = await p.evaluate(() => ({
  numero: document.getElementById('contador-numero')?.textContent,
  nombre: document.getElementById('contador-nombre')?.textContent.trim(),
  seleccionada: document.querySelector('.fila[aria-current="true"]')?.dataset.nombre,
}));
console.log('  Inicial →', JSON.stringify(inicial));

// 2) Click en otro feriado (Viernes Santo, que ya pasó)
await p.click('.fila[data-fecha="2026-04-03"]');
const trasClick = await p.evaluate(() => ({
  numero: document.getElementById('contador-numero')?.textContent,
  pasado: document.getElementById('contador-numero')?.dataset.pasado,
  encabezado: document.getElementById('contador-encabezado')?.textContent,
  nombre: document.getElementById('contador-nombre')?.textContent.trim(),
  seleccionada: document.querySelector('.fila[aria-current="true"]')?.dataset.nombre,
}));
console.log('  Tras click en Viernes Santo →', JSON.stringify(trasClick));

// 3) Modo oscuro
await p.click('#alternar-tema');
const tema = await p.evaluate(() => ({
  atributo: document.documentElement.dataset.tema,
  guardado: localStorage.getItem('tema'),
  fondo: getComputedStyle(document.body).backgroundColor,
}));
console.log('  Modo oscuro →', JSON.stringify(tema));
await p.screenshot({ path: process.argv[2] + '/oscuro.png' });

// 4) Persistencia tras recargar
await p.reload({ waitUntil: 'networkidle0' });
const persiste = await p.evaluate(() => document.documentElement.dataset.tema);
console.log('  Persiste tras recargar →', persiste === 'oscuro' ? '✓ sí' : '✗ NO');

await b.close();
