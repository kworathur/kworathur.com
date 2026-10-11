import { getCollection, render } from 'astro:content';
import type { PortableTextBlock } from '@portabletext/types';
import { portableTextToHtml } from './portableText';
import { sanityClient } from './sanity';

type LocalContent = Awaited<ReturnType<typeof render>>['Content'];

export interface Post {
  slug: string;
  title: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  description: string;
  body: { html: string } | { Content: LocalContent };
}

export interface NowPage {
  updated: string;
  body: { html: string } | { Content: LocalContent };
}

interface SanityPost {
  title: string;
  slug: string;
  publishedAt: string;
  description?: string;
  body?: PortableTextBlock[];
}

interface SanityNow {
  _updatedAt: string;
  body?: PortableTextBlock[];
}

const POSTS_QUERY = `*[_type == "post" && defined(slug.current) && publishedAt <= now()]{
  title,
  "slug": slug.current,
  publishedAt,
  description,
  body
}`;

const NOW_QUERY = `*[_id == "now"][0]{ _updatedAt, body }`;

function entrySlug(id: string): string {
  return id.replace(/\/index(\.md)?$/, '').replace(/\.md$/, '');
}

async function getLocalPosts(): Promise<Post[]> {
  const entries = await getCollection('blog');
  return Promise.all(
    entries.map(async (entry) => {
      const { Content } = await render(entry);
      return {
        slug: entrySlug(entry.id),
        title: entry.data.title,
        date: entry.data.date,
        description: entry.data.description,
        body: { Content },
      };
    })
  );
}

async function getSanityPosts(): Promise<Post[]> {
  if (!sanityClient) return [];
  const docs = await sanityClient.fetch<SanityPost[]>(POSTS_QUERY);
  return docs.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    date: doc.publishedAt.slice(0, 10),
    description: doc.description ?? '',
    body: { html: portableTextToHtml(doc.body) },
  }));
}

/** All posts, newest first. A CMS post replaces a local post with the same slug. */
export async function getPosts(): Promise<Post[]> {
  const [local, remote] = await Promise.all([
    getLocalPosts(),
    getSanityPosts(),
  ]);
  const bySlug = new Map<string, Post>();
  for (const post of [...local, ...remote]) bySlug.set(post.slug, post);
  return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getNowPage(): Promise<NowPage> {
  if (sanityClient) {
    const doc = await sanityClient.fetch<SanityNow | null>(NOW_QUERY);
    if (doc?.body?.length) {
      return {
        updated: doc._updatedAt.slice(0, 10),
        body: { html: portableTextToHtml(doc.body) },
      };
    }
  }
  const [entry] = await getCollection('now');
  const { Content } = await render(entry);
  return { updated: entry.data.updated, body: { Content } };
}

export function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string {
  return new Date(iso).toLocaleDateString('en-US', {
    ...options,
    timeZone: 'UTC',
  });
}
