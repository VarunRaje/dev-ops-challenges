// Static site build: pre-renders every challenge markdown file to HTML so the content, title,
// meta tags and structured data are in the initial response (no client-side fetch needed).
//
// Inputs:  index.html (dashboard + challenge metadata), challenges/*.md, contact.md,
//          challenges/viewer.html (shared article styles), challenges/screenshots/**, assets/**
// Output:  dist/  (served by nginx; see nginx.conf and Dockerfile)
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import sharp from 'sharp';
import { DATES_FILE, refreshDates } from './dates.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const SITE = 'https://dev-ops.randomx.cloud';
const SITE_NAME = 'KodeKloud 100 Days of DevOps';
const OG_IMAGE = `${SITE}/assets/og-image.png`;
const MERMAID_JS = 'https://cdn.jsdelivr.net/npm/mermaid@12.0.0/dist/mermaid.min.js';
const PRISM = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0';
const AUTHOR = {
    '@type': 'Person',
    '@id': `${SITE}/contact#person`,
    name: 'Varun Deshpande',
    url: `${SITE}/contact`,
    jobTitle: 'Java & Spring Boot Developer, Cloud Microservices Specialist',
    sameAs: ['https://github.com/varunraje', 'https://www.linkedin.com/in/deshpandevarun/'],
};

const read = p => readFileSync(join(ROOT, p), 'utf8');
const write = (p, s) => { mkdirSync(dirname(join(DIST, p)), { recursive: true }); writeFileSync(join(DIST, p), s); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const text = html => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,.;:]$/, '') + '…');
const day = iso => iso.slice(0, 10);
const jsonLd = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// ---------- Challenge metadata (the dashboard cards are the source of truth) ----------
const dashboard = read('index.html');
const challenges = [...dashboard.matchAll(/<a href="\/?challenges\/([^"]+)" class="challenge-item">([\s\S]*?)<\/a>/g)].map(([, slug, card]) => {
    const field = cls => (card.match(new RegExp(`class="${cls}"[^>]*>([\\s\\S]*?)</(?:div|h3)>`)) || [])[1] || '';
    const tags = [...card.matchAll(/class="tech-badge">([^<]+)</g)].map(m => text(m[1]));
    const num = parseInt(text(field('row-num')).replace(/\D/g, ''), 10);
    return {
        slug, num, tags,
        title: text(field('row-title')),
        desc: text(field('row-desc')),
        time: text(field('row-time')),
        topic: (tags[0] || 'DevOps').split('/')[0].trim(),
    };
}).sort((a, b) => a.num - b.num);
if (challenges.length === 0) throw new Error('No challenge cards found in index.html');

// ---------- Dates ----------
refreshDates();
const dates = existsSync(DATES_FILE) ? JSON.parse(readFileSync(DATES_FILE, 'utf8')) : {};
const now = new Date().toISOString();
const datesFor = file => dates[file] || { published: now, modified: now };

// ---------- Images: PNG screenshots -> resized WebP with known dimensions ----------
const images = new Map(); // "challenges/<src>" -> { url, width, height } | null (missing)
const missing = [];
async function processImages(slug, md) {
    const used = new Set();
    for (const [, alt, src] of md.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
        const key = `${slug}|${src}`;
        if (images.has(key) || /^https?:/.test(src)) continue;
        const input = join(ROOT, 'challenges', decodeURIComponent(src));
        if (!existsSync(input)) { images.set(key, null); missing.push(`${slug}: ${decodeURIComponent(src)}`); continue; }
        let name = slugify(alt) || slugify(basename(input, '.png')) || 'image';
        for (let i = 2; used.has(name); i++) name = `${slugify(alt) || 'image'}-${i}`;
        used.add(name);
        const rel = `challenges/img/${slug}/${name}.webp`;
        mkdirSync(dirname(join(DIST, rel)), { recursive: true });
        const info = await sharp(input).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(DIST, rel));
        images.set(key, { url: `/${rel}`, width: info.width, height: info.height });
    }
}

// ---------- Markdown rendering ----------
const ALERT_ICONS = {
    NOTE: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>',
    TIP: '<path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C8.25 12.4 7.5 10.75 7.5 9c0-2.48 2.02-4.5 4.5-4.5s4.5 2.02 4.5 4.5c0 1.75-.75 3.4-2.15 4.1z"/>',
    IMPORTANT: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
    WARNING: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
    CAUTION: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>',
};

function renderMarkdown(md, slug) {
    const headingIds = new Set();
    let mermaid = false;
    let firstImage = null;
    const marked = new Marked({
        gfm: true,
        renderer: {
            heading({ tokens, depth }) {
                const inner = this.parser.parseInline(tokens);
                let id = slugify(text(inner)) || 'section';
                for (let i = 2; headingIds.has(id); i++) id = `${slugify(text(inner))}-${i}`;
                headingIds.add(id);
                return depth === 1 ? `<h1>${inner}</h1>\n` : `<h${depth} id="${id}">${inner}</h${depth}>\n`;
            },
            code({ text: code, lang }) {
                if (lang === 'mermaid') { mermaid = true; return `<div class="mermaid">${esc(code)}</div>\n`; }
                return false;
            },
            image({ href, text: alt }) {
                if (/^https?:/.test(href)) return `<img src="${esc(href)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
                const img = images.get(`${slug}|${href}`);
                if (!img) return '';
                firstImage ??= img.url;
                return `<img src="${img.url}" alt="${esc(alt)}" width="${img.width}" height="${img.height}" loading="lazy" decoding="async">`;
            },
        },
    });
    let html = marked.parse(md);
    // GitHub-style alerts: > [!NOTE] ...
    html = html.replace(/<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\s*\/?>)?\s*([\s\S]*?)<\/blockquote>/gi, (_, type, body) => {
        type = type.toUpperCase();
        return `<div class="alert-block alert-${type.toLowerCase()}"><div class="alert-header"><span class="alert-icon"><svg viewBox="0 0 24 24">${ALERT_ICONS[type]}</svg></span><span class="alert-title">${type}</span></div><div class="alert-content"><p>${body.trim()}</div></div>`;
    });
    const h1 = text((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || '');
    return { html, h1, mermaid, firstImage };
}

// ---------- Page shell ----------
const articleCss = read('challenges/viewer.html').match(/<style>([\s\S]*?)<\/style>/)[1].replace(/@import url\([^)]*\);\s*/, '');
const extraCss = `
        .kicker { font-family: 'Outfit', sans-serif; color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: .05em; font-size: .85rem; margin-bottom: .5rem; }
        .article-meta { display: flex; flex-wrap: wrap; gap: .4rem 1rem; color: var(--text-muted); font-size: .9rem; margin: -.5rem 0 2rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); }
        .article-meta a { color: var(--accent); text-decoration: none; }
        .markdown-body .mermaid:not([data-processed]) { visibility: hidden; min-height: 120px; }
        .page-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2.5rem; }
        .page-nav a, .related a { display: block; padding: 1rem 1.25rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--card-bg); color: var(--text-main); text-decoration: none; transition: border-color .2s ease; }
        .page-nav a:hover, .related a:hover { border-color: var(--accent); }
        .page-nav small, .related small { display: block; color: var(--text-muted); font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; }
        .page-nav .next { text-align: right; grid-column: 2; }
        .related { margin-top: 2rem; }
        .related h2 { font-family: 'Outfit', sans-serif; font-size: 1.2rem; margin-bottom: 1rem; }
        .related ul { list-style: none; display: grid; gap: .75rem; padding: 0; }
        .site-footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); color: var(--text-muted); font-size: .9rem; text-align: center; }
        .site-footer a { color: var(--accent); text-decoration: none; }
        @media (max-width: 576px) { .page-nav { grid-template-columns: 1fr; } .page-nav .next { grid-column: 1; } }
`;

const THEME_ICONS = `<svg class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg><svg class="moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

const FOOTER = `<footer class="site-footer">Written by <a href="/contact">Varun Deshpande</a> · <a href="https://github.com/varunraje" rel="me">GitHub</a> · <a href="https://www.linkedin.com/in/deshpandevarun/" rel="me">LinkedIn</a></footer>`;

function page({ title, description, path, ogType = 'article', schema, body, mermaid = false, published, modified }) {
    const url = `${SITE}${path}`;
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${url}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <meta name="author" content="Varun Deshpande">
    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${OG_IMAGE}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
${published ? `    <meta property="article:published_time" content="${published}">\n    <meta property="article:modified_time" content="${modified}">\n` : ''}    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap">
    <link rel="stylesheet" href="${PRISM}/themes/prism-tomorrow.min.css">
    <link rel="stylesheet" href="/assets/article.css">
    ${jsonLd(schema)}
</head>

<body>
    <div class="container">
        <nav class="nav-header" aria-label="Site">
            <a href="/" class="back-btn">
                <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                All 100 challenges
            </a>
            <button class="theme-toggle-btn" id="themeToggle" aria-label="Toggle Theme">${THEME_ICONS}</button>
        </nav>
        <main class="content-area">
${body}
            ${FOOTER}
        </main>
    </div>

    <script src="${PRISM}/prism.min.js" defer></script>
    <script src="${PRISM}/plugins/autoloader/prism-autoloader.min.js" defer></script>
${mermaid ? `    <script src="${MERMAID_JS}" defer></script>\n` : ''}    <script>
        if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
        document.getElementById('themeToggle').addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
            // Mermaid bakes the theme into generated SVGs, so re-render by reloading.
            if (document.querySelector('.mermaid')) location.reload();
        });
        window.addEventListener('DOMContentLoaded', () => {
            if (!window.mermaid) return;
            mermaid.initialize({
                startOnLoad: false,
                theme: document.body.classList.contains('light-mode') ? 'default' : 'dark',
                themeVariables: { background: '#1e293b', primaryColor: '#38bdf8' }
            });
            mermaid.run({ querySelector: '.mermaid' });
        });
    </script>
</body>

</html>
`;
}

// ---------- Build ----------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, 'assets'), join(DIST, 'assets'), { recursive: true });
write('assets/article.css', articleCss.replace(/^ {8}/gm, '').trim() + '\n' + extraCss.replace(/^ {8}/gm, ''));
for (const f of readdirSync(ROOT).filter(f => /^google[0-9a-f]+\.html$/.test(f))) cpSync(join(ROOT, f), join(DIST, f));
cpSync(join(ROOT, '404.html'), join(DIST, '404.html'));

const rewriteMdImages = (md, slug) => md.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) => {
    if (/^https?:/.test(src)) return m;
    const img = images.get(`${slug}|${src}`);
    return img ? `![${alt}](${SITE}${img.url})` : '';
});

const bySlug = new Map(challenges.map(c => [c.slug, c]));
const mdFiles = readdirSync(join(ROOT, 'challenges')).filter(f => f.endsWith('.md'));
for (const f of mdFiles) {
    if (!bySlug.has(f.replace(/\.md$/, ''))) console.warn(`warn: challenges/${f} has no dashboard card; skipped`);
}

for (const [i, c] of challenges.entries()) {
    const file = `challenges/${c.slug}.md`;
    if (!existsSync(join(ROOT, file))) throw new Error(`Missing ${file} for dashboard card ${c.num}`);
    const md = read(file);
    await processImages(c.slug, md);
    const { html, h1, mermaid, firstImage } = renderMarkdown(md, c.slug);
    const { published, modified } = datesFor(file);
    const path = `/challenges/${c.slug}`;
    const dayLabel = `Day ${String(c.num).padStart(2, '0')}`;
    let title = `${dayLabel}: ${c.title} | ${SITE_NAME}`;
    if (title.length > 70) title = `${dayLabel}: ${c.title} | KodeKloud DevOps`;
    if (title.length > 70) title = `${dayLabel}: ${c.title} | KodeKloud`;
    const description = clip(`${c.desc} Step-by-step KodeKloud 100 Days of DevOps solution (${dayLabel}) with commands, explanations and verification.`, 158);
    const prev = challenges[i - 1], next = challenges[i + 1];
    const related = challenges
        .filter(o => o.topic === c.topic && o !== c && o !== prev && o !== next)
        .sort((a, b) => Math.abs(a.num - c.num) - Math.abs(b.num - c.num)).slice(0, 3);
    const link = (o, label, cls = '') => `<a href="/challenges/${o.slug}"${cls ? ` class="${cls}"` : ''}${label === 'Previous' ? ' rel="prev"' : label === 'Next' ? ' rel="next"' : ''}><small>${label} · Day ${String(o.num).padStart(2, '0')}</small>${esc(o.title)}</a>`;

    const meta = `<p class="article-meta"><span>By <a href="/contact" rel="author">Varun Deshpande</a></span><span>Published <time datetime="${published}">${day(published)}</time></span>${day(modified) !== day(published) ? `<span>Updated <time datetime="${modified}">${day(modified)}</time></span>` : ''}<span>${esc(c.tags.join(', '))}</span>${c.time ? `<span>~${esc(c.time)} to complete</span>` : ''}</p>`;
    const article = html.replace(/<h1>/, `<p class="kicker">${dayLabel} · ${esc(c.topic)}</p>\n<h1>`).replace(/<\/h1>\n?/, `</h1>\n${meta}\n`);
    const body = `            <article class="markdown-body">
${article}
            </article>
            <nav class="page-nav" aria-label="Challenge navigation">${prev ? link(prev, 'Previous') : ''}${next ? link(next, 'Next', 'next') : ''}</nav>
${related.length ? `            <section class="related"><h2>Related ${esc(c.topic)} challenges</h2><ul>${related.map(o => `<li>${link(o, 'Related')}</li>`).join('')}</ul></section>` : ''}`;

    const hours = parseInt(c.time, 10);
    const schema = [{
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: clip(h1 || c.title, 110),
        description,
        url: `${SITE}${path}`,
        mainEntityOfPage: `${SITE}${path}`,
        datePublished: published,
        dateModified: modified,
        author: AUTHOR,
        publisher: { '@id': AUTHOR['@id'] },
        image: firstImage ? `${SITE}${firstImage}` : OG_IMAGE,
        inLanguage: 'en',
        keywords: [...c.tags, 'KodeKloud', '100 Days of DevOps', dayLabel].join(', '),
        about: c.tags.map(name => ({ '@type': 'Thing', name })),
        ...(hours ? { timeRequired: `PT${hours}H` } : {}),
        isPartOf: { '@type': 'WebSite', '@id': `${SITE}/#website`, name: SITE_NAME, url: `${SITE}/` },
    }, {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: `${dayLabel}: ${c.title}`, item: `${SITE}${path}` },
        ],
    }];

    write(`${path.slice(1)}.html`, page({ title, description, path, schema, body, mermaid, published, modified }));
    write(file, rewriteMdImages(md, c.slug));
    Object.assign(c, { published, modified, path });
}

// About / contact page
{
    const md = read('contact.md');
    const { html } = renderMarkdown(md, 'contact');
    const { published, modified } = datesFor('contact.md');
    const description = 'Varun Deshpande: Java & Spring Boot developer and cloud microservices specialist. KodeKloud 100 Days of DevOps certified. Skills, certification and contact details.';
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        url: `${SITE}/contact`,
        dateCreated: published,
        dateModified: modified,
        mainEntity: {
            ...AUTHOR,
            knowsAbout: ['Java', 'Spring Boot', 'Microservices', 'Docker', 'Kubernetes', 'Terraform', 'AWS', 'Jenkins', 'Ansible', 'Linux'],
            hasCredential: {
                '@type': 'EducationalOccupationalCredential',
                name: 'KodeKloud 100 Days of DevOps Completion Certificate',
                credentialCategory: 'certificate',
                url: 'https://engineer.kodekloud.com/certificate-verification/230a8a7b-b2e6-4d2e-a072-1a98d8eef0f3',
                dateCreated: '2026-08-12',
                recognizedBy: { '@type': 'Organization', name: 'KodeKloud', url: 'https://kodekloud.com' },
            },
        },
    };
    const body = `            <article class="markdown-body">\n${html}\n            </article>`;
    write('contact.html', page({ title: 'About Varun Deshpande | Java, Cloud & DevOps Engineer', description, path: '/contact', ogType: 'profile', schema, body }));
    write('contact.md', md);
}

// Dashboard: inject structured data generated from the same card list
{
    const schema = [{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        name: SITE_NAME,
        url: `${SITE}/`,
        inLanguage: 'en',
        author: AUTHOR,
        publisher: { '@id': AUTHOR['@id'] },
    }, {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${SITE_NAME}: all challenge solutions`,
        numberOfItems: challenges.length,
        itemListElement: challenges.map(c => ({ '@type': 'ListItem', position: c.num, url: `${SITE}${c.path}`, name: `Day ${c.num}: ${c.title}` })),
    }];
    write('index.html', dashboard.replace('</head>', `    ${jsonLd(schema)}\n</head>`));
}

// robots.txt, sitemap.xml, llms.txt
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

const latest = challenges.map(c => c.modified).sort().at(-1);
const urls = [
    { loc: `${SITE}/`, lastmod: latest },
    { loc: `${SITE}/contact`, lastmod: datesFor('contact.md').modified },
    ...challenges.map(c => ({ loc: `${SITE}${c.path}`, lastmod: c.modified })),
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${day(u.lastmod)}</lastmod></url>`).join('\n')}
</urlset>
`);

const topics = [...new Set(challenges.map(c => c.topic))];
write('llms.txt', `# ${SITE_NAME}: hands-on solutions by Varun Deshpande

> Step-by-step solutions to all 100 KodeKloud "100 Days of DevOps" challenges, covering Linux administration, Git, Docker, Kubernetes, Jenkins, Ansible and Terraform on AWS. Each guide explains the concept, lists the exact commands and shows how to verify the result. Every guide is available as clean Markdown at the URLs below.

${topics.map(t => `## ${t}\n\n${challenges.filter(c => c.topic === t).map(c => `- [Day ${c.num}: ${c.title}](${SITE}${c.path}.md): ${c.desc}`).join('\n')}`).join('\n\n')}

## About

- [About the author](${SITE}/contact.md): Varun Deshpande, Java & Spring Boot developer and cloud microservices specialist
`);

console.log(`Built ${challenges.length} challenge pages, ${[...images.values()].filter(Boolean).length} images -> dist/`);
if (missing.length) console.warn(`warn: ${missing.length} referenced images are missing and were omitted:\n  ${missing.join('\n  ')}`);
