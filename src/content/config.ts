import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The CMS may write dates unquoted, which YAML parses as Date objects.
const isoDate = z.coerce.date().transform((d) => d.toISOString().slice(0, 10));

// The CMS saves uploaded cover images as bare file names (cover.png).
// Astro needs them to be relative paths (./cover.png).
const relativeImagePath = (value: unknown) =>
  typeof value === 'string' && /^[^./:][^:]*$/.test(value)
    ? `./${value}`
    : value;

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: isoDate,
      description: z.string().default(''),
      type: z.string().default('blog'),
      featuredImage: z.preprocess(relativeImagePath, image()).optional(),
      featuredImageCaption: z.string().optional(),
      tags: z.array(z.string()).optional(),
      archived: z.boolean().default(false),
    }),
});

const now = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/now' }),
  schema: z.object({
    updated: isoDate,
  }),
});

export const collections = { blog, now };
