# dev-ops-challenges
KodeKloud 100 Days of DevOps: step-by-step challenge solutions, live at https://dev-ops.randomx.cloud

## How the site is built
The guides are written in Markdown (`challenges/*.md`, `contact.md`). `scripts/build.mjs` pre-renders them into
static HTML in `dist/`, with per-page titles, meta descriptions, canonical URLs, JSON-LD and WebP screenshots.
It also generates `sitemap.xml`, `robots.txt` and `llms.txt`.
Challenge titles, descriptions and tags come from the cards in `index.html`, and article styles come from
`challenges/viewer.html`.

```bash
npm install
npm run build        # writes dist/
npm run serve        # preview at http://localhost:8080
docker build -t dev-ops-challenges . && docker run -p 8080:80 dev-ops-challenges
```

When adding a challenge: add `challenges/NN-slug.md`, add its card to `index.html`, then run `npm run build`
(this also refreshes `content-dates.json` from git history; commit that file too).
