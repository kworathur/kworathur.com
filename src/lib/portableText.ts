import { toHTML } from '@portabletext/to-html';
import type { PortableTextBlock } from '@portabletext/types';
import { sanityImageUrl } from './sanity';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface ImageValue {
  alt?: string;
  caption?: string;
}

interface CodeValue {
  code?: string;
  language?: string;
}

interface LinkMark {
  href?: string;
}

export function portableTextToHtml(
  blocks: PortableTextBlock[] | null | undefined
): string {
  if (!blocks || blocks.length === 0) return '';

  return toHTML(blocks, {
    components: {
      types: {
        image: ({ value }) => {
          const image = value as ImageValue;
          const src = sanityImageUrl(value);
          if (!src) return '';
          const alt = escapeHtml(image.alt ?? '');
          const caption = image.caption
            ? `<figcaption>${escapeHtml(image.caption)}</figcaption>`
            : '';
          return `<figure><img src="${src}" alt="${alt}" loading="lazy" />${caption}</figure>`;
        },
        code: ({ value }) => {
          const block = value as CodeValue;
          const language = (block.language ?? 'text').replace(/[^\w-]/g, '');
          return `<pre class="language-${language}"><code class="language-${language}">${escapeHtml(block.code ?? '')}</code></pre>`;
        },
      },
      unknownType: () => '',
      marks: {
        link: ({ children, value }) => {
          const href = (value as LinkMark | undefined)?.href ?? '';
          const external = /^https?:\/\//.test(href);
          const attrs = external
            ? ' target="_blank" rel="noopener noreferrer"'
            : '';
          return `<a href="${escapeHtml(href)}"${attrs}>${children}</a>`;
        },
      },
    },
    onMissingComponent: false,
  });
}
