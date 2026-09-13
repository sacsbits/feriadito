#!/usr/bin/env node
/**
 * Captura las rutas /og/* del build a PNG.
 *
 * Se usa un navegador y no satori porque así la imagen sale del mismo CSS y la
 * misma tipografía del sitio: no puede quedar desalineada con el diseño real.
 * El mismo generador produce el formato de Instagram (1080×1350).
 *
 * Corre DESPUÉS de `astro build`, sobre dist/.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, mkdir, rm, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import puppeteer from 'puppeteer-core';
import { buscarChrome } from './lib/chrome.mjs';
import sharp from 'sharp';

const DIST = 'dist';
const CHROME = await buscarChrome();

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.xml': 'application/xml',
};

// Servidor estático mínimo sobre dist/
const servidor = createServer(async (req, res) => {
  try {
    let ruta = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if ((await stat(ruta).catch(() => null))?.isDirectory()) ruta = join(ruta, 'index.html');
    if (!extname(ruta)) ruta += '.html';
    const cuerpo = await readFile(ruta);
    res.writeHead(200, { 'content-type': TIPOS[extname(ruta)] ?? 'application/octet-stream' });
    res.end(cuerpo);
  } catch {
    res.writeHead(404).end('no encontrado');
  }
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${servidor.address().port}`;

// Qué capturar
const paginasOG = (await readdir(join(DIST, 'og')).catch(() => []))
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.replace(/\.html$/, ''));

// El viewport solo tiene que ser suficiente para que quepa la tarjeta: el
// tamaño final lo define el propio elemento .og, que se captura completo.
const VIEWPORT = { ancho: 1400, alto: 1500 };
const trabajos = paginasOG.map((n) => ({ ruta: `/og/${n}`, salida: `og/${n}.png` }));

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'],
});

await mkdir(join(DIST, 'og'), { recursive: true });

for (const t of trabajos) {
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: VIEWPORT.ancho, height: VIEWPORT.alto, deviceScaleFactor: 1 });
  await pagina.goto(base + t.ruta, { waitUntil: 'networkidle0' });
  await pagina.evaluate(() => document.fonts.ready);
  const caja = await pagina.$('.og');
  const crudo = await caja.screenshot({ type: 'png' });

  // La tarjeta son colores planos: cuantizar a paleta baja la pesa mucho sin
  // que se note. WhatsApp y Meta recodifican igual, pero así el CDN sirve menos.
  const optimizado = await sharp(crudo).png({ palette: true, quality: 90, effort: 8 }).toBuffer();
  await writeFile(join(DIST, t.salida), optimizado);

  // Se mide la imagen resultante, no el tamaño que se pidió: antes se
  // registraba la intención y eso ocultó que ambas salían iguales.
  const { width, height } = await sharp(optimizado).metadata();
  console.log(
    `  ✓ ${t.salida.padEnd(28)} ${width}×${height}  ` +
    `${(optimizado.length / 1024).toFixed(0)} KB (de ${(crudo.length / 1024).toFixed(0)} KB)`
  );
  await pagina.close();
}

await navegador.close();
servidor.close();

// Las rutas HTML solo existían para ser capturadas: no se publican.
for (const n of paginasOG) await rm(join(DIST, 'og', `${n}.html`), { force: true });
console.log(`  ⌫ ${paginasOG.length} rutas HTML de /og eliminadas del build`);
