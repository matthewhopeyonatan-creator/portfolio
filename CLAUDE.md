# hope's grocer — Matthew Hope's portfolio

A product design portfolio themed as a grocery store ("hope's grocer"): projects are produce in
trays, graphics are posters on a shelf, the nav has a cart. Matthew designs in Figma; code
implements his designs faithfully.

- Figma file: `DbnQGTZoiTkrrOSdZe2pk1` (desktop frame is 1728px wide)
- Repo: `matthewhopeyonatan-creator/portfolio` (branch `main`)
- Hosting: Vercel project `prj_B4zwQpO3ISVDqxZxeWGtSUZpbhKP` — production deploys from `main`
- Live: portfolio-ivory-one-okvhn31le5.vercel.app (old Framer site: matthew-hope.com)

## Matthew's rules — follow these every time

1. **Never pure black.** The ink colour is `#282828` (`--color-ink`). No `#000`, no `black`, no
   `rgba(0,0,0,…)` in new code — use `rgba(40, 40, 40, …)`.
2. **40px side margins** (`--gutter`; 16px on phones). Everything lines up on them. Vertical gaps
   that sit against a margin should visually match it (e.g. the hero headline's gap under the
   navbar equals the side margin at every window size).
3. **Don't change what he's already defined.** Only touch what the request is about. If a fix
   would alter an existing look, timing or layout he signed off on, say so and ask first.
4. **Motion is smooth and classy.** Subtle, purposeful, never gimmicky. See *Motion* below.
5. **Match Figma exactly** when implementing a frame — sizes, spacing, fonts, rotations.
6. He reverts things he doesn't like quickly. When an experiment is rejected, remove it fully
   (files, assets, CSS) rather than leaving it commented out.

## Stack

- Next.js (App Router) + React + TypeScript, **CSS Modules** (one `.module.css` per component).
  No Tailwind, no UI library, no motion library.
- Smooth scrolling: **Lenis** (`components/SmoothScroll.tsx`). Don't add CSS `scroll-behavior`.
- Scripts: `npm run dev`, `npm run build`, `npm run start`. Always `npm run build` before shipping.

## Layout units

- `--u` = `100vw / 1728` → 1 Figma px at the current width. Write sizes as `calc(N * var(--u))`,
  usually with a `max()` floor for small screens.
- `--hu` hero unit, `--tu` tomato scale (Hero), `--pu` project-popup unit, `--cu` cart unit,
  `--c` sticker-card unit — each = 1 Figma px inside that component.
- `--header-h` navbar height. Phones/portrait get their own `@media (max-width: 767px)` rules.

## Where things live

- `app/page.tsx` home · `app/catalog/page.tsx` catalog · `app/globals.css` tokens + scroll reveals
- `data/site.ts` — nav links, projects, posters (`grocersSelects`), cart catalog, catalog aisles
- `data/caseStudies.ts` — project case-study content
- `components/`
  - `Hero` — tomatoes, stickers (peel on hover → `StickerCard` story), Open-sign intro
  - `SiteHeader` / `SiteFooter` — navbar hides on scroll down, shows on scroll up
  - `ProjectCard` → `ProjectOverlay` — tray with plastic-wrap peel; opens the "Nutrition Facts"
    popup, which can expand to a full-screen case study (`?project=slug` restores it on refresh)
  - `GrocersSelects` — poster shelf; click zooms a close-up (`PosterView`) and adds to cart
  - `Catalog` — aisle list; each aisle opens a popup addressed by hash (`/catalog#graphics`)
  - `cart/` — `CartContext` (localStorage) + `CartDrawer`
  - `RevealOnScroll` — `data-reveal="up|tray|swipe|roll"` entrances, staggered by `--i`
- `lib/intro.ts` — the Open-sign intro plays **only** on a first load/refresh of `/`; navigating
  back home skips it (`shouldSkipIntro`, `.skip` in Hero)

## Navigation behaviour (keep working)

- Navbar: about → external matthew-hope.com/about · projects → `/#seasonal-picks` · catalog → `/catalog`
- "See full catalog" → `/catalog#graphics` (opens the Graphics popup, page at the top)
- Logo on `/` scrolls to top; elsewhere it links home. Cross-page section links land on the section.
- Catalog popups sit at z-index 45, under the navbar (50), so the bar stays clickable.

## Motion

Shared tokens in `app/globals.css` — use these, don't hand-type new cubic-beziers:

| Token | Use |
| --- | --- |
| `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` | UI entering/exiting, hover |
| `--ease-in-out` `cubic-bezier(0.77, 0, 0.175, 1)` | things moving on screen |
| `--ease-drawer` `cubic-bezier(0.32, 0.72, 0, 1)` | cart sheet |
| `--ease-intro` `cubic-bezier(0.16, 1, 0.3, 1)` | page load-ins, scroll reveals |
| `--ease-peel` `cubic-bezier(0.3, 0.7, 0.2, 1)` | sticker / plastic peel |
| `--ease-pop` `cubic-bezier(0.3, 1.6, 0.5, 1)` | playful overshoot (cart hop, dots) |
| `--dur-press` 160ms · `--dur-hover` 250ms · `--dur-exit` 240ms | |

- Animate `transform` and `opacity` (and `clip-path`) only — never `width/height/top/left/
  font-size/margin`. For size changes use FLIP (see `ProjectOverlay.tsx` `toggle`).
- Closing is quicker than opening, and exits mirror their entrance.
- Hover motion goes inside `@media (hover: hover) and (pointer: fine)`; add `:active` press
  feedback (`scale(0.97)`, `--dur-press`) to clickable things.
- Every animation has a `prefers-reduced-motion` fallback (gentler — a fade — not nothing).
- The hero intro (Open sign, tomato drops, headline rise) and the peels are hand-tuned; leave
  their timings alone unless asked.

## Assets

- Images in `public/` as WebP/SVG. Hero tomatoes use `unoptimized` on `next/image` (the optimizer
  softened them). If an image looks stale after replacing it, rename the file — the optimizer
  caches by path.
- Blurred SVGs need padded viewBox/filter regions or the blur gets clipped at the edge.

## Checking work

- Build, then check in a real browser at a few widths (1728, 1440, 1280, ~900, 390 phone).
- When using `next start` for tests, use a fresh port each run — a stale server serves old chunks.
- Re-check the navigation behaviour above after touching links, scroll or popups.

## Shipping

- Commit to `main` with a plain-English message of what changed visually, push, and production
  deploys on Vercel. Tell Matthew in one or two lines what changed and where to look.
