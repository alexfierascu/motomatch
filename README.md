# Clutchless

A comparison site for motorcycles you can ride without operating a clutch or changing gears.

Built for a specific question: *what is the closest automatic equivalent to a CFMOTO 450CL-C or
450SR for a beginner who doesn't want to shift?* Every ranking on the site answers that question
rather than ranking bikes by horsepower.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks, then builds to `dist/` |
| `npm run preview` | Serves the production build |
| `npm run typecheck` | TypeScript only, no emit |
| `npm run build:single` | Bundles everything into one portable `clutchless.html` |
| `npm test` | Builds, then runs the route and interaction test suites |

`npm run build:single` produces a single self-contained HTML file that runs by double-clicking it —
no server, no install. It uses an IIFE bundle rather than an ES module so it works over `file://`.

**Stack:** React 18, TypeScript (strict), Vite 5, Tailwind CSS 4, React Router 6. No backend.

---

## The one distinction the site is built around

The site refuses to flatten "automatic" into a single category, because the three kinds mean very
different things to a rider:

| | System | What you actually do |
| --- | --- | --- |
| 🟢 **Fully automatic** | Honda DCT, Yamaha Y-AMT, CVT | Throttle and brakes. Nothing else. |
| 🟡 **Clutchless, still shifts** | Honda E-Clutch | No clutch lever, but your foot selects every gear. |
| 🔴 **Manual** | Conventional 6-speed | Clutch lever plus foot shifter. |

**Honda E-Clutch is deliberately not classified as automatic** anywhere in the data model, the
filters, or the recommendation engine. `transmission.fullyAutomatic` is `false` for it. The
`"Fully automatic"` filter excludes it, and answering "no" to *do you want to change gears* scores
it far below a DCT or Y-AMT bike.

This shows up visually in the **shift rail** — the six-segment bar on every card, table row and
detail page. One continuous green bar means nothing to shift; six amber or red cells means six
gears you pick yourself. It's the site's signature element and the fastest way to read a bike.

---

## Project structure

```
src/
  data/
    types.ts          Domain types. Start here.
    motorcycles.ts    THE DATASET — 15 bikes, with sourcing metadata
    transmissions.ts  Explanations for DCT / Y-AMT / CVT / E-Clutch / manual
  lib/
    scoring.ts        Similarity model + recommendation engine + headline stats
    filters.ts        Filter groups, predicates, sorting
    motion.ts         Parallax / reveal / count-up / scroll-progress hooks
  components/
    Transmission.tsx  Shift rail, transmission/vehicle/A2 badges
    Photo.tsx         All photography rendering (lazy, ratio-locked, credited)
    Silhouette.tsx    Procedural SVG bike profiles (fallback if a photo is missing)
    BikeCard.tsx      Photographic card used across the site
  pages/
    Home.tsx  Browse.tsx  BikeDetail.tsx  Compare.tsx  Recommend.tsx  NotFound.tsx
  App.tsx             Routing, nav, comparison selection context
tests/
  routes.test.mjs        Every route renders against the real production bundle
  interactions.test.mjs  40 checks: filters, sorting, comparison, questionnaire, drawers
  standalone.test.mjs    The single-file build boots on its own
```

**No bike facts live in components.** Every specification, price, rating, pro and con comes from
`src/data/motorcycles.ts`. Components only read from it.

---

## Adding a motorcycle

Append one object to `MOTORCYCLES` in `src/data/motorcycles.ts`. Nothing else needs to change —
filters, sorting, stats, similarity scores, the comparison table and the recommendation engine all
derive from the array.

```ts
{
  id: "honda-nx500-e-clutch",
  manufacturer: "Honda",
  model: "NX500",
  variant: "E-Clutch",
  year: 2026,
  category: "adventure",
  vehicleType: "motorcycle",
  engine: { displacement: 471, cylinders: 2, horsepower: 47, torque: 43 },
  dimensions: { weight: 196, seatHeight: 830, fuelCapacity: 17.5 },
  transmission: {
    type: "e-clutch",
    fullyAutomatic: false,   // ← E-Clutch is never true here
    manualOverride: true,
    clutchLever: true,
  },
  price: { eur: 8300, country: "EU", confidence: "approximate", note: "..." },
  a2Compatible: true,
  beginnerRating: 8,
  beginnerNote: "...",
  pros: ["..."], cons: ["..."],
  sources: ["Honda European specifications"],
  lastVerified: "August 2026",
}
```

Then run `npm test` — the suites will catch a malformed entry.

---

## Data accuracy

Specifications are manufacturer figures. Prices are the weak point and are treated as such:

- Every price carries `confidence: "confirmed" | "approximate"`, a `country`, and a `note`
  explaining where it came from.
- Anything `approximate` renders with a leading `~` throughout the UI, so an estimate never looks
  like an official quote.
- `sources` holds plain descriptions of provenance rather than invented links.
- Every bike carries `lastVerified`, surfaced under **Sources** on its detail page and in the
  footer.

To harden a price: replace the `note` with the importer document you checked it against, set
`confidence: "confirmed"`, and update `lastVerified`.

### Known soft spots

- Romanian on-the-road prices are indicative. Confirm against Yamaha Motor România, Honda România,
  and the CFMOTO importer before deciding anything.
- `zeroTo100` is omitted rather than guessed — no bike in the set has a manufacturer figure, so the
  detail page prints "No reliable figure".
- Beginner ratings are this project's editorial judgement, not a manufacturer number. The weighting
  is in `beginnerNote` on each bike.

---

## How the two algorithms work

**Similarity** (`similarityTo`) scores a candidate against a reference bike across power (30%),
weight (22%), price (18%), displacement (10%), seat height (10%) and riding position (10%). Each
axis decays linearly to zero over a tolerance, so a 1,800 cc tourer scores near zero against a 450
rather than winning on displacement.

**Recommendation** (`recommend`) scores all 15 bikes out of 10 across eight weighted factors:
transmission fit (dominant when the rider says no shifting), budget, beginner suitability, distance
from a target power figure, body style, seat height, intended use, and licence category. Power is
scored as *closeness to what you asked for*, never as more-is-better — which is why a Gold
Wing-style outlier can't win and a cheap 300 cc scooter can't beat a motorcycle on price alone.

---

## Photography

Every bike is shown with real photographs of the exact model, sourced from official manufacturer
press/product sites (Yamaha Motor Europe, Honda News Europe, CFMOTO Global, Suzuki) with Wikimedia
Commons as a licensed fallback (the BMW C 400 GT photo is CC BY-SA 4.0 by Kaule79 — attribution is
carried in the data and surfaced under **Sources** on its detail page).

The pipeline:

- **Originals** live in `images-src/` as `<id>-hero.<ext>` (environmental/press shot) and
  optionally `<id>-studio.<ext>` (clean product shot). They never ship.
- `node scripts/optimize-images.mjs` (needs macOS `sips` + `brew install webp`) generates the WebP
  files the site loads into `public/images/bikes/`: `-hero.webp` (1920w), `-card.webp` (900w, from
  the hero so cards stay visually consistent), `-studio.webp` (1280w).
- Every `Motorcycle` carries an `images` block — `hero`, `card`, `gallery`, `alt`, `source`,
  `sourceName`. Components read only from there; no image URL is hard-coded in a component.
- `Photo.tsx` renders all photography: fixed aspect-ratio frames (no layout shift), lazy loading
  below the fold, and a fall-back to the drawn `Silhouette.tsx` profile if a file is missing.

The standalone `clutchless.html` build embeds the WebP files as data URIs so it keeps its photos
with nothing else next to it.

## Design & motion

The UI is a dark editorial system: Anton for display type and oversized numbers, Inter for body
text, JetBrains Mono for technical labels, one restrained orange accent. Scroll motion lives in
`src/lib/motion.ts` — rAF-throttled parallax (`useParallax`), IntersectionObserver reveals
(`useReveal`), count-ups (`useCountUp`) and a scroll-progress hairline under the header. All of it
disables itself under `prefers-reduced-motion`, in JS and in CSS.

---

## Extending

The architecture leaves room for the obvious next features without restructuring:

- **Favourites / accounts** — the comparison selection already lives in a context in `App.tsx`;
  persist that shape.
- **Dealer prices** — `PriceInfo` is already market-aware; make it an array keyed by country.
- **Financing, insurance, maintenance costs** — add optional blocks to `Motorcycle` and render them
  as new `<Expandable>` sections on the detail page.
- **Used prices, reviews, owner ratings** — same pattern; new optional fields, new sections.

Routing uses `HashRouter` so the build works from static hosting and from the filesystem with no
server configuration. Switch to `BrowserRouter` if you deploy somewhere with rewrite rules.

---

## A licensing note worth reading before you buy

Under EU rules, taking your A2 or A test on a vehicle with no clutch lever restricts your licence
to automatics (code 78). That covers DCT, Y-AMT and every CVT scooter. Honda's E-Clutch bikes keep
a conventional gearbox and a working clutch lever, so they don't trigger it. This is the strongest
practical argument for the 🟡 category even for a rider who never wants to touch a clutch — and
it's surfaced on the home page for that reason. Confirm the current rule with your school and the
Romanian licensing authority.
