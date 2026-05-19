import { defineCollection, z } from 'astro:content';

// Define the blog collection schema with image() for co-located image optimization
const blog = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    type: z.string(),
    featuredImage: image(),
    featuredImageCaption: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
