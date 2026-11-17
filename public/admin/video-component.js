// Adds a "Video" button to the Markdown editor. It inserts a shortcode that
// points at a file you uploaded to S3 / CloudFront. The site build turns the
// shortcode into a <video> tag (see remarkVideoShortcode in astro.config.ts).
CMS.registerEditorComponent({
  id: 'video',
  label: 'Video',
  fields: [
    {
      name: 'src',
      label: 'Video URL',
      widget: 'string',
      hint: 'For example https://uploads.kworathur.com/videos/2026/demo.mp4',
    },
    {
      name: 'poster',
      label: 'Poster image URL',
      widget: 'string',
      required: false,
      hint: 'Shown before the video plays.',
    },
  ],
  pattern: /^\{\{< video src="([^"]*)"(?: poster="([^"]*)")? >\}\}$/,
  fromBlock(match) {
    return { src: match[1], poster: match[2] || '' };
  },
  toBlock(data) {
    const poster = data.poster ? ` poster="${data.poster}"` : '';
    return `{{< video src="${data.src}"${poster} >}}`;
  },
  toPreview(data) {
    const poster = data.poster ? ` poster="${data.poster}"` : '';
    return `<video controls playsinline preload="metadata" src="${data.src}"${poster} style="max-width:100%"></video>`;
  },
});
