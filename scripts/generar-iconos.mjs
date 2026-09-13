#!/usr/bin/env node
/**
 * Genera favicons e iconos de PWA desde la mascota.
 *
 * Se usa la mascota sola, no el logo con texto: a 32px el texto es ilegible.
 * Los iconos con fondo llevan crema en vez de transparencia, porque iOS
 * rellena de negro los apple-touch-icon transparentes.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const ORIGEN = 'src/assets/mascota.png';
const CREMA = { r: 253, g: 246, b: 239, alpha: 1 }; // --brand-50

await mkdir('public', { recursive: true });

/** Recorta la mascota a un cuadrado centrado en la cara, con margen. */
async function cuadrado(tamano, fondo) {
  const margen = Math.round(tamano * 0.10);
  const interior = tamano - margen * 2;
  const base = sharp({
    create: { width: tamano, height: tamano, channels: 4, background: fondo ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  });
  const mascota = await sharp(ORIGEN)
    .resize(interior, interior, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return base.composite([{ input: mascota, top: margen, left: margen }]).png().toBuffer();
}

const salidas = [
  ['public/favicon-32.png',       32,  null],
  ['public/favicon-48.png',       48,  null],
  ['public/apple-touch-icon.png', 180, CREMA],
  ['public/icono-192.png',        192, CREMA],
  ['public/icono-512.png',        512, CREMA],
];

for (const [ruta, tamano, fondo] of salidas) {
  await sharp(await cuadrado(tamano, fondo)).toFile(ruta);
  console.log(`  ✓ ${ruta.padEnd(30)} ${tamano}×${tamano}`);
}

// Las imágenes sociales NO se generan acá: salen de capturar las rutas /og/*
// con scripts/generar-og.mjs, para que usen el mismo CSS que el sitio.
