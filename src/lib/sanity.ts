import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

const env = import.meta.env as Record<string, string | undefined>;

const projectId = env.SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID;
const dataset =
  env.SANITY_DATASET ?? process.env.SANITY_DATASET ?? 'production';

export const sanityEnabled = Boolean(projectId);

export const sanityClient = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2025-01-01',
      useCdn: false,
      perspective: 'published',
    })
  : null;

const builder = projectId
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export function sanityImageUrl(source: unknown, width = 1400): string {
  if (!builder) return '';
  return builder
    .image(source as Parameters<typeof builder.image>[0])
    .width(width)
    .auto('format')
    .url();
}
