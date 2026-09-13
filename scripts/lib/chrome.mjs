import { access } from 'node:fs/promises';

/**
 * Encuentra un Chrome utilizable.
 *
 * El build genera las imágenes sociales capturando rutas reales del sitio, así
 * que necesita un navegador. En local es el Chrome de macOS; en CI, el que
 * traen preinstalado los runners de Ubuntu.
 */
const CANDIDATOS = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/snap/bin/chromium',
].filter(Boolean);

export async function buscarChrome() {
  for (const ruta of CANDIDATOS) {
    try {
      await access(ruta);
      return ruta;
    } catch {
      /* siguiente */
    }
  }
  throw new Error(
    'No se encontró Chrome. Instálalo o define CHROME_PATH.\n' +
      'Se buscó en:\n' + CANDIDATOS.map((c) => `  - ${c}`).join('\n')
  );
}
