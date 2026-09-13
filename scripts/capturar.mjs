#!/usr/bin/env node
/**
 * Capturas de pantalla en anchos reales de dispositivo.
 *
 * Chrome en modo headless impone un ancho mínimo de ventana de 500px, así que
 * `--window-size=390` no sirve para verificar el diseño móvil: renderiza a 500
 * y recorta la imagen, lo que hace parecer que hay desborde horizontal.
 * Acá el viewport se fija por CDP, que sí respeta el valor.
 *
 * Uso: node scripts/capturar.mjs [url] [carpeta-salida]
 */
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const DISPOSITIVOS = [
  { nombre: 'iphone-se',   ancho: 375,  alto: 667,  escala: 2, movil: true },
  { nombre: 'iphone-13',   ancho: 390,  alto: 844,  escala: 3, movil: true },
  { nombre: 'iphone-max',  ancho: 430,  alto: 932,  escala: 3, movil: true },
  { nombre: 'tablet',      ancho: 768,  alto: 1024, escala: 2, movil: true },
  { nombre: 'escritorio',  ancho: 1280, alto: 900,  escala: 1, movil: false },
  { nombre: 'ancho',       ancho: 1600, alto: 900,  escala: 1, movil: false },
];

const url = process.argv[2] ?? 'http://localhost:4321/';
const salida = process.argv[3] ?? './capturas';
await mkdir(salida, { recursive: true });

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

const problemas = [];

for (const d of DISPOSITIVOS) {
  const pagina = await navegador.newPage();
  await pagina.setViewport({
    width: d.ancho, height: d.alto,
    deviceScaleFactor: d.escala, isMobile: d.movil, hasTouch: d.movil,
  });
  await pagina.goto(url, { waitUntil: 'networkidle0' });

  // Verifica desborde horizontal de verdad, midiendo el DOM
  const medida = await pagina.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const culpables = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > vw + 1) {
        culpables.push(`${el.tagName.toLowerCase()}.${el.className || '?'} (${Math.round(r.width)}px)`);
      }
    }
    return { vw, scroll: document.body.scrollWidth, culpables: culpables.slice(0, 5) };
  });

  const desborda = medida.scroll > medida.vw + 1;
  if (desborda) problemas.push({ ...d, ...medida });

  await pagina.screenshot({ path: `${salida}/${d.nombre}.png`, fullPage: false });
  console.log(
    `  ${desborda ? '✗' : '✓'} ${d.nombre.padEnd(12)} ${String(d.ancho).padStart(4)}px  ` +
    `viewport=${medida.vw} scroll=${medida.scroll}` +
    (medida.culpables.length ? `\n      desbordan: ${medida.culpables.join(', ')}` : '')
  );
  await pagina.close();
}

await navegador.close();
console.log(problemas.length ? `\n✗ ${problemas.length} tamaño(s) con desborde\n` : '\n✓ Sin desborde horizontal en ningún tamaño\n');
process.exit(problemas.length ? 1 : 0);
