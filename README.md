[![Netlify Status](https://api.netlify.com/api/v1/badges/032662fa-5c72-49d4-a798-44928a4509d9/deploy-status)](https://app.netlify.com/projects/stellar-queijadas-9de6fb/deploys)

# kworathur.com

A minimalist blog built with [Astro](https://astro.build) and [Sanity](https://www.sanity.io) as the headless CMS.

| Path           | Content                                        |
| -------------- | ---------------------------------------------- |
| `/`            | Intro (with resume link) and list of all posts |
| `/blog/<slug>` | A single post                                  |
| `/now`         | What I am working on now                       |

## Develop

```bash
npm install
npm run dev
```

The site runs at `http://localhost:4321`. Without `SANITY_PROJECT_ID`, the site builds from the local markdown only:

- `src/content/blog/<slug>/index.md` holds a post.
- `src/content/now/now.md` holds the `/now` page.

## Write from your phone (Sanity CMS)

Posts and the `/now` page live in a hosted Sanity Studio. The Studio works in a phone browser. Add it to your home screen for one-tap access.

The Studio code is in `studio/`. It defines two content types:

- **Post**: title, slug, published date, description, and a rich-text body (headings, lists, links, quotes, images, code).
- **Now page**: a single document with a rich-text body. The site shows the last publish date automatically.

A CMS post with the same slug as a local markdown post replaces the local post.

### One-time setup

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage). Note the project ID.
2. Copy `studio/.env.example` to `studio/.env`. Set `SANITY_STUDIO_PROJECT_ID`.
3. Deploy the Studio:

   ```bash
   cd studio
   npm install
   npx sanity login
   npx sanity deploy
   ```

   Choose a hostname. The Studio is then available at `https://<hostname>.sanity.studio`.

4. In Netlify, open **Site configuration > Environment variables**. Add `SANITY_PROJECT_ID`. Add `SANITY_DATASET` if it is not `production`.
5. In Netlify, open **Site configuration > Build & deploy > Build hooks**. Create a build hook and copy its URL.
6. In Sanity, open **API > Webhooks** and create a webhook:
   - URL: the Netlify build hook URL
   - Trigger on: Create, Update, Delete
   - Filter: `_type in ["post", "now"]`
   - Projection: leave empty
   - Drafts: off

### Publish a post

1. Open the Studio on your phone.
2. Create a Post. Write the content.
3. Tap **Publish**.

The webhook starts a Netlify build. The post appears on the site after about one minute.

## Scripts

| Command            | Action                    |
| ------------------ | ------------------------- |
| `npm run dev`      | Start the dev server      |
| `npm run build`    | Build the site to `dist/` |
| `npm run lint`     | Lint TypeScript and Astro |
| `npm run lint:css` | Lint styles               |
