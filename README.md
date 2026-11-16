[![Netlify Status](https://api.netlify.com/api/v1/badges/032662fa-5c72-49d4-a798-44928a4509d9/deploy-status)](https://app.netlify.com/projects/stellar-queijadas-9de6fb/deploys)

# kworathur.com

A minimalist blog built with [Astro](https://astro.build) and [Decap CMS](https://decapcms.org).

| Path           | Content                                         |
| -------------- | ----------------------------------------------- |
| `/`            | Intro (with resume link) and post cards by year |
| `/blog/<slug>` | A single post                                   |
| `/now`         | What I am working on now                        |
| `/admin`       | Decap CMS editor (login required)               |

## Develop

```bash
npm install
npm run dev
```

The site runs at `http://localhost:4321`.

## Content

All content is markdown in the repository:

- `src/content/blog/<slug>/index.md` holds a post. Put its images in the same folder.
- A post can have a cover image (`featuredImage` in the front matter, set with the **Cover image** field in the CMS). The home page card shows it. A post without a cover image gets a two-color gradient.
- `src/content/now/now.md` holds the `/now` page.

You can edit these files by hand, or use the CMS.

## Edit from the browser or your phone (Decap CMS)

Go to `https://kworathur.com/admin` and log in with GitHub. You can create and edit posts and the Now page. When you tap **Publish**, Decap commits the change to `main`. Netlify then rebuilds the site. The change is live after about one minute.

On a phone, add `/admin` to your home screen for one-tap access.

### One-time setup

Decap logs in through GitHub OAuth. Netlify provides the login service, so you do not run a server.

1. In GitHub, open **Settings > Developer settings > OAuth Apps > New OAuth App**.
   - Homepage URL: `https://kworathur.com`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
2. Copy the **Client ID**. Generate a **Client secret** and copy it.
3. In Netlify, open **Project configuration > Access & security > OAuth**.
4. Choose **Install provider**, select **GitHub**, and paste the Client ID and Client secret.
5. Open `https://kworathur.com/admin` and log in. Your GitHub account needs write access to this repository.

Only GitHub users with write access to the repository can publish.

### Run the CMS locally

1. Run `npx decap-server` in one terminal.
2. Run `npm run dev` in another terminal.
3. Open `http://localhost:4321/admin/index.html`. Choose **Login**.

Local edits change files in your working tree. No login is needed.

The CMS configuration is in `public/admin/config.yml`.

## Static assets and the CDN (CloudFront)

By default, the site serves all assets itself. Set `PUBLIC_CDN_URL` (for example `https://cdn.kworathur.com`) to serve static assets from a CloudFront distribution instead. The build then uses the CDN address for:

- Built CSS, fonts (Inter, Ubuntu Mono, Albertus), and optimized images (`/_astro/*`).
- Images and files that posts reference as `/assets/...`. This includes files uploaded in the CMS.

The CMS needs no change. It keeps saving site-relative paths such as `/assets/uploads/photo.png`. The editor preview works before a deploy ends. The build rewrites the paths to the CDN.

Cover images and images in a post's folder go through Astro's image optimizer. They also come from the CDN.

### One-time setup

1. In CloudFront, create a distribution.
   - Origin domain: the Netlify address of this site (`stellar-queijadas-9de6fb.netlify.app`).
   - Origin protocol: HTTPS only.
   - Cache policy: `CachingOptimized`.
   - Alternate domain name: `cdn.kworathur.com`, with an ACM certificate from `us-east-1`.
2. In DNS, point `cdn.kworathur.com` to the CloudFront domain.
3. In Netlify, add the environment variable `PUBLIC_CDN_URL=https://cdn.kworathur.com`. Then redeploy.

`public/_headers` sets the cache rules that CloudFront follows. Hashed `/_astro/*` files cache for one year. `/assets/*` files cache for one day. Both paths send `Access-Control-Allow-Origin: *`, because browsers need it to load fonts from another domain.

To test locally, copy `.env.example` to `.env`, run `npm run build`, and look at the URLs in `dist/`.

## Scripts

| Command            | Action                    |
| ------------------ | ------------------------- |
| `npm run dev`      | Start the dev server      |
| `npm run build`    | Build the site to `dist/` |
| `npm run lint`     | Lint TypeScript and Astro |
| `npm run lint:css` | Lint styles               |
