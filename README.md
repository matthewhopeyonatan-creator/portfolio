# Matthew Hope — Portfolio

"hope's grocer" — product design portfolio. Designed in Figma, built with Next.js, deployed on Vercel.

```bash
npm install
npm run dev      # http://localhost:3000
```

- `data/site.ts` — nav links, contact link, and the project cards (edit here to add/replace projects)
- `components/` — `SiteHeader`, `Hero` (tomato artwork), `ProjectCard`
- `public/home/` — image assets rendered from Figma
- `app/fonts/` — Host Grotesk + Atelier Fleur (**Fontspring demo** — replace with licensed files before launch)

Layout is measured against the 1728px Figma frame; `--u` in `app/globals.css` is one design pixel scaled to the viewport.
