import { getCollection, render } from 'astro:content';

type Content = Awaited<ReturnType<typeof render>>['Content'];

export interface Post {
  slug: string;
  title: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  description: string;
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
