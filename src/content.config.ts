import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    /** Se usa como meta description y como bajada. Que responda algo concreto. */
    resumen: z.string(),
    publicado: z.coerce.date(),
    actualizado: z.coerce.date().optional(),
    /** Firma el autor: Google pondera la autoría en contenido informativo. */
    autor: z.string().default('Stefano Corsi'),
    etiquetas: z.array(z.string()).default([]),
    borrador: z.boolean().default(false),
  }),
});

export const collections = { blog };
