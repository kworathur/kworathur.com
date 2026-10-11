import { defineConfig } from 'astro/config';
import type { Root, Element } from 'hast';

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
    ],
  },
});
