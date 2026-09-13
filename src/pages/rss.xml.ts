import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.borrador))
    .sort((a, b) => b.data.publicado.getTime() - a.data.publicado.getTime());

  return rss({
    title: 'feriadito.cl',
    description: 'Cómo funcionan los feriados en Chile, qué derechos implican y cómo aprovecharlos.',
    site: context.site!,
    customData: '<language>es-cl</language>',
    items: posts.map((post) => ({
      title: post.data.titulo,
      description: post.data.resumen,
      pubDate: post.data.publicado,
      link: `/blog/${post.id}`,
    })),
  });
}
