import { getCollection, render } from 'astro:content';
import type { ImageMetadata } from 'astro';

type Content = Awaited<ReturnType<typeof render>>['Content'];

export interface Post {
  slug: string;
  title: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  description: string;
  tags: string[];
  /** Cover image uploaded in the CMS, if any. */
  cover?: ImageMetadata;
  Content: Content;
}

export interface NowPage {
  updated: string;
  Content: Content;
}

function entrySlug(id: string): string {
  return id.replace(/\/index(\.md)?$/, '').replace(/\.md$/, '');
}

/** All posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const entries = await getCollection('blog');
  const posts = await Promise.all(
    entries.map(async (entry) => {
      const { Content } = await render(entry);
      return {
        slug: entrySlug(entry.id),
        title: entry.data.title,
        date: entry.data.date,
        description: entry.data.description,
        tags: entry.data.tags ?? [],
        cover: entry.data.featuredImage,
        Content,
      };
    })
  );
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getNowPage(): Promise<NowPage> {
  const [entry] = await getCollection('now');
  const { Content } = await render(entry);
  return { updated: entry.data.updated, Content };
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

/** Groups posts by year, newest year first. Keeps each group's post order. */
export function groupByYear(posts: Post[]): { year: string; posts: Post[] }[] {
  const groups = new Map<string, Post[]>();
  for (const post of posts) {
    const year = post.date.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, yearPosts]) => ({ year, posts: yearPosts }));
}
