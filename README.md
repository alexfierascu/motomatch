# MotoMatch

**Find the motorcycle that fits you.** Not by engine size. Not by horsepower. By you.

MotoMatch is a motorcycle discovery platform built around one question: *what motorcycle is right
for me?* A short quiz (12 questions, ~2 minutes) profiles the rider — experience, riding style,
transmission preference, budget, physical fit, practicality — and a weighted engine scores every
motorcycle in the database against those answers. The result is a ranked, explained set of matches,
not a filtered spec table.

Live: https://motomatch.pages.dev

---

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks, then builds to `dist/` |
| `npm run preview` | Serves the production build |
| `npm run typecheck` | TypeScript only, no emit |
| `npm run build:single` | Bundles everything (photos included) into one portable HTML file |
| `npm test` | Builds, then runs routes, interactions and persona test suites |

**Stack:** React 18, TypeScript (strict), Vite 5, Tailwind CSS 4, React Router 6. No backend — the
recommendation engine runs entirely client-side, and quiz answers never leave the browser
(localStorage only).

---

## The product

```text
LANDING → FIND MY BIKE (quiz) → RECOMMENDATION ENGINE → YOUR MATCHES → EXPLORE / COMPARE
```

- **`/find-my-bike`** — the star of the product. One question per screen, large answer targets,
  multi-select riding styles, optional exact budget, an optional photo-based "which look" question,
  back/skip, animated progress, and localStorage persistence so a refresh doesn't lose answers.
- **`/explore`** — the full database with filters (manufacturer, type, price, power, transmission,
  seat height, A2…) in card and table views.
- **`/compare`** — side-by-side comparison of 2–4 machines with best-in-row markers.
- **`/bikes/:id`** — editorial detail pages: cinematic hero, key numbers, about, riding character
  meters, transmission explainer, **"Who is it for?" / "Maybe not for you if…"**, pros/cons,
  similar machines.
- **`/about`** — how the matching works, and the honesty policy.

## The matching engine (`src/lib/match.ts`)

Every bike gets a 0–100 compatibility score from eight normalized, weighted dimensions:

```text
riding style 1.6 · transmission 1.6 · budget 1.3 · experience 1.2
performance 1.2 · size & fit 1.0 · practicality 0.8 · passenger 0.6
```

Nothing is filtered away — a poor fit scores low instead of disappearing. Power is scored as
*closeness to what the rider asked for*, never more-is-better. Each result carries a per-dimension
breakdown (shown as bars in the UI) and 3–5 reasons generated from the user's actual answers and
the bike's actual numbers. `tests/personas.test.mjs` drives four very different riders through the
real quiz UI and fails if they don't get clearly different recommendations.

**Transmission honesty:** DCT, Y-AMT and CVT are fully automatic. Honda's E-Clutch is not — the
rider still shifts with their foot — and the engine, filters and copy never pretend otherwise.
Answering "absolutely no gear shifting" makes manual bikes effectively unrecommendable, which is
the point.

---

## Project structure

```
src/
  data/
    types.ts          Domain types. Start here.
    motorcycles.ts    THE DATASET — structured entries incl. editorial fields
    transmissions.ts  Explanations for DCT / Y-AMT / CVT / E-Clutch / manual
  lib/
    match.ts          The recommendation engine (dimensions, weights, reasons)
    scoring.ts        Similarity model for "closest alternatives"
    filters.ts        Explore filter groups, predicates, sorting
    motion.ts         Parallax / reveal / count-up / scroll-progress hooks
    seo.ts            Client-side page metadata
  components/
    Photo.tsx         All photography rendering (lazy, ratio-locked, credited)
    Transmission.tsx  Shift rail + badges
    Silhouette.tsx    SVG fallback if a photo is missing
    BikeCard.tsx      Photographic card
  pages/
    Home  FindMyBike  Explore  BikeDetail  Compare  About  NotFound
scripts/
  optimize-images.mjs   images-src originals → public WebP (hero/card/studio)
  merge-data-drops.mjs  Validates & merges researched entries from data-drops/
  build-single.mjs      Portable single-file build (photos inlined as data URIs)
tests/
  routes.test.mjs        Every route renders against the production bundle
  interactions.test.mjs  Filters, sorting, comparison, the full quiz flow
  personas.test.mjs      Four contrasting riders must get different matches
```

**No bike facts live in components.** Every specification, price, rating, image URL and editorial
judgement comes from `src/data/motorcycles.ts`.

## Adding a motorcycle

Append one object to `MOTORCYCLES` (or drop a researched JSON entry in `data-drops/` and run
`node scripts/merge-data-drops.mjs`). Put photo originals in `images-src/` as `<id>-hero.<ext>`
and optionally `<id>-studio.<ext>`, run `node scripts/optimize-images.mjs`, and everything —
filters, quiz scoring, comparison, similar-bike lists — picks it up automatically. Then `npm test`.

## Photography

Every bike is shown with real photographs of the exact model, sourced from official manufacturer
press/product material (Yamaha Motor Europe, Honda News Europe, Kawasaki, Suzuki, Triumph media
kits, Royal Enfield, CFMOTO, KTM, Aprilia, BMW) with Wikimedia Commons as a licensed fallback —
the BMW C 400 GT photo is CC BY-SA 4.0 (Kaule79), attribution carried in the data. Sources are
credited on each bike's page. Originals live in `images-src/` (not shipped); the site loads
optimized WebP renditions (~1920w hero / 900w card / 1280w studio).

## Data accuracy

- Specifications are manufacturer figures, sourced per bike (see each entry's `sources`).
- Prices carry `confidence` + a `note` naming the market they came from; anything approximate
  renders with a leading `~`. Always confirm with a dealer.
- Beginner, practicality, passenger and performance ratings are editorial judgement, stated as such.
- Licensing note surfaced in-app: an A2/A test taken on a clutchless vehicle restricts the licence
  to automatics (EU code 78). E-Clutch bikes keep a clutch lever and don't trigger it.

## Design & motion

Dark editorial system: Anton display type and oversized numbers, Inter body text, JetBrains Mono
technical labels, one restrained orange accent, film-grain texture, hairline separators. Scroll
motion is a ~150-line custom system (`src/lib/motion.ts`) — rAF parallax, IntersectionObserver
reveals, count-ups, scroll-progress hairline — all disabled under `prefers-reduced-motion`.

## Deployment

Static build, deployed on Cloudflare Pages (build command `npm run build`, output `dist`).
Clean URLs via `BrowserRouter` + `public/_redirects` SPA fallback; the standalone
`build:single` output switches to hash routing automatically so it still works from `file://`.
