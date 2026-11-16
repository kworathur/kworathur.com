import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Root, Element } from 'hast';
import type { Root as MdRoot, Parent as MdParent } from 'mdast';

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

// Remark plugin: turns a paragraph that only holds {{< video src="URL" >}}
// (the CMS "Video" button) into a <video> tag. Use an optional poster="URL".
function remarkVideoShortcode() {
  const shortcode =
    /^\{\{<\s*video\s+src="([^"]+)"(?:\s+poster="([^"]*)")?\s*>\}\}$/;
  const isSafeUrl = (url: string) => /^(https?:\/\/|\/)/.test(url);
  const withCdn = (url: string) =>
    cdnUrl && url.startsWith('/assets/') ? `${cdnUrl}${url}` : url;
  const attr = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  // Smart quotes turn " into curly quotes and GFM turns URLs into links
  // before this plugin runs, so rebuild the plain text of the paragraph.
  function plainText(node: MdParent['children'][number]): string {
    if (node.type === 'text') return node.value;
    if (node.type === 'link') return node.children.map(plainText).join('');
    return '\u0000';
  }

  return (tree: MdRoot) => {
    function visit(node: MdParent): void {
      node.children.forEach((child, i) => {
        if (child.type === 'paragraph') {
          const text = child.children
            .map(plainText)
            .join('')
            .replace(/[\u201c\u201d]/g, '"')
            .trim();
          const match = shortcode.exec(text);
          if (match && isSafeUrl(match[1])) {
            const poster =
              match[2] && isSafeUrl(match[2])
                ? ` poster="${attr(withCdn(match[2]))}"`
                : '';
            node.children[i] = {
              type: 'html',
              value: `<video controls playsinline preload="metadata" src="${attr(withCdn(match[1]))}"${poster}></video>`,
            };
            return;
          }
        }
        if ('children' in child) visit(child as MdParent);
      });
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
    remarkPlugins: [remarkMath, remarkVideoShortcode],
    rehypePlugins: [
      rehypeKatex,
      [
        'rehype-external-links',
        { target: '_blank', rel: ['noopener', 'noreferrer'] },
      ],
      rehypeFigureCaption,
      rehypeCdnAssets,
    ],
  },
});
