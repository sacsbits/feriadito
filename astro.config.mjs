// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://feriadito.cl',
  trailingSlash: 'never',
  integrations: [sitemap({ filter: (pagina) => !pagina.includes('/og/') })],
  build: {
    // Un archivo por ruta, sin directorios con index.html
    format: 'file',
  },
  compressHTML: true,
  vite: {
    build: {
      // El sitio es minúsculo: un solo CSS evita requests extra
      cssCodeSplit: false,
    },
  },
});
