# Abdullah Al Mazid — portfolio v4

An editable portfolio built on the same engine as Dr. Tahsina Farah Sanam's site, extended for an engineer/researcher. Every tab, section, list, colour and piece of content can be changed from the browser. Next.js 14, Tailwind CSS, Firebase.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
```

It works immediately without Firebase: the site shows the bundled content in `src/data/seed.js` and `/login` → **Open the local editor** saves edits in your browser only.

## Connect Firebase (same project as the old site)

1. `.env.local` was copied from `my-portfolio-app2`; the old `NEXT_PUBLIC_…` names still work. Check that `SUPER_ADMIN_EMAILS` and `SITE_URL` are right.
2. Publish the rules: `firebase deploy --only firestore:rules` (or paste `firestore.rules` into the console). They keep the old site's collections readable, so **the old site keeps working** until you move the domain.
3. Sign in at `/login`, then **Dashboard → Data and backups → Publish** once.
4. **Dashboard → Data → Import from your previous portfolio → Scan old site → Import**. Publications, projects, blogs, experience, education and gallery are copied from the old collections (HTML becomes Markdown, duplicates are skipped, nothing old is changed). Imported entries show an amber **Review** badge in edit mode.
5. Deploy to Vercel with the same environment variables, and add the domain in Firebase → Authentication → Authorized domains.

Both sites share one Firebase project safely. v4 uses only `site/`, `tabs/`, `items/`, `inbox/` and `admins/` (see `src/lib/collections.js`); the old site keeps `pages/`, `settings/`, `sections/`, `messages/`, `projects/`, `publications/`, `blogs/`, `experience/`, `education/`, `gallery/`. Neither site reads or writes the other's documents, and v4 ignores any document that is not in its own format.

## What is new compared with Dr. Tahsina's site

| Feature | Where |
|---|---|
| **Own page for every entry** with server-rendered title, description, Open Graph image and JSON-LD (`ScholarlyArticle`, `BlogPosting`, `CreativeWork`, `Person`, breadcrumbs). Live Firestore content is read over REST, so link previews match the live site | `/projects/<id>`, `/publications/<id>`, `/blog/<id>`, `/item/<id>` · `src/app/[slug]/[id]`, `src/lib/seo.js`, `src/lib/server/` |
| Sitemap with every entry, robots.txt, **RSS feed** | `/sitemap.xml`, `/robots.txt`, `/rss.xml` |
| **⌘K / Ctrl K command palette**: search every tab and entry, switch theme, copy email, download CV. `/` also opens it | `src/components/layout/CommandPalette.js` |
| **Visitor light/dark switch** with a chosen dark palette, no flash on load | Design → Theme · `src/lib/colorMode.js` |
| **Live CV page** generated from your lists. Per CV section: which list, all / filtered / hand-picked entries in your order, sort, limit, which fields (details, dates, badge, description as first paragraph / bullets / full, tools, image, links) and format (entries, bullet list, numbered, citations, one line per category, comma list), main or side column, page breaks; free-text sections. Whole sheet: one or two columns, photo, contact line, colour, heading style, link style (bold / underlined / coloured / plain), date position, font, spacing, text size, A4 or Letter | `/cv` · edit the CV section |
| **Citations in APA, IEEE, plain and BibTeX**, `.bib` download per paper and “Download all as BibTeX” | publication side panel / page |
| **Skill chips** layout with a depth meter (familiar / applied / core) | layout “Skill chips” |
| **Case-study projects**: stack, role, headline result, code/demo/video links, image gallery | Projects list |
| **Long-form posts**: reading time, table of contents, heading anchors, related entries | Blog |
| Typewriter hero titles, count-up numbers, Blueprint light/dark theme, Space Grotesk + Inter + JetBrains Mono | Home |
| **HTML sections and HTML tabs**: paste a snippet (blends with the site) or a whole page with its own `<style>` and `<script>` (runs isolated in a sandbox, grows to fit, follows light/dark, cannot affect the rest of the site) | Add section → *HTML / custom code*; + Tab → *HTML tab* · `src/components/ui/HtmlContent.js` |
| **LaTeX CV export**: *Download PDF* typesets the CV with pdflatex (real text, Type 1 fonts with Unicode mapping, ideal for ATS); editors also get *Open in Overleaf* (tailor one application without touching the site) and *.tex*. Compiled via `/api/latex` on latex.ytotech.com, falling back to texlive.net; set `LATEX_COMPILE_URL` to use your own LaTeX-on-HTTP server | CV page · `src/lib/cvLatex.js`, `src/app/api/latex/route.js` |
| Importer from the previous portfolio | Dashboard → Data |

Everything from the original engine is kept: editable tabs and sections (18 templates), side panel with shareable URLs, seed → browser copy → Firestore fallback, multi-admin permissions enforced by rules, bin and backups, image cropper with Cloudinary, contact inbox.

## Project map

```
src/data/seed.js              all starting content (your profile, projects, papers, skills…)
src/lib/store.js              data layer: seed → browser copy → Firestore, saves
src/lib/sections.js           section types, design options, templates
src/lib/roles.js              field roles; citation formats (APA, IEEE, BibTeX)
src/lib/seo.js, links.js      JSON-LD, canonical URLs, entry addresses
src/lib/server/               Firestore REST reads for metadata, sitemap, RSS
src/lib/legacyImport.js       import from my-portfolio-app2
src/components/sections/      hero, list, text, free layout, numbers, contact, CV
src/components/drawer/        side panel + entry detail (also used for full entry pages)
src/components/layout/        navbar, ⌘K palette, light/dark switch, editor bar
src/components/admin/         dashboard panels
```

See [ARCHITECTURE.md](ARCHITECTURE.md) and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for how the engine fits together.

## Notes

- `.env.local` holds your keys and is git-ignored. Never commit it.
- Images in `public/img` came from your v6 static site. Replace them from the editor any time.
- Course descriptions and the starter blog post are marked **Review**: rewrite them in your own words.
- Content edits do not need a deploy. Code, the seed (first paint and SEO fallback) and rules do.
