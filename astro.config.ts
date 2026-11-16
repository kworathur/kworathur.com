import { defineConfig } from 'astro/config';
import type { Root, Element } from 'hast';

// Origin of the CloudFront distribution that serves static assets,
// e.g. https://cdn.kworathur.com. Leave unset to serve assets from the site.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: rely on the process environment (for example on Netlify).
}
const cdnUrl = (process.env.PUBLIC_CDN_URL ?? '').replace(/\/+$/, '');

// Rehype plugin: points root-relative /assets/ URLs in markdown (images and
// downloads uploaded through the CMS) at the CDN. The CMS keeps writing
// site-relative paths, so its previews still work before a deploy finishes.
function rehypeCdnAssets() {
  return (tree: Root) => {
    if (!cdnUrl) return;
    function visit(node: Root | Element): void {
      if (node.type === 'element') {
        for (const key of ['src', 'href'] as const) {
          const value = node.properties?.[key];
          if (typeof value === 'string' && value.startsWith('/assets/')) {
            node.properties[key] = `${cdnUrl}${value}`;
          }
        }
      }
      for (const child of node.children) {
        if (child.type === 'element') visit(child);
      }
    }
    visit(tree);
  };
}

// Rehype plugin: wraps standalone <p><img …/></p> blocks in <figure> elements
// and appends <figcaption> from the title or alt text.
// Handles both single-image and multi-image paragraphs (adjacent markdown image
// lines produce a single <p> with multiple <img> children).
// Uses splice() throughout to avoid hast Root/Element children type variance.
function rehypeFigureCaption() {
  return (tree: Root) => {
    function makeFigure(img: Element): Element {
      const caption = img.properties?.title ?? img.properties?.alt;
      const children: Element['children'] = [img];
      if (caption) {
        children.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: String(caption) }],
        });
      }
      return { type: 'element', tagName: 'figure', properties: {}, children };
    }

    function isWhitespaceText(node: Element['children'][number]): boolean {
      return (
        node.type === 'text' &&
        /^\s*$/.test(String((node as { value?: unknown }).value ?? ''))
      );
    }

    function processChildren(children: Element['children']): void {
      // Walk backwards so splice indices stay valid
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child.type !== 'element') continue;
        if (child.tagName !== 'p') {
          processChildren(child.children);
          continue;
        }
        const realChildren = child.children.filter((c) => !isWhitespaceText(c));
        const allImgs =
          realChildren.length > 0 &&
          realChildren.every(
            (c) => c.type === 'element' && (c as Element).tagName === 'img'
          );
        if (allImgs) {
          const figures = realChildren.map((c) => makeFigure(c as Element));
          children.splice(i, 1, ...figures);
        }
      }
    }

    processChildren(tree.children as Element['children']);
  };
}

export default defineConfig({
  site: 'https://kworathur.com',
  trailingSlash: 'never',
  build: {
    assetsPrefix: cdnUrl || undefined,
  },
  redirects: {
    '/blog': '/',
  },
  markdown: {
    syntaxHighlight: 'prism',
    rehypePlugins: [
      [
        'rehype-external-links',
        { target: '_blank', rel: ['noopener', 'noreferrer'] },
      ],
      rehypeFigureCaption,
      rehypeCdnAssets,
    ],
  },
});
