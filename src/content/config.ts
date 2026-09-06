import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.string(),
      description: z.string(),
      type: z.string(),
      featuredImage: image().optional(),
      featuredImageCaption: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
});

export const collections = { blog };
