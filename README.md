[![Netlify Status](https://api.netlify.com/api/v1/badges/032662fa-5c72-49d4-a798-44928a4509d9/deploy-status)](https://app.netlify.com/projects/stellar-queijadas-9de6fb/deploys)

# kworathur.com

A minimalist blog built with [Astro](https://astro.build) and [Decap CMS](https://decapcms.org).

| Path           | Content                                        |
| -------------- | ---------------------------------------------- |
| `/`            | Intro (with resume link) and list of all posts |
| `/blog/<slug>` | A single post                                  |
| `/now`         | What I am working on now                       |
| `/admin`       | Decap CMS editor (login required)              |

## Develop

```bash
npm install
npm run dev
```

The site runs at `http://localhost:4321`.

## Content

All content is markdown in the repository:

- `src/content/blog/<slug>/index.md` holds a post. Put its images in the same folder.
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

## Scripts

| Command            | Action                    |
| ------------------ | ------------------------- |
| `npm run dev`      | Start the dev server      |
| `npm run build`    | Build the site to `dist/` |
| `npm run lint`     | Lint TypeScript and Astro |
| `npm run lint:css` | Lint styles               |
