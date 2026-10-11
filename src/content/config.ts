import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The CMS may write dates unquoted, which YAML parses as Date objects.
const isoDate = z.coerce.date().transform((d) => d.toISOString().slice(0, 10));

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: isoDate,
      description: z.string().default(''),
      type: z.string().default('blog'),
      featuredImage: image().optional(),
      featuredImageCaption: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
});

const now = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/now' }),
  schema: z.object({
    updated: isoDate,
  }),
});

export const collections = { blog, now };
